import Link from "next/link";
import { redirect } from "next/navigation";
import { Card } from "@/components/ui/Card";
import { Alert } from "@/components/ui/Alert";
import { Field, Input } from "@/components/ui/Field";
import { Button } from "@/components/ui/Button";
import { getCurrentUser } from "@/lib/auth";
import { requestOtpAction, verifyOtpAction } from "@/server/actions/otp";

export const dynamic = "force-dynamic";
export const metadata = { title: "Sign in with a code" };

export default async function OtpPage({
  searchParams,
}: {
  searchParams: Promise<{
    step?: string;
    identifier?: string;
    purpose?: string;
    role?: string;
    devCode?: string;
    error?: string;
    ok?: string;
  }>;
}) {
  const user = await getCurrentUser();
  if (user) redirect("/account");
  const sp = await searchParams;
  const step = sp.step === "verify" ? "verify" : "request";
  const identifier = sp.identifier ?? "";
  const purpose = sp.purpose === "signup" ? "signup" : "login";
  const role = sp.role === "seller" ? "seller" : "buyer";

  return (
    <div className="mx-auto flex max-w-md flex-col px-4 py-12">
      <Card>
        <h1 className="text-3xl font-extrabold">
          {step === "verify" ? "Enter your code" : "Sign in with a code"}
        </h1>
        <p className="mt-1 text-lg text-stone-600">
          {step === "verify"
            ? `We sent a 6-digit code to ${identifier}.`
            : "No password needed. We send a short code to your phone or email."}
        </p>
        <div className="mt-5">
          <Alert type="error" message={sp.error} />
          <Alert type="success" message={sp.ok} />
          {sp.devCode ? (
            <Alert
              type="info"
              message={`Demo mode: your code is ${sp.devCode} (a real deployment would text or email this).`}
            />
          ) : null}
        </div>

        {step === "request" ? (
          <form action={requestOtpAction} className="flex flex-col gap-4">
            <input type="hidden" name="purpose" value={purpose} />
            <input type="hidden" name="role" value={role} />
            <Field label="Email or phone" htmlFor="identifier" required hint="We send your code here.">
              <Input id="identifier" name="identifier" autoComplete="username" required />
            </Field>
            <Button type="submit" size="lg" fullWidth>
              Send me a code
            </Button>
          </form>
        ) : (
          <form action={verifyOtpAction} className="flex flex-col gap-4">
            <input type="hidden" name="identifier" value={identifier} />
            <input type="hidden" name="purpose" value={purpose} />
            <input type="hidden" name="role" value={role} />
            <Field label="6-digit code" htmlFor="code" required>
              <Input
                id="code"
                name="code"
                inputMode="numeric"
                autoComplete="one-time-code"
                maxLength={6}
                pattern="[0-9]*"
                className="text-center text-2xl tracking-[0.5em]"
                required
              />
            </Field>
            <Button type="submit" size="lg" fullWidth>
              Verify and continue
            </Button>
            <Link
              href={`/login/code?purpose=${purpose}&role=${role}`}
              className="text-center text-base font-semibold text-brand-700 hover:underline"
            >
              Use a different email or phone
            </Link>
          </form>
        )}

        <p className="mt-5 text-center text-lg text-stone-600">
          Prefer a password?{" "}
          <Link href="/login" className="font-bold text-brand-700 hover:underline">
            Log in
          </Link>
        </p>
      </Card>
    </div>
  );
}