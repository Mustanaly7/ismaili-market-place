import { MessageCircle } from "lucide-react";
import { startThreadAction } from "@/server/actions/shop";
import { Textarea } from "@/components/ui/Field";
import { Button } from "@/components/ui/Button";

export function ContactSellerForm({
  businessId,
  productId,
  next,
  sellerName,
}: {
  businessId: string;
  productId?: string;
  next: string;
  sellerName: string;
}) {
  return (
    <form action={startThreadAction} className="flex flex-col gap-3" id="contact">
      <input type="hidden" name="businessId" value={businessId} />
      {productId ? <input type="hidden" name="productId" value={productId} /> : null}
      <input type="hidden" name="next" value={next} />
      <input type="hidden" name="subject" value={`Message to ${sellerName}`} />
      <label htmlFor="contact-message" className="text-lg font-semibold text-stone-800">
        Send a message to {sellerName}
      </label>
      <Textarea
        id="contact-message"
        name="message"
        required
        placeholder="Hi! I'd like to ask about this item…"
        className="min-h-[110px]"
      />
      <Button type="submit" variant="outline" size="lg">
        <MessageCircle aria-hidden className="h-5 w-5" />
        Send message
      </Button>
    </form>
  );
}