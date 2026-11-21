"use client";

import { useState } from "react";
import { ArrowLeft, ArrowRight, Check } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Field, Input, Select, Textarea } from "@/components/ui/Field";
import { ProgressSteps } from "@/components/ui/ProgressSteps";
import { ImageUploader } from "@/components/forms/ImageUploader";

const STEPS = ["Your shop", "Where you are", "Photos", "Payment"];

export function OnboardingWizard({
  action,
  categories,
}: {
  action: (formData: FormData) => void | Promise<void>;
  categories: string[];
}) {
  const [step, setStep] = useState(1);
  const isLast = step === STEPS.length;

  return (
    <form action={action} className="mx-auto max-w-2xl">
      <ProgressSteps steps={STEPS} current={step} />

      {/* Step 1 */}
      <fieldset className="flex flex-col gap-4" hidden={step !== 1}>
        <legend className="sr-only">Your shop</legend>
        <Field label="What is your business called?" htmlFor="name" required hint="This is the name buyers will see.">
          <Input id="name" name="name" required placeholder="e.g. Amina's Kitchen" autoComplete="organization" />
        </Field>
        <Field label="What do you sell?" htmlFor="category" required>
          <Select id="category" name="category" required defaultValue="">
            <option value="" disabled>
              Choose one
            </option>
            {categories.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </Select>
        </Field>
        <Field label="Tell buyers about your shop (optional)" htmlFor="description" hint="A sentence or two is plenty.">
          <Textarea id="description" name="description" placeholder="We make fresh bread every morning…" />
        </Field>
      </fieldset>

      {/* Step 2 */}
      <fieldset className="flex flex-col gap-4" hidden={step !== 2}>
        <legend className="sr-only">Where you are and how to reach you</legend>
        <Field label="Where are you located? (optional)" htmlFor="location">
          <Input id="location" name="location" placeholder="e.g. Karachi, Block 7" />
        </Field>
        <Field label="Opening hours (optional)" htmlFor="businessHours">
          <Input id="businessHours" name="businessHours" placeholder="e.g. Mon–Sat, 9am–6pm" />
        </Field>
        <Field label="How should buyers contact you?" htmlFor="contactMethod" required>
          <Select id="contactMethod" name="contactMethod" defaultValue="message">
            <option value="message">Through the website messages</option>
            <option value="phone">By phone call</option>
            <option value="email">By email</option>
          </Select>
        </Field>
        <Field label="Phone number (optional)" htmlFor="contactPhone">
          <Input id="contactPhone" name="contactPhone" inputMode="tel" placeholder="+92 300 1234567" />
        </Field>
        <Field label="Email (optional)" htmlFor="contactEmail">
          <Input id="contactEmail" name="contactEmail" type="email" placeholder="shop@example.com" />
        </Field>
      </fieldset>

      {/* Step 3 */}
      <fieldset className="flex flex-col gap-6" hidden={step !== 3}>
        <legend className="sr-only">Photos</legend>
        <div>
          <p className="mb-2 text-lg font-semibold text-stone-800">Shop logo (optional)</p>
          <p className="mb-2 text-base text-stone-500">A clear square picture works best.</p>
          <ImageUploader name="logoUrl" buttonLabel="Add logo" />
        </div>
        <div>
          <p className="mb-2 text-lg font-semibold text-stone-800">Cover photo (optional)</p>
          <p className="mb-2 text-base text-stone-500">A wide photo of your shop or products.</p>
          <ImageUploader name="coverUrl" buttonLabel="Add cover" />
        </div>
      </fieldset>

      {/* Step 4 */}
      <fieldset className="flex flex-col gap-4" hidden={step !== 4}>
        <legend className="sr-only">Payment</legend>
        <p className="text-lg font-semibold text-stone-800">How do you want to get paid?</p>
        <label className="flex cursor-pointer items-start gap-3 rounded-xl border-2 border-stone-300 p-4 has-[:checked]:border-brand-500 has-[:checked]:bg-brand-50">
          <input type="radio" name="paymentMode" value="online" defaultChecked className="mt-1 h-5 w-5" />
          <span>
            <span className="block text-lg font-semibold text-stone-900">Accept online payments</span>
            <span className="block text-base text-stone-600">Buyers pay on the website. Simplest for you.</span>
          </span>
        </label>
        <label className="flex cursor-pointer items-start gap-3 rounded-xl border-2 border-stone-300 p-4 has-[:checked]:border-brand-500 has-[:checked]:bg-brand-50">
          <input type="radio" name="paymentMode" value="contact" className="mt-1 h-5 w-5" />
          <span>
            <span className="block text-lg font-semibold text-stone-900">Arrange payment directly</span>
            <span className="block text-base text-stone-600">Buyers contact you and you agree how to pay.</span>
          </span>
        </label>
        <p className="rounded-xl bg-stone-100 p-4 text-base text-stone-600">
          You can change all of this later in Settings. Nothing is final.
        </p>
      </fieldset>

      <div className="mt-8 flex items-center justify-between gap-3">
        <Button
          type="button"
          variant="outline"
          onClick={() => setStep((s) => Math.max(1, s - 1))}
          disabled={step === 1}
        >
          <ArrowLeft aria-hidden className="h-5 w-5" />
          Back
        </Button>

        {isLast ? (
          <Button type="submit" variant="primary">
            <Check aria-hidden className="h-5 w-5" />
            Finish and open my shop
          </Button>
        ) : (
          <Button type="button" onClick={() => setStep((s) => Math.min(STEPS.length, s + 1))}>
            Continue
            <ArrowRight aria-hidden className="h-5 w-5" />
          </Button>
        )}
      </div>
    </form>
  );
}