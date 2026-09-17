import { Resend } from "resend";

let client: Resend | null = null;

// Constructed on first use, not at module load — Next.js's build-time page-data
// collection imports every route module, and `new Resend(undefined)` throws
// immediately, which was taking the whole `npm run build` down even for routes
// that only send email at runtime, when the env var will actually be present.
export function getResend() {
  if (!process.env.RESEND_API_KEY) return null;
  if (!client) client = new Resend(process.env.RESEND_API_KEY);
  return client;
}

// Must be an address on a domain you've verified in the Resend dashboard —
// a plain Gmail/Yahoo address will not send.
export const FROM_EMAIL = process.env.RESEND_FROM_EMAIL ?? "Baronquinn <noreply@baronquinn.com>";
