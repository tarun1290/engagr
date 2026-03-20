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
    .limit(10)
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

export async function getAccountsFromToken(code) {
  const appId = process.env.NEXT_PUBLIC_FACEBOOK_APP_ID || "2989539487909963";
  const appSecret = process.env.META_APP_SECRET;
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "https://aidmbot.vercel.app";
  const redirectUri = `${appUrl}/onboarding`;

  try {
    if (!appSecret) throw new Error("Missing META_APP_SECRET in environment variables.");

    // Exchange Instagram auth code for short-lived token
    const exchangeRes = await fetch("https://api.instagram.com/oauth/access_token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        client_id: appId,
        client_secret: appSecret,
        grant_type: "authorization_code",
        redirect_uri: redirectUri,
        code,
      }),
    });
    const exchangeData = await exchangeRes.json();
    if (exchangeData.error_type || !exchangeData.access_token) {
      throw new Error(exchangeData.error_message || "Instagram token exchange failed.");
    }

    let token = exchangeData.access_token;

    // Upgrade to long-lived token (60 days)
    try {
      const longRes = await fetch(
        `https://graph.instagram.com/access_token?grant_type=ig_exchange_token&client_secret=${appSecret}&access_token=${token}`
      );
      const longData = await longRes.json();
      if (!longData.error && longData.access_token) token = longData.access_token;
    } catch { /* keep short-lived on failure */ }

    // Get Instagram user info
    const meRes = await fetch(`https://graph.instagram.com/me?fields=id,username,name&access_token=${token}`);
    const me = await meRes.json();
    if (me.error) throw new Error(me.error.message);

    return {
      success: true,
      accounts: [{
        pageId: null,
        pageToken: token,
        igId: me.id,
        username: me.username,
        name: me.name || me.username,
        profilePic: null,
        isIgToken: true,
      }],
      totalPages: 1,
    };
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
    // Business Login for Instagram → subscribe via graph.instagram.com
    const subUrl = new URL(`https://graph.instagram.com/v25.0/me/subscribed_apps`);
    subUrl.searchParams.set('subscribed_fields', 'comments,messages,message_reactions,messaging_seen,messaging_postbacks,messaging_referral,standby,live_comments,mentions');
    subUrl.searchParams.set('access_token', accessToken);
    const subRes = await fetch(subUrl.toString(), { method: "POST" });
    const subData = await subRes.json();
    if (!subData.success) {
      console.warn("[Subscription] Warning:", subData.error?.message || JSON.stringify(subData));
    } else {
      console.log("[Subscription] Subscribed to webhook fields successfully.");
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
      isConnected: true,
      tokenExpired: false,
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
    const profileRes = await fetch(`https://graph.instagram.com/v25.0/me?fields=id,username,name,profile_picture_url,followers_count,media_count&access_token=${user.instagramAccessToken}`);
    const profileData = await profileRes.json();
    if (!profileData.error) {
      profilePicture = profileData.profile_picture_url || null;
      followersCount = profileData.followers_count || 0;
    }

    const mediaRes = await fetch(`https://graph.instagram.com/v25.0/me/media?fields=id,media_type,media_url,thumbnail_url,permalink,caption,like_count,comments_count&limit=18&access_token=${user.instagramAccessToken}`);
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
