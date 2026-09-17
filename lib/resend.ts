import { Resend } from "resend";

export const resend = new Resend(process.env.RESEND_API_KEY);

// Must be an address on a domain you've verified in the Resend dashboard —
// a plain Gmail/Yahoo address will not send.
export const FROM_EMAIL = process.env.RESEND_FROM_EMAIL ?? "Baronquinn <noreply@baronquinn.com>";
