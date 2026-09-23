import { NextRequest, NextResponse } from "next/server";
import { createVirtualAccount } from "@/lib/paygate";
import { connectDB } from "@/lib/mongodb";
import Order from "@/models/Order";
import WalletTransaction from "@/models/WalletTransaction";

export async function POST(req: NextRequest) {
  const { reference, name, email, phone } = await req.json();

  if (!reference || !name || !email || !phone) {
    return NextResponse.json({ error: "reference, name, email, and phone are required" }, { status: 400 });
  }

  await connectDB();

  const isWallet = reference.startsWith("wallet-");
  const record = isWallet
    ? await WalletTransaction.findOne({ reference })
    : await Order.findOne({ reference });

  if (!record) {
    return NextResponse.json({ error: "No matching order or transaction found" }, { status: 404 });
  }

  // Already have a virtual account from an earlier attempt at this same
  // reference (e.g. the person refreshed the page) — reuse it rather than
  // asking PayGate for a new one.
  if (record.payment?.accountNumber) {
    return NextResponse.json({
      accountNumber: record.payment.accountNumber,
      accountName: record.payment.accountName,
      bankName: record.payment.bankName,
      amount: record.amount
    });
  }

  try {
    const va = await createVirtualAccount({ reference, name, email, phone });

    record.payment = {
      accountNumber: va.accountNumber,
      accountName: va.accountName,
      bankName: va.bankName,
      virtualAccountUuid: va.uuid
    };
    await record.save();

    return NextResponse.json({
      accountNumber: va.accountNumber,
      accountName: va.accountName,
      bankName: va.bankName,
      amount: record.amount
    });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Could not create a payment account" }, { status: 502 });
  }
}
