import Link from "next/link";
import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";
import { connectDB } from "@/lib/mongodb";
import Order from "@/models/Order";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { formatNaira } from "@/lib/format";

const statusColor: Record<string, string> = {
  paid: "text-green-700",
  pending: "text-ink/50",
  failed: "text-red-700",
  cancelled: "text-ink/30"
};

export default async function OrdersPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user) redirect("/login?callbackUrl=/orders");

  await connectDB();
  const orders = await Order.find({ user: session.user.id }).sort({ createdAt: -1 }).lean();

  return (
    <>
      <Header />
      <main className="max-w-content mx-auto px-5 py-10">
        <h1 className="text-2xl mb-8">Your orders</h1>

        {orders.length === 0 ? (
          <div className="text-center py-16">
            <p className="text-ink/60">You haven't placed an order yet.</p>
            <Link
              href="/"
              className="inline-block mt-6 border border-ink px-6 py-3 text-sm hover:bg-ink hover:text-paper transition-colors"
            >
              Browse gifts
            </Link>
          </div>
        ) : (
          <div className="border border-line divide-y divide-line">
            {orders.map((o: any) => {
              const itemSummary =
                o.items.length === 1
                  ? o.items[0].productName
                  : `${o.items.length} items`;

              return (
                <Link
                  key={o.reference}
                  href={`/orders/${o.reference}`}
                  className="flex items-center justify-between p-4 hover:bg-bone transition-colors gap-4"
                >
                  <div className="min-w-0">
                    <p className="text-sm truncate">{itemSummary}</p>
                    <p className="text-xs text-ink/40 mt-0.5">
                      {new Date(o.createdAt).toLocaleDateString(undefined, {
                        year: "numeric",
                        month: "short",
                        day: "numeric"
                      })}{" "}
                      &middot; {o.reference}
                    </p>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-sm">{formatNaira(o.amount)}</p>
                    <p className={`text-xs capitalize mt-0.5 ${statusColor[o.status] ?? "text-ink/50"}`}>
                      {o.status}
                    </p>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </main>
      <Footer />
    </>
  );
}
