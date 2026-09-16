import crypto from "crypto";

const PAYGATE_ID = process.env.PAYGATE_ID ?? "";
const ENCRYPTION_KEY = process.env.PAYGATE_ENCRYPTION_KEY ?? "";
const INITIATE_URL = "https://secure.paygate.co.za/payweb3/initiate.trans";

// PayGate's checksum is MD5(concatenated field values in request order + encryption key).
// Field order matters — must match the order fields were added to the payload.
function checksum(values: (string | number)[]) {
  return crypto.createHash("md5").update(values.join("") + ENCRYPTION_KEY).digest("hex");
}

export type InitiateParams = {
  reference: string;
  amountKobo: number; // amount in the smallest currency unit, e.g. kobo for NGN, cents for ZAR
  currency: string; // confirm with PayGate which currencies your merchant account settles in
  email: string;
  returnUrl: string;
  notifyUrl: string;
};

export async function initiatePaygateTransaction(params: InitiateParams) {
  if (!PAYGATE_ID || !ENCRYPTION_KEY) {
    throw new Error("PAYGATE_ID and PAYGATE_ENCRYPTION_KEY must be set");
  }

  const transactionDate = new Date().toISOString().replace("T", " ").substring(0, 19);

  const fields: Record<string, string | number> = {
    PAYGATE_ID,
    REFERENCE: params.reference,
    AMOUNT: params.amountKobo,
    CURRENCY: params.currency,
    RETURN_URL: params.returnUrl,
    TRANSACTION_DATE: transactionDate,
    LOCALE: "en-us",
    COUNTRY: "NGA",
    EMAIL: params.email,
    NOTIFY_URL: params.notifyUrl,
    // Restricted to bank transfer, same as the PartyWithZell checkout —
    // card was removed there after Paystack verification issues, so this
    // keeps the two sites' payment flow consistent. Remove this field
    // to allow PayGate's full method list (card, EFT, etc).
    PAY_METHOD: "BT"
  };

  const CHECKSUM = checksum(Object.values(fields));
  const body = new URLSearchParams({ ...fields, CHECKSUM } as Record<string, string>);

  const res = await fetch(INITIATE_URL, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body
  });

  const text = await res.text();
  const parsed = Object.fromEntries(new URLSearchParams(text));

  if (!parsed.PAY_REQUEST_ID) {
    throw new Error(`PayGate initiate failed: ${text}`);
  }

  // Redirect-step checksum is MD5(PAYGATE_ID + PAY_REQUEST_ID + REFERENCE + key) per PayGate docs.
  const redirectChecksum = checksum([PAYGATE_ID, parsed.PAY_REQUEST_ID, params.reference]);

  return {
    payRequestId: parsed.PAY_REQUEST_ID,
    checksum: redirectChecksum
  };
}

// Verifies a Notify URL callback. PayGate signs the notify body with the same
// MD5(values + key) scheme, using all fields except CHECKSUM itself, in order.
export function verifyNotifyChecksum(fields: Record<string, string>) {
  const { CHECKSUM, ...rest } = fields;
  const expected = checksum(Object.values(rest));
  return expected === CHECKSUM;
}
