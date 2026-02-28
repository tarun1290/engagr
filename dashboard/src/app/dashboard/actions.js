"use server";

import dbConnect from "@/lib/dbConnect";
import Event from "@/models/Event";
import User from "@/models/User";
import { auth, currentUser } from "@clerk/nextjs/server";

export async function getDashboardStats() {
  const { userId } = await auth();
  if (!userId) throw new Error("Unauthorized");

  await dbConnect();
  
  const user = await User.findOne({ clerkId: userId });
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
  const startOfYesterday = new Date(yesterday.setHours(0,0,0,0));
  
  const sentYesterday = await Event.countDocuments({
      targetBusinessId: businessId,
      "reply.status": "sent",
      createdAt: { $gte: startOfYesterday, $lt: startOfDay }
  });

  const transmissionTrend = sentYesterday === 0 ? 0 : Math.round(((sentToday - sentYesterday) / sentYesterday) * 100);

  const latestEvents = await Event.find({ targetBusinessId: businessId })
    .sort({ createdAt: -1 })
    .limit(5)
    .lean();

  return {
    contacts: totalContacts,
    sentToday,
    transmissionTrend,
    latestEvents: JSON.parse(JSON.stringify(latestEvents)),
    instagram: {
      username: user.instagramUsername,
      profilePic: user.instagramProfilePic || null,
      isConnected: user.isConnected
    }
  };
}

export async function getAccountsFromToken(tokenOrCode, isCode = false) {
  const { userId } = await auth();
  if (!userId) throw new Error("Unauthorized");

  const appId = process.env.NEXT_PUBLIC_INSTAGRAM_APP_ID || "2155335488543802";
  const appSecret = process.env.FB_APP_SECRET; // Ensure this is in your .env
  const redirectUri = process.env.NEXT_PUBLIC_APP_URL ? `${process.env.NEXT_PUBLIC_APP_URL}/onboarding` : "http://localhost:3000/onboarding";

  let token = tokenOrCode;

  try {
    if (isCode) {
      if (!appSecret) throw new Error("Server configuration error: Missing FB_APP_SECRET.");
      
      // Exchange code for token
      const exchangeRes = await fetch(`https://api.instagram.com/oauth/access_token`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({
          client_id: appId,
          client_secret: appSecret,
          grant_type: 'authorization_code',
          redirect_uri: redirectUri,
          code: tokenOrCode
        })
      });
      
      const exchangeData = await exchangeRes.json();
      if (exchangeData.error_message || exchangeData.error) {
        throw new Error(exchangeData.error_message || "Token exchange failed");
      }
      token = exchangeData.access_token;
    }

    // Now fetch accounts using the token
    const res = await fetch(`https://graph.facebook.com/v25.0/me/accounts?fields=name,access_token,instagram_business_account{id,username,name,profile_picture_url}&access_token=${token}`);
    const data = await res.json();
    
    if (data.error) {
      console.error("[Instagram API Error]", data.error);
      throw new Error(data.error.message);
    }

    console.log(`[Discovery] Found ${data.data?.length || 0} potential accounts. Checking for Instagram links...`);
    
    const accounts = data.data
      ?.filter(p => !!p.instagram_business_account)
      .map(p => ({
        pageId: p.id,
        pageToken: p.access_token,
        igId: p.instagram_business_account.id,
        username: p.instagram_business_account.username,
        name: p.instagram_business_account.name,
        profilePic: p.instagram_business_account.profile_picture_url
      }));

    return { 
      success: true, 
      accounts, 
      totalPages: data.data?.length || 0 
    };
  } catch (err) {
    return { success: false, error: err.message };
  }
}

export async function saveDiscoveredAccount(details) {
  const { userId } = await auth();
  if (!userId) throw new Error("Unauthorized");

  await dbConnect();

  // For product-ready automation, the Page Access Token is used to interact with Instagram
  const accessToken = details.userToken || details.pageToken;

  if (!accessToken) {
    return { success: false, error: "No access token found for this account." };
  }

  const user = await User.findOneAndUpdate(
    { clerkId: userId },
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

  return { success: true, username: details.username };
}

export async function saveAutomation(data) {
  const { userId } = await auth();
  if (!userId) throw new Error("Unauthorized");

  await dbConnect();

  const user = await User.findOneAndUpdate(
    { clerkId: userId },
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
  const { userId } = await auth();
  if (!userId) return null;

  await dbConnect();
  const user = await User.findOne({ clerkId: userId });

  if (!user || !user.isConnected) {
    return { isConnected: false };
  }

  // Fetch profile and media
  let media = [];
  let profilePicture = null;
  let followersCount = 0;
  
  try {
    // 1. Fetch Profile
    const profileRes = await fetch(`https://graph.facebook.com/v25.0/${user.instagramBusinessId}?fields=profile_picture_url,followers_count&access_token=${user.instagramAccessToken}`);
    const profileData = await profileRes.json();
    if (profileData.profile_picture_url) {
      profilePicture = profileData.profile_picture_url;
      followersCount = profileData.followers_count || 0;
    }

    // 2. Fetch Media (increased limit slightly for better selection)
    const mediaRes = await fetch(`https://graph.facebook.com/v25.0/${user.instagramBusinessId}/media?fields=id,media_type,media_url,thumbnail_url,permalink,caption,like_count,comments_count&limit=12&access_token=${user.instagramAccessToken}`);
    const mediaData = await mediaRes.json();
    if (mediaData.data) {
      media = mediaData.data;
    }
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

