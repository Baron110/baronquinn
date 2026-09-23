import { getResend, FROM_EMAIL } from "./resend";
import { formatNaira } from "./format";

function siteUrl() {
  return process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";
}

function wrapper(bodyHtml: string) {
  const url = siteUrl();
  return `
  <div style="background:#F6F4EF; padding:40px 16px; font-family:-apple-system,Helvetica,Arial,sans-serif;">
    <div style="max-width:520px; margin:0 auto;">
      <div style="text-align:center; margin-bottom:24px;">
        <p style="font-family:Georgia,'Times New Roman',serif; font-size:26px; letter-spacing:0.5px; margin:0; color:#0A0A0A;">
          Baronquinn
        </p>
        <p style="font-size:11px; letter-spacing:1.5px; text-transform:uppercase; color:#0A0A0A99; margin:8px 0 0;">
          Curated gifts, delivered
        </p>
      </div>

      <div style="background:#FFFFFF; border:1px solid #E3E0D8; padding:40px 36px;">
        ${bodyHtml}
      </div>

      <div style="text-align:center; margin-top:28px;">
        <p style="font-size:12px; color:#0A0A0A66; line-height:1.7; margin:0;">
          Flowers, keepsakes, and custom pieces for every occasion — delivered across Nigeria.<br>
          <a href="${url}/support" style="color:#0A0A0A99; text-decoration:underline;">Support</a>
          &nbsp;&middot;&nbsp;
          <a href="${url}/terms" style="color:#0A0A0A99; text-decoration:underline;">Terms</a>
        </p>
      </div>
    </div>
  </div>`;
}

export async function sendVerificationEmail(to: string, name: string, token: string) {
  const link = `${siteUrl()}/verify?token=${token}`;

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
      <p style="font-size:11px; text-transform:uppercase; letter-spacing:1.5px; color:#9A3B12; font-weight:600; margin:0 0 14px;">
        Verify your email
      </p>
      <p style="font-size:19px; margin:0 0 16px; color:#0A0A0A;">Hi ${name},</p>
      <p style="font-size:14px; color:#555; line-height:1.7; margin:0 0 28px;">
        Welcome to Baronquinn — we help you send flowers, keepsakes, and custom gifts to the
        people who matter, delivered across Nigeria. One quick step before you can start
        ordering: confirm this is really your email address.
      </p>
      <a href="${link}" style="display:inline-block; background:#0A0A0A; color:#FFFFFF; text-decoration:none; padding:14px 32px; font-size:14px; letter-spacing:0.3px;">
        Confirm email
      </a>
      <p style="font-size:12px; color:#999; margin-top:32px; line-height:1.6;">
        Button not working? Paste this link into your browser:<br>
        <a href="${link}" style="color:#9A3B12; word-break:break-all;">${link}</a>
      </p>
      <p style="font-size:12px; color:#bbb; margin-top:24px;">
        Didn't sign up for Baronquinn? You can safely ignore this email.
      </p>
    `)
  });
}

export async function sendOrderConfirmationEmail(
  to: string,
  order: {
    items: { productName: string; price: number; quantity: number }[];
    amount: number;
    reference: string;
    recipient: { name: string };
  }
) {
  const resend = getResend();
  if (!resend) {
    console.warn("RESEND_API_KEY not set — skipping order confirmation email for", order.reference);
    return;
  }

  const itemsSummary =
    order.items.length === 1
      ? order.items[0].productName
      : `${order.items.length} items (${order.items.map((i) => i.productName).join(", ")})`;

  const itemRows = order.items
    .map(
      (i) => `
      <tr>
        <td style="padding:8px 0; border-bottom:1px solid #F6F4EF; font-size:13px;">
          ${i.productName}${i.quantity > 1 ? ` &times; ${i.quantity}` : ""}
        </td>
        <td style="padding:8px 0; border-bottom:1px solid #F6F4EF; text-align:right; font-size:13px;">
          ${formatNaira(i.price * i.quantity)}
        </td>
      </tr>`
    )
    .join("");

  await resend.emails.send({
    from: FROM_EMAIL,
    to,
    subject: "Your gift is on its way — Baronquinn",
    html: wrapper(`
      <p style="font-size:11px; text-transform:uppercase; letter-spacing:1.5px; color:#9A3B12; font-weight:600; margin:0 0 14px;">
        Payment received
      </p>
      <p style="font-size:19px; margin:0 0 16px; color:#0A0A0A;">Thank you — your gift is on its way.</p>
      <p style="font-size:14px; color:#555; line-height:1.7; margin:0 0 28px;">
        ${itemsSummary} heading to <strong>${order.recipient.name}</strong>. We'll take it from here.
      </p>

      <table style="width:100%; border-collapse:collapse;">
        ${itemRows}
        <tr>
          <td style="padding-top:12px; color:#999; font-size:12px;">Reference</td>
          <td style="padding-top:12px; text-align:right; color:#999; font-size:12px;">${order.reference}</td>
        </tr>
        <tr>
          <td style="padding-top:6px; font-weight:600; font-size:16px; color:#0A0A0A;">Total</td>
          <td style="padding-top:6px; text-align:right; font-weight:600; font-size:16px; color:#0A0A0A;">
            ${formatNaira(order.amount)}
          </td>
        </tr>
      </table>

      <p style="font-size:12px; color:#999; margin-top:28px; line-height:1.7;">
        Questions about this order? Visit our
        <a href="${siteUrl()}/support" style="color:#9A3B12;">support page</a>
        and mention reference <strong>${order.reference}</strong> so we can find it quickly.
      </p>
    `)
  });
}
