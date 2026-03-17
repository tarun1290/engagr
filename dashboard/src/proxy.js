// import { auth } from "@/auth"
import { NextResponse } from "next/server"

export default function proxy(req) {
  const { pathname } = req.nextUrl

  // Protect admin dashboard with key-based cookie
  if (pathname.startsWith('/admin/dashboard')) {
    const adminSession = req.cookies.get('admin_session')?.value
    if (adminSession !== process.env.ADMIN_KEY) {
      return NextResponse.redirect(new URL('/admin', req.nextUrl))
    }
  }

  // Main app auth disabled — re-enable when Google OAuth is configured
  // const isLoggedIn = !!req.auth
  // const isProtected = pathname.startsWith('/dashboard') || pathname.startsWith('/onboarding')
  // if (isProtected && !isLoggedIn) {
  //   return NextResponse.redirect(new URL('/sign-in', req.nextUrl))
  // }
}

export const config = {
  matcher: [
    '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
    '/(api|trpc)(.*)',
  ],
}
