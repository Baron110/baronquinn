import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { getServerSession } from "next-auth";
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

export default async function OrderReceiptPage({ params }: { params: { reference: string } }) {
  const session = await getServerSession(authOptions);
  if (!session?.user) redirect(`/login?callbackUrl=/orders/${params.reference}`);

  await connectDB();
  const order = await Order.findOne({ reference: params.reference }).lean();

  // Not found, or belongs to someone else — admins can see any order,
  // everyone else only their own. Same "not found" either way so we don't
  // reveal that a reference exists to someone who shouldn't see it.
  const isOwner = order && (order as any).user?.toString() === session.user.id;
  const isAdmin = session.user.role === "admin";
  if (!order || (!isOwner && !isAdmin)) notFound();

  const o = order as any;

  return (
    <>
      <Header />
      <main className="max-w-content mx-auto px-5 py-10">
        <Link href="/orders" className="text-xs text-ink/50 hover:text-ink underline underline-offset-4">
          &larr; Your orders
        </Link>

        <div className="flex items-start justify-between mt-4 mb-8 gap-4">
          <div>
            <h1 className="text-2xl">Order receipt</h1>
            <p className="text-xs text-ink/40 mt-1">
              {o.reference} &middot;{" "}
              {new Date(o.createdAt).toLocaleDateString(undefined, {
                year: "numeric",
                month: "long",
                day: "numeric"
              })}
            </p>
          </div>
          <p className={`text-sm capitalize shrink-0 ${statusColor[o.status] ?? "text-ink/50"}`}>{o.status}</p>
        </div>

        <div className="grid md:grid-cols-[1fr_320px] gap-10">
          <section>
            <h2 className="text-sm uppercase tracking-wide text-ink/50 mb-3">Items</h2>
            <div className="border border-line divide-y divide-line">
              {o.items.map((item: any, i: number) => (
                <div key={i} className="flex items-center justify-between p-4">
                  <div>
                    <p className="text-sm">{item.productName}</p>
                    {item.quantity > 1 && <p className="text-xs text-ink/40 mt-0.5">Qty {item.quantity}</p>}
                  </div>
                  <p className="text-sm">{formatNaira(item.price * item.quantity)}</p>
                </div>
              ))}
            </div>
            <div className="flex items-baseline justify-between mt-4 text-lg">
              <span>Total</span>
              <span>{formatNaira(o.amount)}</span>
            </div>

            {o.loveNote && (
              <div className="mt-8">
                <h2 className="text-sm uppercase tracking-wide text-ink/50 mb-3">Love note</h2>
                <p className="text-sm text-ink/70 border border-line p-4 whitespace-pre-wrap">{o.loveNote}</p>
              </div>
            )}
          </section>

          <aside className="space-y-8">
            <div>
              <h2 className="text-sm uppercase tracking-wide text-ink/50 mb-3">Recipient</h2>
              <p className="text-sm">{o.recipient.name}</p>
              {o.recipient.phone && <p className="text-sm text-ink/60 mt-0.5">{o.recipient.phone}</p>}
            </div>

            <div>
              <h2 className="text-sm uppercase tracking-wide text-ink/50 mb-3">Delivery address</h2>
              <p className="text-sm text-ink/70 leading-relaxed">
                {o.address.street}
                {o.address.apartment && <>, {o.address.apartment}</>}
                <br />
                {o.address.city}, {o.address.state}
                <br />
                {o.address.country}
                {o.address.zip && <> {o.address.zip}</>}
              </p>
            </div>

            <div>
              <h2 className="text-sm uppercase tracking-wide text-ink/50 mb-3">Contact</h2>
              <p className="text-sm text-ink/70">{o.sender.name}</p>
              <p className="text-sm text-ink/70">{o.sender.email}</p>
              <p className="text-sm text-ink/70">{o.sender.phone}</p>
            </div>
          </aside>
        </div>
      </main>
      <Footer />
    </>
  );
}
