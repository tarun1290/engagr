import { NextResponse } from "next/server";
import { jwtVerify } from "jose";

const secret = new TextEncoder().encode(
  process.env.JWT_SECRET || "ai-dm-bot-default-secret-change-in-production"
);

const PUBLIC_PATHS = ["/", "/sign-in", "/sign-up", "/api/webhook", "/api/auth"];

export default async function proxy(req) {
  const { pathname } = req.nextUrl;

  // Protect admin dashboard with key-based cookie
  if (pathname.startsWith("/admin/dashboard")) {
    const adminSession = req.cookies.get("admin_session")?.value;
    if (adminSession !== process.env.ADMIN_KEY) {
      return NextResponse.redirect(new URL("/admin", req.nextUrl));
    }
  }

  // Protect dashboard and onboarding with JWT
  if (pathname.startsWith("/dashboard") || pathname.startsWith("/onboarding")) {
    const token = req.cookies.get("auth_token")?.value;
    if (!token) {
      return NextResponse.redirect(new URL("/sign-in", req.nextUrl));
    }
    try {
      await jwtVerify(token, secret);
    } catch {
      return NextResponse.redirect(new URL("/sign-in", req.nextUrl));
    }
  }
}

export const config = {
  matcher: [
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    "/(api|trpc)(.*)",
  ],
};
