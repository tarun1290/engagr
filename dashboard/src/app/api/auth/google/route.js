import { NextResponse } from "next/server";
import { OAuth2Client } from "google-auth-library";
import dbConnect from "@/lib/dbConnect";
import User from "@/models/User";
import { generateToken } from "@/lib/jwt";

const googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

export async function POST(request) {
  try {
    const { credential } = await request.json();
    if (!credential) {
      return NextResponse.json({ success: false, error: "No credential provided" }, { status: 400 });
    }

    // Verify the Google ID token
    const ticket = await googleClient.verifyIdToken({
      idToken: credential,
      audience: process.env.GOOGLE_CLIENT_ID,
    });
    const payload = ticket.getPayload();
    const { email, name, picture, sub: googleId, email_verified } = payload;

    if (!email_verified) {
      return NextResponse.json({ success: false, error: "Email not verified by Google" }, { status: 400 });
    }

    console.log(`[Google Auth] Verified: ${email} (${name})`);

    await dbConnect();
    let user = await User.findOne({ email: email.toLowerCase() });
    let isNewUser = false;

    if (!user) {
      // New user — create with same defaults as email signup
      isNewUser = true;
      const userId = email.toLowerCase(); // match email signup pattern
      const trialEndsAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

      user = await User.create({
        userId,
        email: email.toLowerCase(),
        name: name || email.split("@")[0],
        profilePicture: picture || null,
        authProvider: "google",
        googleId,
        subscription: {
          plan: "trial",
          status: "trialing",
          trialEndsAt,
        },
        usage: {
          dmsSentThisMonth: 0,
          dmsSentTotal: 0,
          topUpDmsRemaining: 0,
          monthlyResetDate: trialEndsAt,
        },
      });
      console.log(`[Google Auth] New user created: ${userId}`);
    } else {
      // Existing user — link Google account if not already linked
      if (!user.googleId) user.googleId = googleId;
      if (!user.profilePicture && picture) user.profilePicture = picture;
      if (!user.name && name) user.name = name;
      if (user.authProvider === "email") user.authProvider = "google";
      await user.save();
      console.log(`[Google Auth] Existing user logged in: ${user.userId}`);
    }

    // Issue JWT — SAME as email login: generateToken({ userId })
    const token = await generateToken({ userId: user.userId });

    const response = NextResponse.json({
      success: true,
      isNewUser,
      needsAccountType: isNewUser || !user.accountType,
      isConnected: user.isConnected,
      user: { id: user._id, email: user.email, name: user.name, profilePicture: user.profilePicture },
    });

    // Set cookie — SAME name and options as email login
    response.cookies.set("auth_token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60 * 60 * 24 * 30,
      path: "/",
    });

    return response;
  } catch (error) {
    console.error("[Google Auth] Error:", error.message);
    return NextResponse.json({ success: false, error: "Authentication failed" }, { status: 500 });
  }
}
