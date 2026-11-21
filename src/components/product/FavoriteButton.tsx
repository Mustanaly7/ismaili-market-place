import { Heart } from "lucide-react";
import { toggleFavoriteAction } from "@/server/actions/shop";
import { Button } from "@/components/ui/Button";

export function FavoriteButton({
  productId,
  isFavorited,
  next,
}: {
  productId: string;
  isFavorited: boolean;
  next: string;
}) {
  return (
    <form action={toggleFavoriteAction}>
      <input type="hidden" name="productId" value={productId} />
      <input type="hidden" name="next" value={next} />
      <Button type="submit" variant="outline">
        <Heart
          aria-hidden
          className={isFavorited ? "h-5 w-5 fill-accent-500 text-accent-500" : "h-5 w-5"}
        />
        {isFavorited ? "Saved" : "Save"}
      </Button>
    </form>
  );
}