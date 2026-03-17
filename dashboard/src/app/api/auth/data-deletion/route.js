import { NextResponse } from "next/server";
import crypto from "crypto";
import dbConnect from "@/lib/dbConnect";
import User from "@/models/User";
import Event from "@/models/Event";

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

// Meta calls this POST when a user requests their data to be deleted (GDPR)
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

  const confirmationCode = `del_${data.user_id}_${Date.now()}`;

  await dbConnect();

  // Find the user and delete all their data
  const user = await User.findOne({ facebookUserId: data.user_id });
  if (user) {
    await Event.deleteMany({ targetBusinessId: user.instagramBusinessId });
    await User.deleteOne({ facebookUserId: data.user_id });
  }

  console.log(`[Data Deletion] Deleted data for Facebook user ${data.user_id}. Code: ${confirmationCode}`);

  // Meta requires this exact response format
  return NextResponse.json({
    url: `${process.env.NEXT_PUBLIC_APP_URL}/data-deletion-status?id=${confirmationCode}`,
    confirmation_code: confirmationCode,
  });
}
