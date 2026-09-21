"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useCart } from "@/lib/cart-context";
import { ProductDTO } from "@/lib/types";

export default function AddToCartButton({ product }: { product: ProductDTO }) {
  const { addItem } = useCart();
  const router = useRouter();
  const [added, setAdded] = useState(false);

  function cartItem() {
    return {
      slug: product.slug,
      name: product.name,
      price: product.price,
      image: product.images?.[0]
    };
  }

  function handleAddToCart() {
    addItem(cartItem());
    setAdded(true);
    setTimeout(() => setAdded(false), 1500);
  }

  function handleBuyNow() {
    addItem(cartItem());
    router.push("/cart");
  }

  return (
    <div className="flex gap-3 mt-8">
      <button
        type="button"
        onClick={handleAddToCart}
        className="flex-1 border border-ink py-4 text-sm hover:bg-ink hover:text-paper transition-colors"
      >
        {added ? "Added ✓" : "Add to cart"}
      </button>
      <button
        type="button"
        onClick={handleBuyNow}
        className="flex-1 bg-ink text-paper py-4 text-sm hover:opacity-90 transition-opacity"
      >
        Buy now
      </button>
    </div>
  );
}
