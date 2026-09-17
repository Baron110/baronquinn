import { NextRequest, NextResponse } from "next/server";
import { verifyNotifyChecksum } from "@/lib/paygate";
import { connectDB } from "@/lib/mongodb";
import Order from "@/models/Order";
import User from "@/models/User";
import WalletTransaction from "@/models/WalletTransaction";
import { sendOrderConfirmationEmail } from "@/lib/emails";

// PayGate calls this server-to-server once the customer finishes on PayWeb.
// This is the source of truth for whether a payment succeeded — the browser
// redirect to /checkout/return can be closed or lost, this can't.
export async function POST(req: NextRequest) {
  const formData = await req.formData();
  const fields = Object.fromEntries(formData.entries()) as Record<string, string>;

  if (!verifyNotifyChecksum(fields)) {
    console.warn("PayGate notify: checksum mismatch", fields);
    return NextResponse.json({ error: "invalid checksum" }, { status: 400 });
  }

  // TRANSACTION_STATUS: 1 = approved. See PayGate's Transaction Status Codes reference.
  const approved = fields.TRANSACTION_STATUS === "1";
  const reference = fields.REFERENCE;

  await connectDB();

  if (reference?.startsWith("wallet-")) {
    return handleWalletDeposit(reference, approved);
  }
  return handleOrderPayment(reference, approved);
}

async function handleWalletDeposit(reference: string, approved: boolean) {
  const tx = await WalletTransaction.findOne({ reference });

  if (!tx) {
    console.warn("PayGate notify: no wallet transaction found for reference", reference);
    return NextResponse.json({ received: true, warning: "transaction not found" });
  }

  // Already processed (PayGate can retry notifications) — don't double-credit.
  if (tx.status !== "pending") {
    return NextResponse.json({ received: true, note: "already processed" });
  }

  tx.status = approved ? "completed" : "failed";
  await tx.save();

  if (approved) {
    await User.findByIdAndUpdate(tx.user, { $inc: { walletBalance: tx.amount } });
  }

  return NextResponse.json({ received: true });
}

async function handleOrderPayment(reference: string, approved: boolean) {
  const order = await Order.findOne({ reference });

  if (!order) {
    console.warn("PayGate notify: no order found for reference", reference);
    return NextResponse.json({ received: true, warning: "order not found" });
  }

  order.status = approved ? "paid" : "failed";
  await order.save();

  if (approved) {
    try {
      await sendOrderConfirmationEmail(order.sender.email, {
        productName: order.productName,
        amount: order.amount,
        reference: order.reference,
        recipient: order.recipient
      });
    } catch (err) {
      console.error("Failed to send order confirmation email:", err);
    }
  }

  return NextResponse.json({ received: true });
}
