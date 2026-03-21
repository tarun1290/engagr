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

  const totalContacts = await Event.distinct("from.id", {
    $or: [{ accountId: acctId }, { targetBusinessId: businessId, accountId: { $exists: false } }],
  }).then((ids) => ids.length);

  const startOfDay = new Date();
  startOfDay.setHours(0, 0, 0, 0);

  const eventFilter = {
    $or: [{ accountId: acctId }, { targetBusinessId: businessId, accountId: { $exists: false } }],
  };

  const sentToday = await Event.countDocuments({
    ...eventFilter,
    "reply.status": "sent",
    createdAt: { $gte: startOfDay },
  });

  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  const startOfYesterday = new Date(yesterday.setHours(0, 0, 0, 0));

  const sentYesterday = await Event.countDocuments({
    ...eventFilter,
    "reply.status": "sent",
    createdAt: { $gte: startOfYesterday, $lt: startOfDay },
  });

  const transmissionTrend =
    sentYesterday === 0 ? 0 : Math.round(((sentToday - sentYesterday) / sentYesterday) * 100);

  const totalInteractions = await Event.countDocuments(eventFilter);

  const interactionsByType = await Event.aggregate([
    { $match: { $or: [{ accountId: acctId }, { targetBusinessId: businessId, accountId: { $exists: false } }] } },
    { $group: { _id: "$type", count: { $sum: 1 } } },
    { $sort: { count: -1 } },
  ]);

  const recentInteractions = await Event.find(eventFilter)
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
    tokenExpired: account.tokenExpired || false,
    tokenExpiresAt: account.tokenExpiresAt ? account.tokenExpiresAt.toISOString() : null,
    automation: account.automation ? JSON.parse(JSON.stringify(account.automation)) : null,
    instagram: {
      username: account.instagramUsername,
      profilePic: account.instagramProfilePic || null,
      isConnected: account.isConnected,
    },
    accountId: account._id.toString(),
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
      `https://graph.instagram.com/me?fields=id,username,name&access_token=${token}`
    );
    const me = await meRes.json();
    if (me.error) throw new Error(me.error.message);

    // Try to get the page-scoped Instagram Business Account ID (used by webhooks)
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
    } catch {
      /* optional */
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
    linkUrl: data.linkUrl,
    deliveryMessage: data.deliveryMessage || "",
    deliveryButtonText: data.deliveryButtonText || "",
    isActive: true,
    requireFollow: data.requireFollow || false,
    followPromptPublicReply: data.followPromptPublicReply || "",
    followPromptDM: data.followPromptDM || "",
    followButtonText: data.followButtonText || "I'm following now! ✓",
    mentionsEnabled: data.mentionsEnabled ?? false,
    mentionReplyMessage: data.mentionReplyMessage || "Thanks for the mention! 🙌",
    reelShareEnabled: data.reelShareEnabled ?? false,
    reelShareMessage: data.reelShareMessage || "Hey! 👋 Thanks for sharing!",
    reelShareLinkUrl: data.reelShareLinkUrl || "",
    reelShareButtonText: data.reelShareButtonText || "Check it out 🚀",
  };

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
