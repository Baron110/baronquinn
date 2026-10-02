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

export default function PrivacyPage() {
  return (
    <>
      <Header />
      <main className="max-w-2xl mx-auto px-5 py-10">
        <h1 className="text-2xl mb-2">Privacy Policy</h1>
        <p className="text-xs text-ink/40 mb-10">Last updated October 2026</p>

        <Section title="What we collect">
          <p>
            Account details (name, email, phone), order details (recipient name, delivery address, what you
            ordered), and anything you upload to Studio — photos, voice samples, and what you type into prompt or
            document tools.
          </p>
        </Section>

        <Section title="How it's used">
          <p>
            To create and deliver your orders, run Studio generations, send order and delivery emails, and keep your
            wallet balance accurate. We don't sell your information to anyone.
          </p>
        </Section>

        <Section title="Who else sees it">
          <p>A few specialist services help run Baronquinn behind the scenes, each only seeing what they need to do their job:</p>
          <ul className="list-disc pl-5 space-y-1">
            <li>Payment processing, to collect bank transfers for orders and wallet top-ups</li>
            <li>Email delivery, to send verification and order confirmation emails</li>
            <li>Image and file storage, for product photos and anything you upload to Studio</li>
            <li>AI processing providers, to generate Studio results from what you upload or type</li>
            <li>Courier tracking lookups, when a real tracking number is attached to your order</li>
          </ul>
          <p>None of them are permitted to use your information for their own purposes.</p>
        </Section>

        <Section title="Studio uploads specifically">
          <p>
            Photos and voice samples you upload to Studio are sent to the AI service generating your result, and the
            result is stored so you can access it again later. We don't use your uploads to train any AI model.
          </p>
        </Section>

        <Section title="How long we keep it">
          <p>
            For as long as your account is active, so you can see your order history and past Studio results. You
            can ask us to delete your account and associated data at any time through the support page.
          </p>
        </Section>

        <Section title="Cookies">
          <p>
            We use a single login session cookie to keep you signed in. We don't use advertising or tracking
            cookies.
          </p>
        </Section>

        <Section title="Your rights">
          <p>
            You can ask to see what we hold about you, correct it, or have it deleted, by reaching out through the{" "}
            <a href="/support" className="underline underline-offset-4">
              support page
            </a>
            .
          </p>
        </Section>

        <Section title="Changes">
          <p>We'll update this page if how we handle your information changes.</p>
        </Section>
      </main>
      <Footer />
    </>
  );
}
