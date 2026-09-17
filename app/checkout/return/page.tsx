import Link from "next/link";
import { connectDB } from "@/lib/mongodb";
import Order from "@/models/Order";
import WalletTransaction from "@/models/WalletTransaction";

export default async function CheckoutReturnPage({
  searchParams
}: {
  searchParams: { REFERENCE?: string };
}) {
  let status: "paid" | "failed" | "pending" | "unknown" = "unknown";
  const isWalletDeposit = searchParams?.REFERENCE?.startsWith("wallet-");

  if (searchParams?.REFERENCE) {
    await connectDB();

    if (isWalletDeposit) {
      const tx = await WalletTransaction.findOne({ reference: searchParams.REFERENCE }).lean();
      if (tx) status = (tx as any).status === "completed" ? "paid" : (tx as any).status;
    } else {
      const order = await Order.findOne({ reference: searchParams.REFERENCE }).lean();
      if (order) status = (order as any).status;
    }
  }

  const copy = {
    paid: {
      title: isWalletDeposit ? "Wallet topped up" : "Payment received",
      body: isWalletDeposit
        ? "Your balance has been credited — you're ready to send gifts instantly from your wallet."
        : "Thank you — your gift is on its way. A confirmation has been sent to your email."
    },
    pending: {
      title: "Payment processing",
      body: "We're still confirming this payment with PayGate — refresh in a moment, or check your email shortly."
    },
    failed: {
      title: "Payment not completed",
      body: "Something went wrong or the payment was cancelled. No charge was made."
    },
    unknown: {
      title: "Payment status unavailable",
      body: "We couldn't find this transaction. If you completed a payment, check your email for confirmation."
    }
  }[status];

  return (
    <div className="min-h-screen flex items-center justify-center bg-bone px-5">
      <div className="w-full max-w-md bg-paper border border-line rounded-2xl shadow-sm p-8 text-center">
        <h1 className="text-2xl">{copy.title}</h1>
        <p className="text-sm text-ink/60 mt-2">{copy.body}</p>
        {searchParams?.REFERENCE && (
          <p className="text-xs text-ink/40 mt-3">Reference: {searchParams.REFERENCE}</p>
        )}
        <div className="flex gap-3 justify-center mt-6">
          {isWalletDeposit && (
            <Link
              href="/wallet"
              className="border border-ink px-6 py-3 text-sm hover:bg-ink hover:text-paper transition-colors"
            >
              View wallet
            </Link>
          )}
          <Link
            href="/"
            className="bg-ink text-paper px-6 py-3 text-sm hover:opacity-90 transition-opacity"
          >
            Back to home
          </Link>
        </div>
      </div>
    </div>
  );
}
