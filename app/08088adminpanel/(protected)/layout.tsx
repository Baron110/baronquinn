import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import Link from "next/link";
import { authOptions } from "@/lib/auth";
import Header from "@/components/Header";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  // Defense in depth: middleware.ts already blocks non-admins from reaching
  // /08088adminpanel/*, but every admin page checks again here directly
  // against the session, so a middleware misconfiguration alone can never be
  // the only thing standing between a regular user and this panel.
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    redirect("/08088adminpanel/login");
  }
  if (session.user.role !== "admin") {
    redirect("/");
  }

  return (
    <>
      <Header />
      <div className="max-w-content mx-auto px-5 py-8">
        <nav className="flex gap-6 text-sm border-b border-line mb-8 pb-4">
          <Link href="/08088adminpanel" className="hover:opacity-60">Dashboard</Link>
          <Link href="/08088adminpanel/products" className="hover:opacity-60">Products</Link>
          <Link href="/08088adminpanel/categories" className="hover:opacity-60">Categories</Link>
          <Link href="/08088adminpanel/orders" className="hover:opacity-60">Orders</Link>
        </nav>
        {children}
      </div>
    </>
  );
}
