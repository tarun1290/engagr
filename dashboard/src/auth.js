import NextAuth from "next-auth"
// import Google from "next-auth/providers/google"

export const { handlers, signIn, signOut, auth } = NextAuth({
  providers: [
    // Google({
    //   clientId: process.env.GOOGLE_CLIENT_ID,
    //   clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    // })
  ],
  callbacks: {
    session({ session, token }) {
      session.user.id = token.sub
      return session
    }
  },
  pages: {
    signIn: '/sign-in',
  }
})
