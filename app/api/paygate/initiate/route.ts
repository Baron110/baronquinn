import { NextRequest, NextResponse } from "next/server";
import { initiatePaygateTransaction } from "@/lib/paygate";

export async function POST(req: NextRequest) {
  const { amount, email, reference } = await req.json();

  if (!amount || !email || !reference) {
    return NextResponse.json({ error: "amount, email, and reference are required" }, { status: 400 });
  }

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

  try {
    const { payRequestId, checksum } = await initiatePaygateTransaction({
      reference,
      amountKobo: Math.round(amount * 100),
      currency: process.env.PAYGATE_CURRENCY ?? "NGN",
      email,
      returnUrl: `${siteUrl}/checkout/return`,
      notifyUrl: `${siteUrl}/api/paygate/notify`
    });

    return NextResponse.json({ payRequestId, checksum });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Could not start payment" }, { status: 502 });
  }
}
