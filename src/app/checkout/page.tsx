import { redirect } from "next/navigation";
import { CheckoutForm } from "@/components/cart/CheckoutForm";
import { ProgressSteps } from "@/components/ui/ProgressSteps";
import { Alert } from "@/components/ui/Alert";
import { getCurrentUser } from "@/lib/auth";

export const dynamic = "force-dynamic";
export const metadata = { title: "Checkout" };

export default async function CheckoutPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const user = await getCurrentUser();
  if (!user) redirect("/login?next=/checkout");
  const { error } = await searchParams;

  return (
    <div className="mx-auto max-w-5xl px-4 py-8">
      <h1 className="mb-4 text-3xl font-extrabold">Checkout</h1>
      <ProgressSteps steps={["Cart", "Details", "Payment", "Done"]} current={2} />
      <Alert type="error" message={error} />
      <CheckoutForm />
    </div>
  );
}