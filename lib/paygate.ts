import crypto from "crypto";

const API_KEY = process.env.PAYGATE_API_KEY ?? ""; // ak_live_xxx / ak_test_xxx
const SECRET = process.env.PAYGATE_SECRET ?? ""; // sk_live_xxx / sk_test_xxx — signs outgoing requests
const WEBHOOK_SECRET = process.env.PAYGATE_WEBHOOK_SECRET ?? ""; // separate secret — verifies incoming webhooks
const BASE_URL = "https://api.paygate.ng/api";

// "palmpay" or "nomba" per PayGate's docs — whichever your account is provisioned for.
const VA_PROVIDER = process.env.PAYGATE_VA_PROVIDER || "palmpay";

function signRequest(timestamp: string, bodyStr: string) {
  return crypto.createHmac("sha256", SECRET).update(`${timestamp}.${bodyStr}`).digest("hex");
}

async function paygateRequest<T = any>(
  method: "GET" | "POST" | "PUT" | "PATCH" | "DELETE",
  path: string,
  body?: unknown,
  extraHeaders?: Record<string, string>
): Promise<T> {
  if (!API_KEY || !SECRET) {
    throw new Error("PAYGATE_API_KEY and PAYGATE_SECRET must be set");
  }

  const bodyStr = body ? JSON.stringify(body) : "";
  const timestamp = String(Math.floor(Date.now() / 1000));

  const res = await fetch(`${BASE_URL}${path}`, {
    method,
    headers: {
      Authorization: `Bearer ${API_KEY}`,
      "X-Timestamp": timestamp,
      "X-Signature": signRequest(timestamp, bodyStr),
      "Content-Type": "application/json",
      ...extraHeaders
    },
    // Sending the exact same string we signed — not the object — so the
    // bytes PayGate hashes on their end match what we hashed on ours.
    body: bodyStr || undefined
  });

  const json = await res.json();
  if (!res.ok || json.status === "error") {
    throw new Error(json.message || `PayGate request failed (${res.status})`);
  }
  return json;
}

export type VirtualAccount = {
  uuid: string;
  accountNumber: string;
  accountName: string;
  bankName: string;
};

// One virtual account per payment attempt. `reference` (an order or wallet
// reference, already unique) doubles as both the idempotency key and the
// customer's external_reference, so retrying this call for the same
// reference safely returns the same account instead of risking PayGate's
// per-customer account reuse handing back a DIFFERENT order's account.
export async function createVirtualAccount(params: {
  reference: string;
  name: string;
  email: string;
  phone: string;
}): Promise<VirtualAccount> {
  const json = await paygateRequest<{
    data: { virtual_account: { uuid: string; account_number: string; account_name: string; bank_name: string } };
  }>(
    "POST",
    "/virtual-accounts",
    {
      provider: VA_PROVIDER,
      is_permanent: false,
      customer: {
        name: params.name,
        email: params.email,
        phone: params.phone,
        external_reference: params.reference
      }
    },
    { "X-Idempotency-Key": params.reference }
  );

  const va = json.data.virtual_account;
  return {
    uuid: va.uuid,
    accountNumber: va.account_number,
    accountName: va.account_name,
    bankName: va.bank_name
  };
}

// Webhook signature is HMAC-SHA256 of the RAW request body (not the parsed
// object — whitespace/key-order changes would break the hash), using the
// separate webhook secret, sent as "sha256=<hex>".
export function verifyWebhookSignature(rawBody: string, signatureHeader: string | null): boolean {
  if (!WEBHOOK_SECRET || !signatureHeader) return false;

  const received = signatureHeader.startsWith("sha256=") ? signatureHeader.slice(7) : signatureHeader;
  const expected = crypto.createHmac("sha256", WEBHOOK_SECRET).update(rawBody).digest("hex");

  const receivedBuf = Buffer.from(received, "hex");
  const expectedBuf = Buffer.from(expected, "hex");
  if (receivedBuf.length !== expectedBuf.length) return false;

  return crypto.timingSafeEqual(receivedBuf, expectedBuf);
}
