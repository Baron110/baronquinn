import { withAuth } from "next-auth/middleware";
import { NextResponse } from "next/server";

const ADMIN_ROOT = "/08088adminpanel";
const ADMIN_LOGIN = `${ADMIN_ROOT}/login`;

export default withAuth(
  function middleware(req) {
    const { pathname } = req.nextUrl;
    const token = req.nextauth.token;

    // Let the admin login page itself render regardless of auth state —
    // otherwise this would redirect the login page to itself in a loop.
    if (pathname === ADMIN_LOGIN) {
      return NextResponse.next();
    }

    if (!token) {
      return NextResponse.redirect(new URL(ADMIN_LOGIN, req.url));
    }

    if (token.role !== "admin") {
      // Don't bounce silently to the customer homepage — that's what reads
      // as "it just took me to a normal user page" with zero explanation.
      // Send them back to the login screen with enough context to actually
      // understand what happened.
      const url = new URL(ADMIN_LOGIN, req.url);
      url.searchParams.set("denied", "1");
      if (typeof token.email === "string") url.searchParams.set("email", token.email);
      return NextResponse.redirect(url);
    }

    return NextResponse.next();
  },
  {
    callbacks: {
      // Always true — auth/role decisions are all handled above instead of
      // NextAuth's default behavior, which would otherwise redirect anyone
      // without a token straight to the regular customer /login page.
      authorized: () => true
    }
  }
);

export const config = {
  matcher: ["/08088adminpanel/:path*"]
};
