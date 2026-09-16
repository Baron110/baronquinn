export type Product = {
  slug: string;
  name: string;
  price: number;
  compareAt?: number;
  category: string;
  delivery: string;
  badge?: string;
  image: string;
  description: string;
};

export type Category = {
  slug: string;
  label: string;
  blurb: string;
};

export const categories: Category[] = [
  { slug: "same-day", label: "Same day", blurb: "Ordered before 2pm, there by evening." },
  { slug: "flowers", label: "Flowers, 1-2 days", blurb: "Fresh and preserved arrangements." },
  { slug: "customized", label: "Customized items", blurb: "Add a name, a photo, a message." },
  { slug: "mens", label: "Gifts for men", blurb: "Watches, rings, and everyday carry." },
  { slug: "womens", label: "Gifts for women", blurb: "Rings, necklaces, bracelets." },
  { slug: "cards", label: "Cards and documents", blurb: "Notes and custom printed pieces." }
];

export const products: Product[] = [
  {
    slug: "pizza-and-coke",
    name: "Pizza and coke",
    price: 35000,
    category: "same-day",
    delivery: "Same day",
    image: "https://images.unsplash.com/photo-1513104890138-7c749659a591?w=800",
    description: "A fresh pizza and two ice-cold Cokes, delivered the same day. A simple way to say you're thinking of someone."
  },
  {
    slug: "birthday-cake",
    name: "Birthday cake",
    price: 60000,
    category: "same-day",
    delivery: "Same day",
    image: "https://images.unsplash.com/photo-1602351447937-745cb720612f?w=800",
    description: "A red velvet layer cake, baked fresh and delivered same day. Serves 8-10."
  },
  {
    slug: "fresh-cut-flowers",
    name: "Fresh cut flowers",
    price: 60000,
    category: "same-day",
    delivery: "Same day",
    image: "https://images.unsplash.com/photo-1490750967868-88aa4486c946?w=800",
    description: "A hand-tied bouquet of seasonal fresh-cut flowers, arranged and delivered the same day."
  },
  {
    slug: "glass-flower",
    name: "Glass flower",
    price: 40000,
    compareAt: 48000,
    category: "flowers",
    delivery: "1-2 days",
    badge: "Popular",
    image: "https://images.unsplash.com/photo-1518895949257-7621c3c786d7?w=800",
    description: "A preserved rose under glass, lit from within. Lasts a year or more with no watering."
  },
  {
    slug: "glass-flower-duo",
    name: "Glass flower, two-stem",
    price: 60000,
    category: "flowers",
    delivery: "1-2 days",
    image: "https://images.unsplash.com/photo-1487070183336-b863922373d4?w=800",
    description: "Two preserved roses in a single glass dome, arranged with trailing fairy lights."
  },
  {
    slug: "artificial-rose",
    name: "Artificial rose bouquet",
    price: 35000,
    category: "flowers",
    delivery: "1-2 days",
    image: "https://images.unsplash.com/photo-1523694576729-d0edd8ff37e6?w=800",
    description: "A wrapped bouquet of artificial roses, finished with satin ribbon. Never wilts."
  },
  {
    slug: "custom-frame-light",
    name: "Custom frame with light",
    price: 70000,
    category: "customized",
    delivery: "3-5 days",
    badge: "Custom",
    image: "https://images.unsplash.com/photo-1541961017774-22349e4a1262?w=800",
    description: "An acrylic frame with your photo and a song of your choice, lit from a wooden base."
  },
  {
    slug: "custom-collage-frame",
    name: "Custom collage frame",
    price: 65000,
    category: "customized",
    delivery: "3-5 days",
    badge: "Custom",
    image: "https://images.unsplash.com/photo-1516035069371-29a1b244cc32?w=800",
    description: "A black frame holding a photo collage, printed and assembled to order."
  },
  {
    slug: "custom-mug",
    name: "Custom mug",
    price: 60000,
    category: "customized",
    delivery: "3-5 days",
    badge: "Custom",
    image: "https://images.unsplash.com/photo-1514228742587-6b1558fcca3d?w=800",
    description: "A ceramic mug printed with your own text or photo."
  },
  {
    slug: "mens-watch",
    name: "Men's watch",
    price: 60000,
    category: "mens",
    delivery: "1-2 days",
    image: "https://images.unsplash.com/photo-1524805444758-089113d48a6d?w=800",
    description: "A two-tone steel watch with a navy dial. Comes boxed, ready to gift."
  },
  {
    slug: "male-ring",
    name: "Men's ring",
    price: 50000,
    category: "mens",
    delivery: "1-2 days",
    badge: "Fast",
    image: "https://images.unsplash.com/photo-1605100804763-247f67b3557e?w=800",
    description: "A brushed silver band, understated and built to be worn daily."
  },
  {
    slug: "female-ring",
    name: "Halo ring",
    price: 50000,
    category: "womens",
    delivery: "1-2 days",
    badge: "Fast",
    image: "https://images.unsplash.com/photo-1605100804763-247f67b3557e?w=800",
    description: "A cushion-cut stone set in a silver halo band."
  },
  {
    slug: "female-necklace",
    name: "Infinity necklace",
    price: 50000,
    category: "womens",
    delivery: "1-2 days",
    badge: "Fast",
    image: "https://images.unsplash.com/photo-1599643478518-a784e5dc4c8f?w=800",
    description: "A fine gold chain with an infinity pendant."
  },
  {
    slug: "female-bracelet",
    name: "Bangle bracelet",
    price: 50000,
    category: "womens",
    delivery: "1-2 days",
    badge: "Fast",
    image: "https://images.unsplash.com/photo-1611591437281-460bfbe1220a?w=800",
    description: "A gold bangle set with a single row of stones."
  },
  {
    slug: "love-card",
    name: "Love card",
    price: 30000,
    category: "cards",
    delivery: "Same day",
    image: "https://images.unsplash.com/photo-1520903920243-8d9b8752f0eb?w=800",
    description: "A hand-illustrated greeting card, blank inside for your own message."
  },
  {
    slug: "custom-document",
    name: "Custom printed document",
    price: 90000,
    category: "cards",
    delivery: "3-5 days",
    badge: "Custom",
    image: "https://images.unsplash.com/photo-1568667256549-094345857637?w=800",
    description: "A certificate, letter, or keepsake document, professionally typeset and printed."
  }
];

export function getProduct(slug: string) {
  return products.find((p) => p.slug === slug);
}

export function getRelated(slug: string, category: string, count = 3) {
  return products.filter((p) => p.slug !== slug && p.category === category).slice(0, count);
}

export function formatNaira(amount: number) {
  return "\u20A6" + amount.toLocaleString("en-NG");
}
