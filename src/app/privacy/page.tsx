export const metadata = { title: "Privacy Policy" };

export default function PrivacyPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-10">
      <h1 className="text-4xl font-black">Privacy Policy</h1>
      <p className="mt-2 text-lg text-stone-500">Last updated: 21 November 2026</p>

      <div className="mt-6 flex flex-col gap-5 text-lg leading-relaxed text-stone-800">
        <section>
          <h2 className="text-2xl font-bold">What we collect</h2>
          <p>
            We collect the details you give us: your name, how to reach you, and the things you buy or sell.
            We also keep basic records of how the site is used so we can make it better.
          </p>
        </section>
        <section>
          <h2 className="text-2xl font-bold">How we use it</h2>
          <ul className="ml-6 list-disc">
            <li>To let buyers and sellers find and message each other.</li>
            <li>To process orders and keep everyone informed.</li>
            <li>To keep the marketplace safe and fair.</li>
          </ul>
        </section>
        <section>
          <h2 className="text-2xl font-bold">Who can see it</h2>
          <p>
            Sellers see the delivery details needed to fulfil your order. We do not sell your personal
            information to anyone.
          </p>
        </section>
        <section>
          <h2 className="text-2xl font-bold">Keeping it safe</h2>
          <p>
            Passwords are stored in a scrambled form and are never shown. We use secure connections and
            limit who can access your data.
          </p>
        </section>
        <section>
          <h2 className="text-2xl font-bold">Your choices</h2>
          <p>
            You can update your details at any time. Sellers can hide or delete their shop. To ask about
            your data, contact us through the help centre.
          </p>
        </section>
      </div>
    </div>
  );
}