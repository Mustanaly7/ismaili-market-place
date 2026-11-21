export const metadata = { title: "Terms of Service" };

export default function TermsPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-10">
      <h1 className="text-4xl font-black">Terms of Service</h1>
      <p className="mt-2 text-lg text-stone-500">Last updated: 21 November 2026</p>

      <div className="mt-6 flex flex-col gap-5 text-lg leading-relaxed text-stone-800">
        <section>
          <h2 className="text-2xl font-bold">1. Welcome</h2>
          <p>
            ISMAILI Market Place connects local sellers with buyers. By using the site you agree to these
            terms. We have written them in plain language on purpose.
          </p>
        </section>
        <section>
          <h2 className="text-2xl font-bold">2. Your account</h2>
          <p>
            Keep your login details safe. You are responsible for what happens under your account. Tell us
            straight away if you think someone else has used it.
          </p>
        </section>
        <section>
          <h2 className="text-2xl font-bold">3. Selling</h2>
          <p>
            Sellers must describe products honestly, show real photos, and honour the orders they accept.
            We may review, hide, or remove listings that break these terms.
          </p>
        </section>
        <section>
          <h2 className="text-2xl font-bold">4. Buying</h2>
          <p>
            When you place an order, you agree to pay the price shown. Some sellers arrange payment with you
            directly; those arrangements are between you and the seller.
          </p>
        </section>
        <section>
          <h2 className="text-2xl font-bold">5. Fees</h2>
          <p>
            The marketplace may take a small commission on sales. Any fee is shown to sellers before they
            list items and can change with notice.
          </p>
        </section>
        <section>
          <h2 className="text-2xl font-bold">6. Fair use</h2>
          <p>
            Do not post illegal, harmful, or misleading content. Do not harass other people. We may suspend
            accounts that do.
          </p>
        </section>
        <section>
          <h2 className="text-2xl font-bold">7. Questions</h2>
          <p>
            If anything here is unclear, contact us through the help centre. We are happy to explain.
          </p>
        </section>
      </div>
    </div>
  );
}