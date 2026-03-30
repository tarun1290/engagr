"use server";

import { cookies } from "next/headers";
import dbConnect from "@/lib/dbConnect";
import Event from "@/models/Event";
import User from "@/models/User";
import InstagramAccount from "@/models/InstagramAccount";
import { generateToken, verifyToken } from "@/lib/jwt";
// [PLANS DISABLED] Gating imports not needed during Early Access
// import { canUseFeature, canAccessPage, canConnectMoreAccounts } from "@/lib/gating";
// import { getPlanConfig } from "@/lib/plans";
// [/PLANS DISABLED]

function normalizeUrl(url) {
  if (!url) return '';
  url = url.trim().replace(/\s/g, '');
  if (!url) return '';
  if (!url.startsWith('http://') && !url.startsWith('https://')) url = 'https://' + url;
  if (url.startsWith('http://')) url = url.replace('http://', 'https://');
  return url;
}

async function getOwnerId() {
  const cookieStore = await cookies();
  const token = cookieStore.get("auth_token")?.value;
  if (token) {
    const payload = await verifyToken(token);
    if (payload?.userId) return payload.userId;
  }
  return process.env.OWNER_USER_ID || "owner";
}

// Resolve which InstagramAccount to use.
// If accountId is provided, use that. Otherwise fall back to the user's primary account.
async function resolveAccount(userId, accountId) {
  if (accountId) {
    return InstagramAccount.findOne({ _id: accountId, userId });
  }
  // Fall back: primary account, or any connected account
  return (
    (await InstagramAccount.findOne({ userId, isPrimary: true, isConnected: true })) ||
    (await InstagramAccount.findOne({ userId, isConnected: true }))
  );
}

export async function getDashboardStats(accountId) {
  const userId = await getOwnerId();
  await dbConnect();

  const account = await resolveAccount(userId, accountId);
  if (!account || !account.isConnected) {
    return { contacts: 0, sentToday: 0, transmissionTrend: 0, latestEvents: [] };
  }

  const businessId = account.instagramUserId;
  const acctId = account._id;

  const startOfDay = new Date();
  startOfDay.setHours(0, 0, 0, 0);
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  const startOfYesterday = new Date(yesterday.setHours(0, 0, 0, 0));

  const eventFilter = {
    $or: [{ accountId: acctId }, { targetBusinessId: businessId, accountId: { $exists: false } }],
  };

  // Run ALL queries in parallel — biggest perf win
  const [user, contactIds, sentToday, sentYesterday, totalInteractions, interactionsByType, recentInteractions, reelCategoryBreakdown] = await Promise.all([
    User.findOne({ userId }).lean(),
    Event.distinct("from.id", eventFilter),
    Event.countDocuments({ ...eventFilter, "reply.status": "sent", createdAt: { $gte: startOfDay } }),
    Event.countDocuments({ ...eventFilter, "reply.status": "sent", createdAt: { $gte: startOfYesterday, $lt: startOfDay } }),
    Event.countDocuments(eventFilter),
    Event.aggregate([
      { $match: { $or: [{ accountId: acctId }, { targetBusinessId: businessId, accountId: { $exists: false } }] } },
      { $group: { _id: "$type", count: { $sum: 1 } } },
      { $sort: { count: -1 } },
    ]),
    Event.find(eventFilter).select("type from content reply metadata createdAt").sort({ createdAt: -1 }).limit(10).lean(),
    Event.aggregate([
      { $match: { ...eventFilter, type: 'reel_share', "metadata.matchType": { $exists: true } } },
      { $group: { _id: "$metadata.matchType", categoryName: { $first: "$metadata.categoryRuleName" }, count: { $sum: 1 }, sent: { $sum: { $cond: [{ $eq: ["$reply.status", "sent"] }, 1, 0] } } } },
      { $sort: { count: -1 } },
    ]),
  ]);

  const totalContacts = contactIds.length;
  const transmissionTrend = sentYesterday === 0 ? 0 : Math.round(((sentToday - sentYesterday) / sentYesterday) * 100);

  return {
    contacts: totalContacts,
    sentToday,
    transmissionTrend,
    totalInteractions,
    interactionsByType,
    reelCategoryBreakdown: JSON.parse(JSON.stringify(reelCategoryBreakdown)),
    recentInteractions: JSON.parse(JSON.stringify(recentInteractions)),
    tokenExpired: account.tokenExpired || false,
    tokenExpiresAt: account.tokenExpiresAt ? account.tokenExpiresAt.toISOString() : null,
    automation: account.automation ? JSON.parse(JSON.stringify(account.automation)) : null,
    instagram: {
      username: account.instagramUsername,
      profilePic: account.instagramProfilePic || null,
      isConnected: account.isConnected,
    },
    accountId: account._id.toString(),
    accountType: user?.accountType || "creator",
    businessProfile: user?.businessProfile || null,
    agencyProfile: user?.agencyProfile || null,
    // AI feature flag — completely hidden unless admin-enabled
    aiFeatureEnabled: !!(user?.flags?.aiProductDetectionUnlocked && account?.aiFeature?.enabled),
    // Smart features flags — completely hidden unless admin-enabled
    smartFeaturesEnabled: {
      shopify: !!user?.flags?.shopifyEnabled,
      knowledgeBase: !!user?.flags?.knowledgeBaseEnabled,
      smartReplies: !!user?.flags?.smartRepliesEnabled,
    },
  };
}

export async function getContacts(accountId) {
  const userId = await getOwnerId();
  await dbConnect();

  // [PLANS DISABLED] Page gate: contacts page requires Gold+
  // const user = await User.findOne({ userId }).lean();
  // const plan = user?.subscription?.plan || "trial";
  // const status = user?.subscription?.status || "trialing";
  // if (!canAccessPage(plan, "contacts", status)) {
  //   return { error: "Contacts requires a Gold or higher plan.", gated: true };
  // }
  // [/PLANS DISABLED]

  const account = await resolveAccount(userId, accountId);
  if (!account || !account.isConnected) return [];

  const businessId = account.instagramUserId;
  const acctId = account._id;

  const contacts = await Event.aggregate([
    { $match: { $or: [{ accountId: acctId }, { targetBusinessId: businessId, accountId: { $exists: false } }] } },
    {
      $group: {
        _id: "$from.id",
        username: { $last: "$from.username" },
        name: { $last: "$from.name" },
        totalInteractions: { $sum: 1 },
        dmsSent: {
          $sum: { $cond: [{ $eq: ["$reply.status", "sent"] }, 1, 0] },
        },
        lastSeen: { $max: "$createdAt" },
        types: { $addToSet: "$type" },
      },
    },
    { $sort: { lastSeen: -1 } },
    { $limit: 200 },
  ]);

  return JSON.parse(JSON.stringify(contacts));
}

export async function getAllInteractions(type, accountId) {
  const userId = await getOwnerId();
  await dbConnect();

  // [PLANS DISABLED] Page gate: activity page requires Gold+
  // const user = await User.findOne({ userId }).lean();
  // const plan = user?.subscription?.plan || "trial";
  // const status = user?.subscription?.status || "trialing";
  // if (!canAccessPage(plan, "activity", status)) {
  //   return { error: "Activity log requires a Gold or higher plan.", gated: true };
  // }
  // [/PLANS DISABLED]

  const account = await resolveAccount(userId, accountId);
  if (!account || !account.isConnected) return [];

  const businessId = account.instagramUserId;
  const acctId = account._id;

  const query = {
    $or: [{ accountId: acctId }, { targetBusinessId: businessId, accountId: { $exists: false } }],
  };
  if (type && type !== "all") query.type = type;

  const events = await Event.find(query).sort({ createdAt: -1 }).limit(100).lean();

  return JSON.parse(JSON.stringify(events));
}

export async function getAccountsFromToken(code) {
  const appId = process.env.NEXT_PUBLIC_FACEBOOK_APP_ID || "2989539487909963";
  const appSecret = process.env.META_APP_SECRET;
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "https://engagr-dm.vercel.app";
  const redirectUri = `${appUrl}/onboarding`;

  try {
    if (!appSecret) throw new Error("Missing META_APP_SECRET in environment variables.");

    // Exchange Instagram auth code for short-lived token
    console.log(`[Instagram Auth] Exchanging code for token, redirectUri: ${redirectUri}`);
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
      console.error("[Instagram Auth] Token exchange failed:", JSON.stringify(exchangeData));
      throw new Error(exchangeData.error_message || "Instagram token exchange failed.");
    }
    console.log("[Instagram Auth] Token received, upgrading to long-lived...");

    let token = exchangeData.access_token;
    let expiresIn = 3600;

    // Upgrade to long-lived token (60 days)
    try {
      const longRes = await fetch(
        `https://graph.instagram.com/access_token?grant_type=ig_exchange_token&client_secret=${appSecret}&access_token=${token}`
      );
      const longData = await longRes.json();
      if (!longData.error && longData.access_token) {
        token = longData.access_token;
        expiresIn = longData.expires_in || 5184000;
      }
    } catch {
      /* keep short-lived on failure */
    }

    // Get Instagram user info (app-scoped ID)
    const meRes = await fetch(
      `https://graph.instagram.com/me?fields=id,username,name,user_id&access_token=${token}`
    );
    const me = await meRes.json();
    if (me.error) throw new Error(me.error.message);
    console.log(`[Instagram Auth] Profile: id=${me.id} user_id=${me.user_id} username=${me.username}`);

    // Try to get the page-scoped Instagram Business Account ID (used by webhooks)
    // Note: This requires a Facebook User Token. With Instagram Login tokens,
    // this call may fail — the app-scoped me.id is then used for both fields.
    let webhookId = null;
    try {
      const pagesRes = await fetch(
        `https://graph.facebook.com/v25.0/me/accounts?fields=id,instagram_business_account&access_token=${token}`
      );
      const pagesData = await pagesRes.json();
      if (pagesData.data) {
        for (const page of pagesData.data) {
          if (page.instagram_business_account?.id) {
            webhookId = page.instagram_business_account.id;
            break;
          }
        }
      }
      console.log(`[Instagram Auth] Page-scoped webhook ID: ${webhookId || 'not found (using app-scoped ID)'}`);
    } catch {
      console.log(`[Instagram Auth] Facebook pages API not available (Instagram Login token)`);
    }

    return {
      success: true,
      accounts: [
        {
          pageId: null,
          pageToken: token,
          igId: me.id,
          webhookId,
          username: me.username,
          name: me.name || me.username,
          profilePic: null,
          isIgToken: true,
          expiresIn,
        },
      ],
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

  // [PLANS DISABLED] Check Instagram account limit before connecting a new one
  // const user = await User.findOne({ userId }).lean();
  // const plan = user?.subscription?.plan || "trial";
  // const existingAccount = await InstagramAccount.findOne({ userId, instagramUserId: details.igId });
  // if (!existingAccount) {
  //   const connectedCount = await InstagramAccount.countDocuments({ userId, isConnected: true });
  //   const accountLimit = canConnectMoreAccounts(plan, connectedCount);
  //   if (!accountLimit.allowed) {
  //     return { success: false, error: `Your ${getPlanConfig(plan).name} plan allows ${accountLimit.max} Instagram account${accountLimit.max > 1 ? 's' : ''}. Upgrade to connect more.`, gated: true };
  //   }
  // }
  // [/PLANS DISABLED]

  try {
    // Subscribe to webhook fields
    const subUrl = new URL(`https://graph.instagram.com/v25.0/me/subscribed_apps`);
    subUrl.searchParams.set(
      "subscribed_fields",
      "comments,live_comments,mentions,messages,message_reactions,messaging_postbacks,messaging_referral"
    );
    subUrl.searchParams.set("access_token", accessToken);
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

  const expiresIn = details.expiresIn || 5184000;
  const tokenExpiresAt = new Date(Date.now() + expiresIn * 1000);

  // Check if user already has any connected accounts
  const existingCount = await InstagramAccount.countDocuments({ userId, isConnected: true });
  const shouldBePrimary = existingCount === 0;

  // Upsert the InstagramAccount
  console.log(`[Instagram Auth] Saving account: igId=${details.igId} webhookId=${details.webhookId} username=${details.username} pageScopedId=${details.webhookId || details.igId}`);
  const account = await InstagramAccount.findOneAndUpdate(
    { userId, instagramUserId: details.igId },
    {
      $set: {
        instagramPageScopedId: details.webhookId || details.igId,
        instagramUsername: details.username,
        instagramProfilePic: details.profilePic,
        accessToken,
        tokenExpiresAt,
        tokenExpired: false,
        isConnected: true,
      },
      $setOnInsert: {
        userId,
        instagramUserId: details.igId,
        isPrimary: shouldBePrimary,
        createdAt: new Date(),
      },
    },
    { upsert: true, returnDocument: "after" }
  );

  // Auto-enable AI feature on new account if user has the flag
  const user = await User.findOne({ userId }).lean();
  if (user?.flags?.aiProductDetectionUnlocked && !account.aiFeature?.enabled) {
    // Copy enabledBy/notes from another enabled account, or use "system"
    const existingAiAccount = await InstagramAccount.findOne({
      userId, "aiFeature.enabled": true,
    }).lean();
    await InstagramAccount.findByIdAndUpdate(account._id, {
      "aiFeature.enabled": true,
      "aiFeature.enabledBy": existingAiAccount?.aiFeature?.enabledBy || "system",
      "aiFeature.enabledAt": new Date(),
      "aiFeature.notes": existingAiAccount?.aiFeature?.notes || "Auto-enabled for flagged user",
    });
  }

  // Also keep legacy User fields in sync (backward compat during transition)
  await User.findOneAndUpdate(
    { userId },
    {
      instagramAccessToken: accessToken,
      instagramBusinessId: details.igId,
      instagramWebhookId: details.webhookId || details.igId,
      instagramUsername: details.username,
      instagramProfilePic: details.profilePic,
      isConnected: true,
      tokenExpired: false,
      tokenExpiresAt,
    },
    { upsert: true, returnDocument: "after" }
  );

  // Generate JWT and set cookie
  const jwtToken = await generateToken({ userId });
  const cookieStore = await cookies();
  cookieStore.set("auth_token", jwtToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 60 * 60 * 24 * 30,
    path: "/",
  });

  return { success: true, username: details.username, accountId: account._id.toString() };
}

export async function saveAutomation(data, accountId) {
  const userId = await getOwnerId();
  await dbConnect();

  // [PLANS DISABLED] Plan checks disabled for Early Access
  // const user = await User.findOne({ userId }).lean();
  // const plan = user?.subscription?.plan || "trial";
  // const status = user?.subscription?.status || "trialing";

  // [PLANS DISABLED] Block expired/cancelled users
  // if (status === "expired" || status === "cancelled") {
  //   return { success: false, error: "Your subscription has expired. Please renew to save automations.", gated: true };
  // }

  // [PLANS DISABLED] Trial users: limited to 1 automation across all accounts
  // const planConfig = getPlanConfig(plan);
  // if (planConfig.automationLimit !== Infinity) {
  //   const existingAutomations = await InstagramAccount.countDocuments({
  //     userId,
  //     "automation.isActive": true,
  //   });
  //   const account = await resolveAccount(userId, accountId);
  //   const isEditing = account?.automation?.isActive;
  //   if (!isEditing && existingAutomations >= planConfig.automationLimit) {
  //     return { success: false, error: `Your ${planConfig.name} plan allows ${planConfig.automationLimit} active automation. Upgrade for unlimited automations.`, gated: true, requiredPlan: "silver" };
  //   }
  // }

  // [PLANS DISABLED] Feature gate: follow_gate requires Gold+
  // if (data.requireFollow) {
  //   const followCheck = canUseFeature(plan, "follow_gate");
  //   if (!followCheck.allowed) {
  //     return { success: false, error: `Follow gate requires the ${followCheck.requiredPlanName} plan (₹${followCheck.requiredPlanPrice}/mo).`, gated: true, requiredPlan: followCheck.requiredPlan };
  //   }
  // }

  // [PLANS DISABLED] Feature gate: mention_detection requires Gold+
  // if (data.mentionsEnabled) {
  //   const mentionCheck = canUseFeature(plan, "mention_detection");
  //   if (!mentionCheck.allowed) {
  //     return { success: false, error: `Mention detection requires the ${mentionCheck.requiredPlanName} plan (₹${mentionCheck.requiredPlanPrice}/mo).`, gated: true, requiredPlan: mentionCheck.requiredPlan };
  //   }
  // }
  // [/PLANS DISABLED]

  const account = await resolveAccount(userId, accountId);
  if (!account) return { success: false, error: "No account found." };

  const automationData = {
    postTrigger: data.postTrigger,
    selectedPostId: data.selectedPostId,
    commentTrigger: data.commentTrigger,
    keywords: data.keywords
      ? data.keywords
          .split(",")
          .map((k) => k.trim())
          .filter((k) => k)
      : [],
    replyEnabled: data.replyEnabled,
    replyMessages: data.replyMessages || [],
    dmContent: data.dmContent,
    buttonText: data.buttonText,
    linkUrl: normalizeUrl(data.linkUrl),
    deliveryMessage: data.deliveryMessage || "",
    deliveryButtonText: data.deliveryButtonText || "",
    isActive: true,
    requireFollow: data.requireFollow || data.followerGate?.enabled || false,
    followPromptPublicReply: data.followPromptPublicReply || "",
    followPromptDM: data.followPromptDM || "",
    followButtonText: data.followButtonText || "I'm following now! ✓",
    followerGate: data.followerGate || undefined,
    mentionsEnabled: data.mentionsEnabled ?? false,
    mentionReplyMessage: data.mentionReplyMessage || "Thanks for the mention! 🙌",
    reelShareEnabled: data.reelShareEnabled ?? false,
    reelShareMessage: data.reelShareMessage || "Hey! 👋 Thanks for sharing!",
    reelShareLinkUrl: normalizeUrl(data.reelShareLinkUrl) || "",
    reelShareButtonText: data.reelShareButtonText || "Check it out 🚀",
  };

  // Preserve existing reel categories and default reply (managed via separate actions)
  const existingAutomation = account.automation || {};
  if (existingAutomation.reelCategories) {
    automationData.reelCategories = existingAutomation.reelCategories;
  }
  if (existingAutomation.reelShareDefaultReply) {
    automationData.reelShareDefaultReply = existingAutomation.reelShareDefaultReply;
  }
  if (existingAutomation.aiProductDetection) {
    automationData.aiProductDetection = existingAutomation.aiProductDetection;
  }
  if (existingAutomation.smartReplyConfig) {
    automationData.smartReplyConfig = existingAutomation.smartReplyConfig;
  }

  const updated = await InstagramAccount.findByIdAndUpdate(
    account._id,
    { automation: automationData },
    { returnDocument: "after" }
  );

  // Keep legacy User.automation in sync
  await User.findOneAndUpdate({ userId }, { automation: automationData });

  return { success: true, automation: JSON.parse(JSON.stringify(updated.automation)) };
}

export async function toggleAutomation(isActive, accountId) {
  const userId = await getOwnerId();
  await dbConnect();

  // [PLANS DISABLED] Block activating automation if subscription expired/cancelled
  // if (isActive) {
  //   const user = await User.findOne({ userId }).lean();
  //   const status = user?.subscription?.status || "trialing";
  //   if (status === "expired" || status === "cancelled") {
  //     return { success: false, error: "Your subscription has expired. Please renew to activate automations.", gated: true };
  //   }
  // }
  // [/PLANS DISABLED]

  const account = await resolveAccount(userId, accountId);
  if (!account) return { success: false, error: "No account found." };

  const updated = await InstagramAccount.findByIdAndUpdate(
    account._id,
    { "automation.isActive": isActive },
    { returnDocument: "after" }
  );

  // Keep legacy User.automation in sync
  await User.findOneAndUpdate({ userId }, { "automation.isActive": isActive });

  return { success: true, isActive: updated?.automation?.isActive ?? false };
}

export async function deleteAutomation(accountId) {
  const userId = await getOwnerId();
  await dbConnect();

  const account = await resolveAccount(userId, accountId);
  if (!account) return { success: false, error: "No account found." };

  await InstagramAccount.findByIdAndUpdate(account._id, { $unset: { automation: "" } });

  // Keep legacy User.automation in sync
  await User.findOneAndUpdate({ userId }, { $unset: { automation: "" } });

  return { success: true };
}

export async function getInstagramAccount(accountId) {
  const userId = await getOwnerId();
  await dbConnect();

  const account = await resolveAccount(userId, accountId);
  if (!account || !account.isConnected) {
    return { isConnected: false };
  }

  let media = [];
  let profilePicture = null;
  let followersCount = 0;

  try {
    const profileRes = await fetch(
      `https://graph.instagram.com/v25.0/me?fields=id,username,name,profile_picture_url,followers_count,media_count&access_token=${account.accessToken}`
    );
    const profileData = await profileRes.json();
    if (!profileData.error) {
      profilePicture = profileData.profile_picture_url || null;
      followersCount = profileData.followers_count || 0;
    }

    const mediaRes = await fetch(
      `https://graph.instagram.com/v25.0/me/media?fields=id,media_type,media_url,thumbnail_url,permalink,caption,like_count,comments_count&limit=18&access_token=${account.accessToken}`
    );
    const mediaData = await mediaRes.json();
    if (mediaData.data) media = mediaData.data;
  } catch (error) {
    console.error("Failed to fetch Instagram account details:", error);
  }

  return {
    isConnected: true,
    username: account.instagramUsername,
    businessId: account.instagramUserId,
    profilePicture,
    followersCount,
    media,
    automation: account.automation ? JSON.parse(JSON.stringify(account.automation)) : null,
    accountId: account._id.toString(),
  };
}

export async function getNotifications(accountId) {
  const userId = await getOwnerId();
  await dbConnect();

  const account = await resolveAccount(userId, accountId);
  if (!account || !account.isConnected) return [];

  const businessId = account.instagramUserId;
  const acctId = account._id;

  const notifications = await Event.find({
    $or: [{ accountId: acctId }, { targetBusinessId: businessId, accountId: { $exists: false } }],
    "reply.status": "sent",
  })
    .sort({ createdAt: -1 })
    .limit(10)
    .lean();

  return JSON.parse(JSON.stringify(notifications));
}

// ── New multi-account actions ───────────────────────────────────────────────

export async function getInstagramAccounts() {
  const userId = await getOwnerId();
  await dbConnect();

  const accounts = await InstagramAccount.find({ userId })
    .sort({ isPrimary: -1, createdAt: 1 })
    .lean();

  return JSON.parse(JSON.stringify(accounts.map((a) => ({
    _id: a._id.toString(),
    instagramUserId: a.instagramUserId,
    instagramUsername: a.instagramUsername,
    instagramProfilePic: a.instagramProfilePic,
    isConnected: a.isConnected,
    isPrimary: a.isPrimary,
    tokenExpired: a.tokenExpired,
    automationActive: a.automation?.isActive || false,
    createdAt: a.createdAt,
  }))));
}

export async function disconnectInstagramAccount(accountId) {
  const userId = await getOwnerId();
  await dbConnect();

  const account = await InstagramAccount.findOne({ _id: accountId, userId });
  if (!account) return { success: false, error: "Account not found." };

  await InstagramAccount.findByIdAndUpdate(accountId, {
    $unset: { accessToken: 1 },
    $set: { isConnected: false, tokenExpired: false, "automation.isActive": false },
  });

  // If this was the primary and it was the account synced to User, update User too
  if (account.isPrimary) {
    await User.findOneAndUpdate(
      { userId },
      {
        $unset: { instagramAccessToken: 1, instagramBusinessId: 1, instagramUsername: 1, instagramProfilePic: 1 },
        $set: { isConnected: false, tokenExpired: false },
      }
    );
  }

  return { success: true };
}

export async function removeInstagramAccount(accountId) {
  const userId = await getOwnerId();
  await dbConnect();

  const account = await InstagramAccount.findOne({ _id: accountId, userId });
  if (!account) return { success: false, error: "Account not found." };

  await InstagramAccount.deleteOne({ _id: accountId });

  // If this was primary, promote the next account
  if (account.isPrimary) {
    const next = await InstagramAccount.findOne({ userId, isConnected: true }).sort({ createdAt: 1 });
    if (next) {
      await InstagramAccount.findByIdAndUpdate(next._id, { isPrimary: true });
      // Sync the new primary to User
      await User.findOneAndUpdate(
        { userId },
        {
          instagramAccessToken: next.accessToken,
          instagramBusinessId: next.instagramUserId,
          instagramWebhookId: next.instagramPageScopedId || next.instagramUserId,
          instagramUsername: next.instagramUsername,
          instagramProfilePic: next.instagramProfilePic,
          isConnected: next.isConnected,
          tokenExpired: next.tokenExpired,
          tokenExpiresAt: next.tokenExpiresAt,
        }
      );
    } else {
      // No accounts left — clear User instagram fields
      await User.findOneAndUpdate(
        { userId },
        {
          $unset: { instagramAccessToken: 1, instagramBusinessId: 1, instagramWebhookId: 1, instagramUsername: 1, instagramProfilePic: 1 },
          $set: { isConnected: false, tokenExpired: false },
        }
      );
    }
  }

  return { success: true };
}

export async function setPrimaryAccount(accountId) {
  const userId = await getOwnerId();
  await dbConnect();

  const account = await InstagramAccount.findOne({ _id: accountId, userId });
  if (!account) return { success: false, error: "Account not found." };

  // Unset current primary
  await InstagramAccount.updateMany({ userId }, { isPrimary: false });
  // Set new primary
  await InstagramAccount.findByIdAndUpdate(accountId, { isPrimary: true });

  // Sync to User legacy fields
  await User.findOneAndUpdate(
    { userId },
    {
      instagramAccessToken: account.accessToken,
      instagramBusinessId: account.instagramUserId,
      instagramWebhookId: account.instagramPageScopedId || account.instagramUserId,
      instagramUsername: account.instagramUsername,
      instagramProfilePic: account.instagramProfilePic,
      isConnected: account.isConnected,
      tokenExpired: account.tokenExpired,
      tokenExpiresAt: account.tokenExpiresAt,
    }
  );

  return { success: true };
}

// ── Smart Reel Replies actions ────────────────────────────────────────────────

export async function saveReelCategories(categories, accountId) {
  const userId = await getOwnerId();
  await dbConnect();

  if (!Array.isArray(categories)) {
    return { success: false, error: "Categories must be an array." };
  }
  if (categories.length > 5) {
    return { success: false, error: "Maximum 5 reel categories allowed." };
  }

  for (const cat of categories) {
    if (!cat.name?.trim()) {
      return { success: false, error: "Each category must have a name." };
    }
    if (cat.name.length > 50) {
      return { success: false, error: `Category name "${cat.name}" exceeds 50 characters.` };
    }
  }

  const account = await resolveAccount(userId, accountId);
  if (!account) return { success: false, error: "No account found." };

  const cleanCategories = categories.map((cat, idx) => ({
    _id: cat._id || undefined,
    name: cat.name.trim(),
    enabled: cat.enabled ?? true,
    priority: cat.priority ?? (categories.length - idx),
    detection: {
      keywords: (cat.detection?.keywords || []).map(k => k.trim()).filter(Boolean),
      hashtags: (cat.detection?.hashtags || []).map(h => h.trim().replace(/^#/, '')).filter(Boolean),
      accountUsernames: (cat.detection?.accountUsernames || []).map(u => u.trim().replace(/^@/, '')).filter(Boolean),
      specificReelIds: (cat.detection?.specificReelIds || []).filter(Boolean),
    },
    matchMode: cat.matchMode || "any",
    reply: {
      message: cat.reply?.message || "",
      linkUrl: cat.reply?.linkUrl || "",
      buttonText: cat.reply?.buttonText || "Check it out 🚀",
    },
    stats: cat.stats || { totalMatches: 0, totalRepliesSent: 0 },
    createdAt: cat.createdAt || new Date(),
  }));

  await InstagramAccount.findByIdAndUpdate(account._id, {
    "automation.reelCategories": cleanCategories,
  });

  await User.findOneAndUpdate({ userId }, {
    "automation.reelCategories": cleanCategories,
  });

  const updated = await InstagramAccount.findById(account._id).lean();
  return {
    success: true,
    categories: JSON.parse(JSON.stringify(updated?.automation?.reelCategories || [])),
  };
}

export async function saveReelDefaultReply(defaultReply, accountId) {
  const userId = await getOwnerId();
  await dbConnect();

  const account = await resolveAccount(userId, accountId);
  if (!account) return { success: false, error: "No account found." };

  const cleanDefault = {
    enabled: defaultReply?.enabled ?? true,
    message: defaultReply?.message || "",
    linkUrl: defaultReply?.linkUrl || "",
    buttonText: defaultReply?.buttonText || "Check it out 🚀",
  };

  await InstagramAccount.findByIdAndUpdate(account._id, {
    "automation.reelShareDefaultReply": cleanDefault,
  });

  await User.findOneAndUpdate({ userId }, {
    "automation.reelShareDefaultReply": cleanDefault,
  });

  return { success: true, defaultReply: cleanDefault };
}

export async function getReelCategoryStats(accountId) {
  const userId = await getOwnerId();
  await dbConnect();

  const account = await resolveAccount(userId, accountId);
  if (!account) return { success: false, error: "No account found." };

  const acctId = account._id;
  const businessId = account.instagramUserId;
  const eventFilter = {
    type: 'reel_share',
    $or: [{ accountId: acctId }, { targetBusinessId: businessId, accountId: { $exists: false } }],
  };

  const byCategory = await Event.aggregate([
    { $match: { ...eventFilter, "metadata.matchType": "category" } },
    {
      $group: {
        _id: "$metadata.categoryRuleName",
        categoryRuleId: { $first: "$metadata.categoryRuleId" },
        totalEvents: { $sum: 1 },
        sent: { $sum: { $cond: [{ $eq: ["$reply.status", "sent"] }, 1, 0] } },
        lastAt: { $max: "$createdAt" },
      },
    },
    { $sort: { totalEvents: -1 } },
  ]);

  const totalReelShares = await Event.countDocuments(eventFilter);
  const totalCategoryMatches = await Event.countDocuments({ ...eventFilter, "metadata.matchType": "category" });
  const totalDefaultReplies = await Event.countDocuments({ ...eventFilter, "metadata.matchType": "default" });
  const totalLegacyReplies = await Event.countDocuments({ ...eventFilter, "metadata.matchType": "legacy" });

  return {
    success: true,
    totalReelShares,
    totalCategoryMatches,
    totalDefaultReplies,
    totalLegacyReplies,
    byCategory: JSON.parse(JSON.stringify(byCategory)),
    categories: JSON.parse(JSON.stringify(account?.automation?.reelCategories || [])),
  };
}

// ── Home page stats — account-type-aware ────────────────────────────────────

export async function getHomeStats(accountId) {
  const userId = await getOwnerId();
  await dbConnect();

  const user = await User.findOne({ userId }).lean();
  const accountType = user?.accountType || "creator";

  // Get all connected IG accounts for this user
  const allAccounts = await InstagramAccount.find({ userId }).lean();
  const connectedAccounts = allAccounts.filter((a) => a.isConnected);

  // Resolve current account
  const account = accountId
    ? allAccounts.find((a) => a._id.toString() === accountId)
    : connectedAccounts.find((a) => a.isPrimary) || connectedAccounts[0];

  const startOfMonth = new Date();
  startOfMonth.setDate(1);
  startOfMonth.setHours(0, 0, 0, 0);

  const startOfDay = new Date();
  startOfDay.setHours(0, 0, 0, 0);

  // Build event filter for the current account
  const acctFilter = account
    ? { $or: [{ accountId: account._id }, { targetBusinessId: account.instagramUserId, accountId: { $exists: false } }] }
    : { accountId: { $exists: false } };

  // Build event filter for ALL accounts (agency view)
  const allAcctIds = connectedAccounts.map((a) => a._id);
  const allBusinessIds = connectedAccounts.map((a) => a.instagramUserId).filter(Boolean);
  const allFilter = allAcctIds.length > 0
    ? { $or: [{ accountId: { $in: allAcctIds } }, { targetBusinessId: { $in: allBusinessIds }, accountId: { $exists: false } }] }
    : { accountId: { $exists: false } };

  // ── Stat computations — all in parallel ───────────────────────────────────

  const [
    dmsSentThisMonth,
    uniqueRecipientsThisMonth,
    commentEventsThisMonth,
    postbackEventsThisMonth,
    gatePassedThisMonth,
    totalInteractionsCount,
    eventsToday,
    totalDmsSentAllAccounts,
    activeAutomationCount,
    chartData,
  ] = await Promise.all([
    // DMs sent this month (current account)
    Event.countDocuments({ ...acctFilter, "reply.status": "sent", createdAt: { $gte: startOfMonth } }),
    // Unique DM recipients this month
    Event.distinct("from.id", { ...acctFilter, "reply.status": "sent", createdAt: { $gte: startOfMonth } }),
    // Comment events this month
    Event.countDocuments({ ...acctFilter, type: "comment", createdAt: { $gte: startOfMonth } }),
    // Postback / button events this month
    Event.countDocuments({ ...acctFilter, type: "postback", createdAt: { $gte: startOfMonth } }),
    // Follower gate conversions (postback events with CONFIRM metadata)
    Event.countDocuments({ ...acctFilter, type: "postback", "content.text": { $regex: /follow/i }, createdAt: { $gte: startOfMonth } }),
    // Total interactions ever (current account)
    Event.countDocuments(acctFilter),
    // Events today across all accounts
    Event.countDocuments({ ...allFilter, createdAt: { $gte: startOfDay } }),
    // Total DMs this month across all accounts
    Event.countDocuments({ ...allFilter, "reply.status": "sent", createdAt: { $gte: startOfMonth } }),
    // Active automations across all accounts
    InstagramAccount.countDocuments({ userId, "automation.isActive": true }),
    // Chart data: DMs per day last 30 days (current account or all for agency)
    Event.aggregate([
      { $match: { ...(accountType === "agency" ? allFilter : acctFilter), "reply.status": "sent", createdAt: { $gte: new Date(Date.now() - 30 * 86400000) } } },
      { $group: { _id: { $dateToString: { format: "%m/%d", date: "$createdAt" } }, dms: { $sum: 1 } } },
      { $sort: { _id: 1 } },
    ]),
  ]);

  // Also get comment chart data for creator view
  let commentChartData = [];
  if (accountType === "creator") {
    commentChartData = await Event.aggregate([
      { $match: { ...acctFilter, type: "comment", createdAt: { $gte: new Date(Date.now() - 30 * 86400000) } } },
      { $group: { _id: { $dateToString: { format: "%m/%d", date: "$createdAt" } }, comments: { $sum: 1 } } },
      { $sort: { _id: 1 } },
    ]);
  }

  // Click chart data for business view
  let clickChartData = [];
  if (accountType === "business") {
    clickChartData = await Event.aggregate([
      { $match: { ...acctFilter, type: "postback", createdAt: { $gte: new Date(Date.now() - 30 * 86400000) } } },
      { $group: { _id: { $dateToString: { format: "%m/%d", date: "$createdAt" } }, clicks: { $sum: 1 } } },
      { $sort: { _id: 1 } },
    ]);
  }

  // Agency: per-account stats
  let perAccountStats = [];
  if (accountType === "agency") {
    perAccountStats = await Promise.all(
      connectedAccounts.map(async (acct) => {
        const af = { $or: [{ accountId: acct._id }, { targetBusinessId: acct.instagramUserId, accountId: { $exists: false } }] };
        const [dms, lastEvent] = await Promise.all([
          Event.countDocuments({ ...af, "reply.status": "sent", createdAt: { $gte: startOfMonth } }),
          Event.findOne(af).select("createdAt").sort({ createdAt: -1 }).lean(),
        ]);
        return {
          _id: acct._id.toString(),
          username: acct.instagramUsername,
          profilePic: acct.instagramProfilePic || null,
          dmsSentThisMonth: dms,
          isActive: acct.automation?.isActive || false,
          automationCount: acct.automation?.isActive ? 1 : 0,
          lastEventAt: lastEvent?.createdAt ? lastEvent.createdAt.toISOString() : null,
        };
      })
    );
  }

  // Merge chart data into unified arrays
  const mergedChart = [];
  const dateSet = new Set();
  chartData.forEach((d) => dateSet.add(d._id));
  commentChartData.forEach((d) => dateSet.add(d._id));
  clickChartData.forEach((d) => dateSet.add(d._id));
  const sortedDates = [...dateSet].sort();

  const dmsMap = Object.fromEntries(chartData.map((d) => [d._id, d.dms]));
  const commentsMap = Object.fromEntries(commentChartData.map((d) => [d._id, d.comments]));
  const clicksMap = Object.fromEntries(clickChartData.map((d) => [d._id, d.clicks]));

  for (const date of sortedDates) {
    mergedChart.push({
      date,
      dms: dmsMap[date] || 0,
      comments: commentsMap[date] || 0,
      clicks: clicksMap[date] || 0,
    });
  }

  // Compute derived stats
  const conversionRate = dmsSentThisMonth > 0
    ? Math.round((postbackEventsThisMonth / dmsSentThisMonth) * 100)
    : 0;

  // Build stat values keyed by config stat names
  const statValues = {
    followers_engaged: uniqueRecipientsThisMonth.length,
    dms_sent: dmsSentThisMonth,
    comments_detected: commentEventsThisMonth,
    follower_gate_conversions: gatePassedThisMonth,
    customers_reached: uniqueRecipientsThisMonth.length,
    link_clicks: postbackEventsThisMonth,
    total_interactions: totalInteractionsCount,
    conversion_rate: conversionRate,
    accounts_managed: connectedAccounts.length,
    total_dms_sent: totalDmsSentAllAccounts,
    active_automations: activeAutomationCount,
    total_events_today: eventsToday,
  };

  return {
    statValues,
    chartData: mergedChart,
    perAccountStats,
    userName: user?.name || user?.email?.split("@")[0] || "there",
  };
}
