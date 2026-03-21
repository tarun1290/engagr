import { NextResponse } from "next/server";
import crypto from "crypto";
import dbConnect from "@/lib/dbConnect";
import User from "@/models/User";
import InstagramAccount from "@/models/InstagramAccount";

function parseSignedRequest(signedRequest, secret) {
  try {
    const [encodedSig, payload] = signedRequest.split(".");
    const sig = Buffer.from(encodedSig.replace(/-/g, "+").replace(/_/g, "/"), "base64");
    const expectedSig = crypto.createHmac("sha256", secret).update(payload).digest();
    if (!crypto.timingSafeEqual(sig, expectedSig)) return null;
    return JSON.parse(Buffer.from(payload.replace(/-/g, "+").replace(/_/g, "/"), "base64").toString());
  } catch {
    return null;
  }
}

// Meta calls this POST when a user removes the app from their Facebook settings
export async function POST(request) {
  const formData = await request.formData();
  const signedRequest = formData.get("signed_request");

  if (!signedRequest) {
    return NextResponse.json({ error: "Missing signed_request" }, { status: 400 });
  }

  const data = parseSignedRequest(signedRequest, process.env.META_APP_SECRET);
  if (!data) {
    return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
  }

  await dbConnect();

  // Disconnect all InstagramAccounts for this Facebook user
  const user = await User.findOne({ facebookUserId: data.user_id });
  if (user) {
    await InstagramAccount.updateMany(
      { userId: user.userId },
      {
        $unset: { accessToken: 1 },
        $set: { isConnected: false, tokenExpired: false, "automation.isActive": false },
      }
    );
  }

  // Remove tokens from legacy User fields
  await User.updateMany(
    { facebookUserId: data.user_id },
    {
      $unset: { instagramAccessToken: 1, pageAccessToken: 1 },
      $set: { isConnected: false },
    }
  );

  console.log(`[Deauthorize] User ${data.user_id} removed the app.`);
  return NextResponse.json({ success: true });
}
