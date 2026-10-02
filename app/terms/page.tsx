import Header from "@/components/Header";
import Footer from "@/components/Footer";

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="mb-8">
      <h2 className="text-lg mb-3">{title}</h2>
      <div className="text-sm text-ink/70 leading-relaxed space-y-3">{children}</div>
    </section>
  );
}

export default function TermsPage() {
  return (
    <>
      <Header />
      <main className="max-w-2xl mx-auto px-5 py-10">
        <h1 className="text-2xl mb-2">Terms &amp; Conditions</h1>
        <p className="text-xs text-ink/40 mb-10">Last updated October 2026</p>

        <Section title="1. About these terms">
          <p>
            These terms cover everything on Baronquinn — browsing and ordering gifts, using Studio's AI tools, and
            your wallet balance. By creating an account or placing an order, you're agreeing to them. This is a
            general template, not legal advice, and it may be updated from time to time.
          </p>
        </Section>

        <Section title="2. Your account">
          <p>
            You need an account to check out or use Studio. Keep your login details to yourself, and keep your
            contact details accurate — we use them to confirm orders, send delivery updates, and reach you about
            anything you've paid for.
          </p>
        </Section>

        <Section title="3. Orders and payment">
          <p>
            Orders are paid by bank transfer into a one-time account number generated for that order. Prices are in
            Naira. An order is confirmed once we've received the full amount — partial transfers aren't
            automatically treated as payment, and we'll follow up with you if one arrives.
          </p>
        </Section>

        <Section title="4. Delivery">
          <p>
            We ship internationally. Delivery times vary by destination and by item — customized and made-to-order
            pieces generally take longer than ready items. It's your responsibility to provide a correct, complete
            delivery address; we're not able to redirect a shipment once it's left for an address you entered
            incorrectly.
          </p>
        </Section>

        <Section title="5. Studio — AI tools">
          <p>
            Studio tools (background removal, enhance, prompt editing, face swap, image to video, voice cloning,
            document generation) are paid for from your wallet balance, charged per use. If a generation fails on
            our end, you're refunded automatically — you'll never be charged for a result you didn't receive.
          </p>
          <p>
            You're responsible for what you upload. Only use photos and voice samples you have the right to use —
            your own, or someone else's with their clear permission. Don't upload anyone's likeness or voice without
            their consent, and don't use Studio to create misleading, harmful, or illegal content. We can suspend
            access for misuse.
          </p>
          <p>
            AI results vary and aren't guaranteed to match exactly what you had in mind — Studio charges aren't
            refundable on that basis alone, only when the tool genuinely failed to produce a result.
          </p>
        </Section>

        <Section title="6. Wallet balance">
          <p>
            Funds added to your wallet can be used toward orders or Studio tools. Wallet balance isn't transferable
            to another account and isn't redeemable for cash, except where required by law.
          </p>
        </Section>

        <Section title="7. Returns and refunds">
          <p>
            Because most items are made to order or personalized, orders generally can't be cancelled or returned
            once production has started. If something arrives damaged, wrong, or significantly different from what
            you ordered, contact support with your order reference and photos — we'll sort it out.
          </p>
        </Section>

        <Section title="8. Acceptable use">
          <p>
            Don't use Baronquinn for fraud, to abuse the payment or wallet system, or to interfere with the site's
            normal operation. We can suspend or close accounts that do.
          </p>
        </Section>

        <Section title="9. Liability">
          <p>
            We aim to get every order and every Studio result right, but we can't guarantee the platform will
            always be available or error-free. To the extent the law allows, our liability is limited to the amount
            you paid for the specific order or Studio generation in question.
          </p>
        </Section>

        <Section title="10. Contact">
          <p>
            Questions about these terms, or about an order? Reach us through the{" "}
            <a href="/support" className="underline underline-offset-4">
              support page
            </a>
            .
          </p>
        </Section>
      </main>
      <Footer />
    </>
  );
}
