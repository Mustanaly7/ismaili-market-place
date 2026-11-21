import Link from "next/link";
import { redirect } from "next/navigation";
import { Card } from "@/components/ui/Card";
import { Alert } from "@/components/ui/Alert";
import { Field, Input } from "@/components/ui/Field";
import { Button } from "@/components/ui/Button";
import { getCurrentUser } from "@/lib/auth";
import { loginAction } from "@/server/actions/auth";
import { AuthOptions } from "@/components/auth/AuthOptions";

export const dynamic = "force-dynamic";
export const metadata = { title: "Log in" };

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; ok?: string; next?: string }>;
}) {
  const user = await getCurrentUser();
  if (user) redirect("/account");
  const sp = await searchParams;

  return (
    <div className="mx-auto flex max-w-md flex-col px-4 py-12">
      <Card>
        <h1 className="text-3xl font-extrabold">Welcome back</h1>
        <p className="mt-1 text-lg text-stone-600">Log in to see your orders and messages.</p>
        <div className="mt-5">
          <Alert type="error" message={sp.error} />
          <Alert type="success" message={sp.ok} />
        </div>
        <form action={loginAction} className="flex flex-col gap-4">
          <input type="hidden" name="next" value={sp.next ?? ""} />
          <Field label="Email or phone" htmlFor="identifier" required>
            <Input id="identifier" name="identifier" autoComplete="username" required />
          </Field>
          <Field label="Password" htmlFor="password" required>
            <Input id="password" name="password" type="password" autoComplete="current-password" required />
          </Field>
          <Button type="submit" size="lg" fullWidth>
            Log in
          </Button>
        </form>
        <AuthOptions mode="login" />
        <p className="mt-5 text-center text-lg text-stone-600">
          New here?{" "}
          <Link href="/signup" className="font-bold text-brand-700 hover:underline">
            Create an account
          </Link>
        </p>
      </Card>
      <p className="mt-4 text-center text-sm text-stone-400">
        Demo accounts are created by the database seed script (see README).
      </p>
    </div>
  );
}