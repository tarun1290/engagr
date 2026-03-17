"use server";

import { cookies } from "next/headers";
import bcrypt from "bcryptjs";
import dbConnect from "@/lib/dbConnect";
import User from "@/models/User";
import { generateToken } from "@/lib/jwt";

export async function signIn(formData) {
  const email = (formData.get("email") || "").trim().toLowerCase();
  const password = formData.get("password") || "";

  if (!email || !password) {
    return { error: "Email and password are required." };
  }

  await dbConnect();

  const user = await User.findOne({ email });
  if (!user || !user.passwordHash) {
    return { error: "No account found with this email." };
  }

  const valid = await bcrypt.compare(password, user.passwordHash);
  if (!valid) {
    return { error: "Incorrect password." };
  }

  // Issue master JWT
  const token = await generateToken({ userId: user.userId });
  const cookieStore = await cookies();
  cookieStore.set("auth_token", token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 60 * 60 * 24 * 30,
    path: "/",
  });

  return { success: true, isConnected: user.isConnected };
}
