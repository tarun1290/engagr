"use server";

import { cookies } from "next/headers";
import dbConnect from "@/lib/dbConnect";
import Event from "@/models/Event";
import User from "@/models/User";
import { generateToken, verifyToken } from "@/lib/jwt";

async function getOwnerId() {
  const cookieStore = await cookies();
  const token = cookieStore.get("auth_token")?.value;
  if (token) {
    const payload = await verifyToken(token);
    if (payload?.userId) return payload.userId;
  }
  return process.env.OWNER_USER_ID || "owner";
}

export async function getDashboardStats() {
  const userId = await getOwnerId();

  await dbConnect();

  const user = await User.findOne({ userId });
  if (!user || !user.isConnected) {
    return { contacts: 0, sentToday: 0, transmissionTrend: 0, latestEvents: [] };
  }

  const businessId = user.instagramBusinessId;

  const totalContacts = await Event.distinct("from.id", { targetBusinessId: businessId }).then(ids => ids.length);

  const startOfDay = new Date();
  startOfDay.setHours(0, 0, 0, 0);

  const sentToday = await Event.countDocuments({
    targetBusinessId: businessId,
    "reply.status": "sent",
    createdAt: { $gte: startOfDay }
  });

  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  const startOfYesterday = new Date(yesterday.setHours(0, 0, 0, 0));

  const sentYesterday = await Event.countDocuments({
    targetBusinessId: businessId,
    "reply.status": "sent",
    createdAt: { $gte: startOfYesterday, $lt: startOfDay }
  });

  const transmissionTrend = sentYesterday === 0 ? 0 : Math.round(((sentToday - sentYesterday) / sentYesterday) * 100);

  const totalInteractions = await Event.countDocuments({ targetBusinessId: businessId });

  const interactionsByType = await Event.aggregate([
    { $match: { targetBusinessId: businessId } },
    { $group: { _id: "$type", count: { $sum: 1 } } },
    { $sort: { count: -1 } }
  ]);

  const recentInteractions = await Event.find({ targetBusinessId: businessId })
    .sort({ createdAt: -1 })
    .limit(25)
    .lean();

  return {
    contacts: totalContacts,
    sentToday,
    transmissionTrend,
    totalInteractions,
    interactionsByType,
    recentInteractions: JSON.parse(JSON.stringify(recentInteractions)),
    instagram: {
      username: user.instagramUsername,
      profilePic: user.instagramProfilePic || null,
      isConnected: user.isConnected
    }
  };
}

export async function getAccountsFromToken(tokenOrCode, isCode = false) {
  // Use Facebook App ID (JS SDK / dialog/oauth flow)
  const appId = process.env.NEXT_PUBLIC_FACEBOOK_APP_ID || "777188381785658";
  const appSecret = process.env.META_APP_SECRET;
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "https://aidmbot.vercel.app";
  const redirectUri = `${appUrl}/onboarding`;

  let token = tokenOrCode;

  try {
    if (isCode) {
      if (!appSecret) {
        throw new Error("Missing META_APP_SECRET in environment variables.");
      }

      // Exchange auth code for short-lived token
      const exchangeRes = await fetch(
        `https://graph.facebook.com/v25.0/oauth/access_token?client_id=${appId}&client_secret=${appSecret}&redirect_uri=${encodeURIComponent(redirectUri)}&code=${tokenOrCode}`
      );
      const exchangeData = await exchangeRes.json();

      if (exchangeData.error) {
        throw new Error(`Token exchange failed: ${exchangeData.error.message}`);
      }

      token = exchangeData.access_token;

      // Try to upgrade to long-lived token (works for FB User Tokens; may be a no-op for IG tokens — that's fine)
      if (appSecret) {
        try {
          const longTokenRes = await fetch(
            `https://graph.facebook.com/v25.0/oauth/access_token?grant_type=fb_exchange_token&client_id=${appId}&client_secret=${appSecret}&fb_exchange_token=${token}`
          );
          const longTokenData = await longTokenRes.json();
          if (!longTokenData.error && longTokenData.access_token) {
            token = longTokenData.access_token;
          }
        } catch { /* keep short-lived token on failure */ }
      }
    }

    // ── Approach 1: Facebook User Token + Pages ──
    // Works when the user has a Facebook Page linked to their Instagram Business account.
    const pagesRes = await fetch(
      `https://graph.facebook.com/v25.0/me/accounts?fields=name,access_token,instagram_business_account{id,username,name}&access_token=${token}`
    );
    const pagesData = await pagesRes.json();

    if (!pagesData.error && pagesData.data?.length > 0) {
      const accounts = pagesData.data
        .filter(p => !!p.instagram_business_account)
        .map(p => ({
          pageId: p.id,
          pageToken: p.access_token,
          igId: p.instagram_business_account.id,
          username: p.instagram_business_account.username,
          name: p.instagram_business_account.name,
          profilePic: null,
          isIgToken: false,
        }));
      if (accounts.length > 0) {
        return { success: true, accounts, totalPages: pagesData.data.length };
      }
    }

    // ── Approach 2: Facebook User Token + instagram_business_accounts edge ──
    // Works when the user authenticated via config_id (Instagram Login for Business)
    // but does NOT have a Facebook Page — the token is a Facebook User Token that has
    // instagram_business_basic permission granted directly.
    const igBizRes = await fetch(
      `https://graph.facebook.com/v25.0/me/instagram_business_accounts?fields=id,username,name&access_token=${token}`
    );
    const igBizData = await igBizRes.json();

    if (!igBizData.error && igBizData.data?.length > 0) {
      const accounts = igBizData.data.map(ig => ({
        pageId: null,
        pageToken: token,
        igId: ig.id,
        username: ig.username,
        name: ig.name,
        profilePic: null,
        isIgToken: true,
      }));
      return { success: true, accounts, totalPages: igBizData.data.length };
    }

    // Nothing found — surface the most useful error
    const reason = pagesData.error?.message || igBizData.error?.message || "No Instagram Business account found.";
    return { success: true, accounts: [], totalPages: 0, debugReason: reason };
  } catch (err) {
    return { success: false, error: err.message };
  }
}

export async function saveDiscoveredAccount(details) {
  const userId = await getOwnerId();

  await dbConnect();

  const accessToken = details.userToken || details.pageToken;
  if (!accessToken) {
    return { success: false, error: "No access token found for this account." };
  }

  try {
    // Instagram User Token → subscribe via IG user endpoint
    // Facebook Page Token  → subscribe via Page endpoint
    const subEndpoint = details.isIgToken
      ? `https://graph.facebook.com/v25.0/${details.igId}/subscribed_apps?access_token=${details.pageToken}`
      : `https://graph.facebook.com/v25.0/${details.pageId}/subscribed_apps?access_token=${details.pageToken}`;

    const subRes = await fetch(subEndpoint, { method: "POST" });
    const subData = await subRes.json();
    if (!subData.success) {
      console.warn("[Subscription] Subscription warning:", subData.error);
    }
  } catch (err) {
    console.error("[Subscription] Failed to subscribe:", err.message);
  }

  await User.findOneAndUpdate(
    { userId },
    {
      instagramAccessToken: accessToken,
      instagramBusinessId: details.igId,
      instagramUsername: details.username,
      instagramProfilePic: details.profilePic,
      pageId: details.pageId,
      pageAccessToken: details.pageToken,
      isConnected: true,
    },
    { upsert: true, new: true }
  );

  // Generate master JWT and set as httpOnly cookie (30-day session)
  const jwtToken = await generateToken({ userId });
  const cookieStore = await cookies();
  cookieStore.set("auth_token", jwtToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 60 * 60 * 24 * 30,
    path: "/",
  });

  return { success: true, username: details.username };
}

export async function saveAutomation(data) {
  const userId = await getOwnerId();

  await dbConnect();

  const user = await User.findOneAndUpdate(
    { userId },
    {
      automation: {
        postTrigger: data.postTrigger,
        selectedPostId: data.selectedPostId,
        commentTrigger: data.commentTrigger,
        keywords: data.keywords ? data.keywords.split(',').map(k => k.trim()).filter(k => k) : [],
        replyEnabled: data.replyEnabled,
        replyMessages: data.replyMessages || [],
        dmContent: data.dmContent,
        buttonText: data.buttonText,
        linkUrl: data.linkUrl,
        isActive: true,
      }
    },
    { new: true }
  );

  return { success: true, automation: JSON.parse(JSON.stringify(user.automation)) };
}

export async function getInstagramAccount() {
  const userId = await getOwnerId();

  await dbConnect();
  const user = await User.findOne({ userId });

  if (!user || !user.isConnected) {
    return { isConnected: false };
  }

  let media = [];
  let profilePicture = null;
  let followersCount = 0;

  try {
    const profileRes = await fetch(`https://graph.facebook.com/v25.0/${user.instagramBusinessId}?fields=profile_picture_url,followers_count&access_token=${user.instagramAccessToken}`);
    const profileData = await profileRes.json();
    if (profileData.profile_picture_url) {
      profilePicture = profileData.profile_picture_url;
      followersCount = profileData.followers_count || 0;
    }

    const mediaRes = await fetch(`https://graph.facebook.com/v25.0/${user.instagramBusinessId}/media?fields=id,media_type,media_url,thumbnail_url,permalink,caption,like_count,comments_count&limit=12&access_token=${user.instagramAccessToken}`);
    const mediaData = await mediaRes.json();
    if (mediaData.data) media = mediaData.data;
  } catch (error) {
    console.error("Failed to fetch Instagram account details:", error);
  }

  return {
    isConnected: true,
    username: user.instagramUsername,
    businessId: user.instagramBusinessId,
    profilePicture,
    followersCount,
    media,
    automation: user.automation ? JSON.parse(JSON.stringify(user.automation)) : null
  };
}

export async function getNotifications() {
  const userId = await getOwnerId();

  await dbConnect();

  const user = await User.findOne({ userId });
  if (!user || !user.isConnected) return [];

  const notifications = await Event.find({
    targetBusinessId: user.instagramBusinessId,
    "reply.status": "sent"
  })
    .sort({ createdAt: -1 })
    .limit(10)
    .lean();

  return JSON.parse(JSON.stringify(notifications));
}
