import Link from "next/link";
import { redirect } from "next/navigation";
import { ShoppingBag, Store } from "lucide-react";
import { Card } from "@/components/ui/Card";
import { Alert } from "@/components/ui/Alert";
import { Field, Input } from "@/components/ui/Field";
import { Button } from "@/components/ui/Button";
import { getCurrentUser } from "@/lib/auth";
import { signupAction } from "@/server/actions/auth";
import { AuthOptions } from "@/components/auth/AuthOptions";

export const dynamic = "force-dynamic";
export const metadata = { title: "Sign up" };

export default async function SignupPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; role?: string }>;
}) {
  const user = await getCurrentUser();
  if (user) redirect("/account");
  const sp = await searchParams;
  const role = sp.role === "seller" ? "seller" : "buyer";

  return (
    <div className="mx-auto flex max-w-md flex-col px-4 py-12">
      <Card>
        <h1 className="text-3xl font-extrabold">Create your account</h1>
        <p className="mt-1 text-lg text-stone-600">One short step. No long forms.</p>
        <div className="mt-5">
          <Alert type="error" message={sp.error} />
        </div>
        <form action={signupAction} className="flex flex-col gap-4">
          <fieldset>
            <legend className="mb-2 text-lg font-semibold text-stone-800">I want to…</legend>
            <div className="grid grid-cols-2 gap-2">
              <label
                className={`flex cursor-pointer flex-col items-center gap-1 rounded-xl border-2 p-3 text-center ${
                  role === "buyer" ? "border-brand-600 bg-brand-50" : "border-stone-200"
                }`}
              >
                <input type="radio" name="role" value="buyer" defaultChecked={role === "buyer"} className="sr-only" />
                <ShoppingBag aria-hidden className="h-6 w-6 text-brand-700" />
                <span className="text-base font-bold">Buy things</span>
              </label>
              <label
                className={`flex cursor-pointer flex-col items-center gap-1 rounded-xl border-2 p-3 text-center ${
                  role === "seller" ? "border-brand-600 bg-brand-50" : "border-stone-200"
                }`}
              >
                <input type="radio" name="role" value="seller" defaultChecked={role === "seller"} className="sr-only" />
                <Store aria-hidden className="h-6 w-6 text-brand-700" />
                <span className="text-base font-bold">Sell things</span>
              </label>
            </div>
          </fieldset>
          <Field label="Your name (optional)" htmlFor="name">
            <Input id="name" name="name" autoComplete="name" />
          </Field>
          <Field label="Email or phone number" htmlFor="identifier" required>
            <Input id="identifier" name="identifier" autoComplete="username" required />
          </Field>
          <Field label="Password" htmlFor="password" required hint="At least 6 characters. That is all we ask.">
            <Input id="password" name="password" type="password" autoComplete="new-password" required minLength={6} />
          </Field>
          <Button type="submit" size="lg" fullWidth>
            Create account
          </Button>
        </form>
        <AuthOptions mode="signup" />
        <p className="mt-5 text-center text-lg text-stone-600">
          Already have an account?{" "}
          <Link href="/login" className="font-bold text-brand-700 hover:underline">
            Log in
          </Link>
        </p>
      </Card>
    </div>
  );
}