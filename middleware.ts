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
      return NextResponse.redirect(new URL("/", req.url));
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
