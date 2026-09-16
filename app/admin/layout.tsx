import Link from "next/link";
import Header from "@/components/Header";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <Header />
      <div className="max-w-content mx-auto px-5 py-8">
        <nav className="flex gap-6 text-sm border-b border-line mb-8 pb-4">
          <Link href="/admin" className="hover:opacity-60">Dashboard</Link>
          <Link href="/admin/products" className="hover:opacity-60">Products</Link>
          <Link href="/admin/categories" className="hover:opacity-60">Categories</Link>
          <Link href="/admin/orders" className="hover:opacity-60">Orders</Link>
        </nav>
        {children}
      </div>
    </>
  );
}
