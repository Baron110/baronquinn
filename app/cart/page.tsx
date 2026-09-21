"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { useCart } from "@/lib/cart-context";
import { formatNaira } from "@/lib/format";

export default function CartPage() {
  const { items, updateQuantity, removeItem, totalPrice } = useCart();
  const router = useRouter();

  if (items.length === 0) {
    return (
      <>
        <Header />
        <main className="max-w-content mx-auto px-5 py-20 text-center">
          <p className="text-ink/60">Your cart is empty.</p>
          <Link
            href="/"
            className="inline-block mt-6 border border-ink px-6 py-3 text-sm hover:bg-ink hover:text-paper transition-colors"
          >
            Browse gifts
          </Link>
        </main>
        <Footer />
      </>
    );
  }

  return (
    <>
      <Header />
      <main className="max-w-content mx-auto px-5 py-10">
        <h1 className="text-3xl mb-8">Your cart</h1>

        <div className="border border-line divide-y divide-line">
          {items.map((item) => (
            <div key={item.slug} className="p-4 flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4">
              <div className="flex items-center gap-4 min-w-0">
                <div className="w-16 h-16 bg-bone shrink-0 overflow-hidden">
                  {item.image && (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={item.image} alt="" className="w-full h-full object-cover" />
                  )}
                </div>

                <div className="min-w-0">
                  <Link href={`/product/${item.slug}`} className="text-sm hover:underline">
                    {item.name}
                  </Link>
                  <p className="text-xs text-ink/40 mt-0.5">{formatNaira(item.price)} each</p>
                </div>
              </div>

              <div className="flex items-center justify-between sm:justify-end gap-4 sm:gap-6 sm:flex-1">
                <div className="flex items-center gap-2 shrink-0">
                  <button
                    onClick={() => updateQuantity(item.slug, item.quantity - 1)}
                    aria-label="Decrease quantity"
                    className="w-7 h-7 border border-line hover:border-ink"
                  >
                    −
                  </button>
                  <span className="w-6 text-center text-sm">{item.quantity}</span>
                  <button
                    onClick={() => updateQuantity(item.slug, item.quantity + 1)}
                    aria-label="Increase quantity"
                    className="w-7 h-7 border border-line hover:border-ink"
                  >
                    +
                  </button>
                </div>

                <p className="text-sm w-20 text-right shrink-0">{formatNaira(item.price * item.quantity)}</p>

                <button onClick={() => removeItem(item.slug)} className="text-xs text-red-700 shrink-0">
                  Remove
                </button>
              </div>
            </div>
          ))}
        </div>

        <div className="flex justify-between items-center mt-6 pt-6 border-t border-line text-lg">
          <span>Total</span>
          <span>{formatNaira(totalPrice)}</span>
        </div>

        <div className="flex justify-end mt-6">
          <button
            onClick={() => router.push("/checkout")}
            className="bg-ink text-paper px-8 py-4 text-sm hover:opacity-90 transition-opacity"
          >
            Proceed to checkout
          </button>
        </div>
      </main>
      <Footer />
    </>
  );
}
