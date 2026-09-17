import { getResend, FROM_EMAIL } from "./resend";
import { formatNaira } from "./format";

function wrapper(bodyHtml: string) {
  return `
  <div style="font-family: -apple-system, Helvetica, Arial, sans-serif; background:#F6F4EF; padding:32px 16px;">
    <div style="max-width:480px;margin:0 auto;background:#FFFFFF;border:1px solid #E3E0D8;padding:32px;">
      <p style="font-family: Georgia, serif; font-size:20px; margin:0 0 24px;">Baronquinn</p>
      ${bodyHtml}
    </div>
  </div>`;
}

export async function sendVerificationEmail(to: string, name: string, token: string) {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";
  const link = `${siteUrl}/verify?token=${token}`;

  const resend = getResend();
  if (!resend) {
    console.warn("RESEND_API_KEY not set — skipping verification email. Link:", link);
    return;
  }

  await resend.emails.send({
    from: FROM_EMAIL,
    to,
    subject: "Confirm your email — Baronquinn",
    html: wrapper(`
      <p style="font-size:16px;">Hi ${name},</p>
      <p style="font-size:14px; color:#555; line-height:1.6;">
        Confirm your email address to finish setting up your account.
      </p>
      <a href="${link}" style="display:inline-block; margin-top:16px; background:#0A0A0A; color:#FFFFFF; text-decoration:none; padding:12px 24px; font-size:14px;">
        Confirm email
      </a>
      <p style="font-size:12px; color:#999; margin-top:24px;">
        If the button doesn't work, paste this into your browser:<br>${link}
      </p>
    `)
  });
}

export async function sendOrderConfirmationEmail(
  to: string,
  order: { productName: string; amount: number; reference: string; recipient: { name: string } }
) {
  const resend = getResend();
  if (!resend) {
    console.warn("RESEND_API_KEY not set — skipping order confirmation email for", order.reference);
    return;
  }

  await resend.emails.send({
    from: FROM_EMAIL,
    to,
    subject: "Your gift is on its way — Baronquinn",
    html: wrapper(`
      <p style="font-size:16px;">Payment received — thank you.</p>
      <p style="font-size:14px; color:#555; line-height:1.6;">
        ${order.productName} is on its way to ${order.recipient.name}.
      </p>
      <table style="width:100%; margin-top:16px; font-size:13px; border-top:1px solid #E3E0D8; padding-top:16px;">
        <tr><td style="color:#999;">Reference</td><td style="text-align:right;">${order.reference}</td></tr>
        <tr><td style="color:#999;">Amount</td><td style="text-align:right;">${formatNaira(order.amount)}</td></tr>
      </table>
    `)
  });
}
