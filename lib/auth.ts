import { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { connectDB } from "./mongodb";
import User from "@/models/User";

export const authOptions: NextAuthOptions = {
  session: { strategy: "jwt" },
  pages: {
    signIn: "/login"
  },
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" }
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null;

        await connectDB();
        const user = await User.findOne({ email: credentials.email.toLowerCase() });
        if (!user) return null;

        const valid = await bcrypt.compare(credentials.password, user.passwordHash);
        if (!valid) return null;

        return {
          id: user._id.toString(),
          name: user.name,
          email: user.email,
          role: user.role
        };
      }
    })
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = (user as any).id;
        token.role = (user as any).role;
      } else if (token.id) {
        // Re-check role on every token refresh, not just at sign-in — without
        // this, promoting or demoting someone via the create-admin script had
        // no effect until they logged out and back in, since the JWT kept
        // whatever role it was issued with.
        try {
          await connectDB();
          const dbUser = await User.findById(token.id).select("role");
          if (dbUser) token.role = dbUser.role;
        } catch {
          // Leave the existing token.role as a fallback if Mongo is briefly unreachable.
        }
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        (session.user as any).id = token.id;
        (session.user as any).role = token.role;

        // Re-check verification status against Mongo on every session read
        // (not cached on the token) so a fresh /verify click is reflected
        // immediately without forcing a re-login.
        try {
          await connectDB();
          const dbUser = await User.findById(token.id).select("emailVerified");
          (session.user as any).emailVerified = dbUser?.emailVerified ?? false;
        } catch {
          (session.user as any).emailVerified = false;
        }
      }
      return session;
    }
  }
};
