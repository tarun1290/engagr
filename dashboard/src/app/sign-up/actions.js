"use server";

import { cookies } from "next/headers";
import bcrypt from "bcryptjs";
import dbConnect from "@/lib/dbConnect";
import User from "@/models/User";
import { generateToken } from "@/lib/jwt";
import { isPersonalEmail } from "@/lib/blockedEmailDomains";

export async function signUp(formData) {
  const name = (formData.get("name") || "").trim();
  const email = (formData.get("email") || "").trim().toLowerCase();
  const instagramHandle = (formData.get("instagramHandle") || "").trim().replace(/^@/, "");
  let accountType = formData.get("accountType") || "creator";
  const businessName = (formData.get("businessName") || "").trim();
  const companyName = (formData.get("companyName") || "").trim();
  const website = (formData.get("website") || "").trim();
  const password = formData.get("password") || "";
  const confirmPassword = formData.get("confirmPassword") || "";

  // Validate
  if (!name || !email || !password) {
    return { error: "All fields are required." };
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return { error: "Enter a valid email address." };
  }
  if (isPersonalEmail(email)) {
    return { error: 'Please use a work email address. For personal emails like Gmail, use the "Sign in with Google" button instead.' };
  }
  if (password.length < 8) {
    return { error: "Password must be at least 8 characters." };
  }
  if (password !== confirmPassword) {
    return { error: "Passwords do not match." };
  }
  if (!["creator", "business", "agency"].includes(accountType)) {
    accountType = "creator";
  }

  await dbConnect();

  const existing = await User.findOne({ email });
  if (existing) {
    return { error: "An account with this email already exists." };
  }

  const passwordHash = await bcrypt.hash(password, 12);
  const userId = email; // use email as unique userId

  const trialEndsAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

  await User.create({
    userId,
    email,
    name,
    instagramHandle: instagramHandle || undefined,
    accountType,
    ...(accountType === "business" && businessName ? { businessProfile: { businessName, website } } : {}),
    ...(accountType === "agency" && companyName ? { agencyProfile: { companyName, website } } : {}),
    passwordHash,
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

  // Issue master JWT
  const token = await generateToken({ userId });
  const cookieStore = await cookies();
  cookieStore.set("auth_token", token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 60 * 60 * 24 * 30,
    path: "/",
  });

  return { success: true };
}
