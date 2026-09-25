import { NextRequest, NextResponse } from "next/server";
import { verifyWebhookSignature } from "@/lib/paygate";
import { connectDB } from "@/lib/mongodb";
import Order from "@/models/Order";
import User from "@/models/User";
import WalletTransaction from "@/models/WalletTransaction";
import { sendOrderConfirmationEmail } from "@/lib/emails";

// PayGate calls this server-to-server once a transfer into one of our
// virtual accounts is detected. This is the source of truth for whether a
// payment succeeded — the browser can be closed or lose connection while
// waiting, this can't.
export async function POST(req: NextRequest) {
  // Read as raw text first — the signature is computed over the exact raw
  // bytes PayGate sent. Parsing straight to JSON and re-serializing could
  // change whitespace/key order and make a genuinely valid webhook fail.
  const rawBody = await req.text();

  if (!verifyWebhookSignature(rawBody, req.headers.get("x-paygate-signature"))) {
    console.warn("PayGate webhook: signature mismatch");
    return NextResponse.json({ error: "invalid signature" }, { status: 401 });
  }

  const event = JSON.parse(rawBody);

  if (event.event !== "payment.received") {
    // Ignore anything else gracefully rather than erroring — PayGate may
    // add event types later.
    return NextResponse.json({ received: true });
  }

  const data = event.data;
  const grossAmount: number = Number(data?.gross_amount ?? data?.amount ?? 0);

  await connectDB();

  // Preferred: PayGate echoes back the reference we set at account creation.
  let reference: string | undefined = data?.customer?.reference;

  // Fallback — seen in production: some payloads arrive with no `customer`
  // object at all, despite PayGate's own docs showing one. When that
  // happens, match by the account number the money actually landed in
  // instead, which we save on the order/transaction ourselves the moment
  // the virtual account is created. The account number shows up either as
  // its own field, or trailing inside the free-text `receiver` string
  // (e.g. "BUSINESS NAME 6622647378").
  if (!reference) {
    let accountNumber: string | undefined = data?.virtual_account?.account_number;
    if (!accountNumber && typeof data?.receiver === "string") {
      const match = data.receiver.match(/(\d{10,})\s*$/);
      if (match) accountNumber = match[1];
    }

    if (accountNumber) {
      const order = await Order.findOne({ "payment.accountNumber": accountNumber, status: "pending" }).sort({
        createdAt: -1
      });
      if (order) {
        reference = order.reference;
      } else {
        const tx = await WalletTransaction.findOne({
          "payment.accountNumber": accountNumber,
          status: "pending"
        }).sort({ createdAt: -1 });
        if (tx) reference = tx.reference;
      }
    }
  }

  if (!reference) {
    console.warn("PayGate webhook: could not match this payment to any order or wallet transaction", data);
    return NextResponse.json({ received: true, warning: "no match found" });
  }

  if (reference.startsWith("wallet-")) {
    return handleWalletDeposit(reference, grossAmount);
  }
  return handleOrderPayment(reference, grossAmount);
}

async function handleWalletDeposit(reference: string, grossAmount: number) {
  const tx = await WalletTransaction.findOne({ reference });

  if (!tx) {
    console.warn("PayGate webhook: no wallet transaction found for reference", reference);
    return NextResponse.json({ received: true, warning: "transaction not found" });
  }

  // Already processed (PayGate can retry deliveries) — don't double-credit.
  if (tx.status !== "pending") {
    return NextResponse.json({ received: true, note: "already processed" });
  }

  // Allow a small epsilon for floating-point amounts; anything meaningfully
  // short of what was asked for is left pending rather than credited.
  if (grossAmount + 1 < tx.amount) {
    console.warn(`PayGate webhook: underpaid wallet deposit ${reference} — got ${grossAmount}, needed ${tx.amount}`);
    return NextResponse.json({ received: true, note: "underpaid, left pending" });
  }

  tx.status = "completed";
  await tx.save();
  await User.findByIdAndUpdate(tx.user, { $inc: { walletBalance: tx.amount } });

  return NextResponse.json({ received: true });
}

async function handleOrderPayment(reference: string, grossAmount: number) {
  const order = await Order.findOne({ reference });

  if (!order) {
    console.warn("PayGate webhook: no order found for reference", reference);
    return NextResponse.json({ received: true, warning: "order not found" });
  }

  // Already processed — avoid sending a second confirmation email on retry.
  if (order.status === "paid") {
    return NextResponse.json({ received: true, note: "already processed" });
  }

  if (grossAmount + 1 < order.amount) {
    console.warn(`PayGate webhook: underpaid order ${reference} — got ${grossAmount}, needed ${order.amount}`);
    return NextResponse.json({ received: true, note: "underpaid, left pending" });
  }

  order.status = "paid";
  await order.save();

  try {
    await sendOrderConfirmationEmail(order.sender.email, {
      items: order.items,
      amount: order.amount,
      reference: order.reference,
      recipient: order.recipient
    });
  } catch (err) {
    console.error("Failed to send order confirmation email:", err);
  }

  return NextResponse.json({ received: true });
}
