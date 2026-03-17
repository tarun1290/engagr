import { redirect } from "next/navigation"

// Google OAuth disabled for now — redirect straight to dashboard
// Re-enable by uncommenting the Google provider in src/auth.js and setting
// GOOGLE_CLIENT_ID + GOOGLE_CLIENT_SECRET in .env.local

export default function SignInPage() {
  redirect("/dashboard")
}
