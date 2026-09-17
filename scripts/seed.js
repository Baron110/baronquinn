// Run with: MONGODB_URI="..." node scripts/seed.js
// Safe to re-run — uses upsert on slug, so it won't create duplicates.
const mongoose = require("mongoose");

const categories = [
  { slug: "same-day", label: "Same day", blurb: "Ordered before 2pm, there by evening." },
  { slug: "flowers", label: "Flowers, 1-2 days", blurb: "Fresh and preserved arrangements." },
  { slug: "customized", label: "Customized items", blurb: "Add a name, a photo, a message." },
  { slug: "mens", label: "Gifts for men", blurb: "Watches, rings, and everyday carry." },
  { slug: "womens", label: "Gifts for women", blurb: "Rings, necklaces, bracelets." },
  { slug: "cards", label: "Cards and documents", blurb: "Notes and custom printed pieces." }
];

const products = [
  // Same day
  { slug: "pizza-and-coke", name: "Pizza and coke", price: 35000, category: "same-day", duration: "Same day", images: ["https://images.unsplash.com/photo-1513104890138-7c749659a591?w=800"], description: "A fresh pizza and two ice-cold Cokes, delivered the same day." },
  { slug: "birthday-cake", name: "Birthday cake", price: 60000, category: "same-day", duration: "Same day", images: ["https://images.unsplash.com/photo-1602351447937-745cb720612f?w=800"], description: "A red velvet layer cake, baked fresh and delivered same day. Serves 8-10." },
  { slug: "fresh-cut-flower-usa-canada", name: "Fresh cut flower (USA/Canada)", price: 60000, category: "same-day", duration: "Same day", images: ["https://images.unsplash.com/photo-1490750967868-88aa4486c946?w=800"], description: "A hand-tied bouquet of seasonal fresh-cut flowers, delivered same day." },
  { slug: "fresh-high-quality-natural-flower", name: "Fresh high quality natural flower", price: 55000, category: "same-day", duration: "Same day", images: ["https://images.unsplash.com/photo-1509587584298-0f3b3a3a1797?w=800"], description: "A premium arrangement of fresh natural flowers. (Price not visible in reference — confirm and adjust.)" },
  { slug: "fresh-cut-flower-chocolate", name: "Fresh cut flower + chocolate", price: 55000, category: "same-day", duration: "Same day", images: ["https://images.unsplash.com/photo-1549465220-1a8b9238cd48?w=800"], description: "Fresh-cut flowers paired with a box of chocolates. (Price not visible in reference — confirm and adjust.)" },

  // Flowers 1-2 days
  { slug: "artificial-rose", name: "Artificial small rose flower", price: 35000, category: "flowers", duration: "1-2 days", images: ["https://images.unsplash.com/photo-1523694576729-d0edd8ff37e6?w=800"], description: "A wrapped bouquet of artificial roses, finished with satin ribbon. Never wilts." },
  { slug: "glass-flower", name: "Glass flower", price: 40000, category: "flowers", duration: "1-2 days", badge: "Popular", images: ["https://images.unsplash.com/photo-1518895949257-7621c3c786d7?w=800"], description: "A preserved rose under glass, lit from within." },
  { slug: "glass-flower-2", name: "Glass flower 2", price: 60000, category: "flowers", duration: "1-2 days", images: ["https://images.unsplash.com/photo-1487070183336-b863922373d4?w=800"], description: "A preserved rose beneath a glass dome on a wooden base, with fairy lights." },
  { slug: "glass-flower-3", name: "Glass flower 3", price: 40000, category: "flowers", duration: "1-2 days", images: ["https://images.unsplash.com/photo-1487530811176-3780de880c2d?w=800"], description: "A single preserved rose in a glass dome, gift-boxed." },

  // Customized items
  { slug: "custom-frame-light", name: "Custom frame with light", price: 70000, category: "customized", duration: "3-5 days", badge: "Custom", isCustomized: true, images: ["https://images.unsplash.com/photo-1541961017774-22349e4a1262?w=800"], description: "An acrylic frame with your photo and a song of your choice, lit from a wooden base." },
  { slug: "custom-frame", name: "Custom frame", price: 65000, category: "customized", duration: "3-5 days", badge: "Custom", isCustomized: true, images: ["https://images.unsplash.com/photo-1516035069371-29a1b244cc32?w=800"], description: "A black photo-collage frame, printed and assembled to order." },
  { slug: "custom-face-cap", name: "Custom face cap", price: 50000, category: "customized", duration: "3-5 days", badge: "Custom", isCustomized: true, images: ["https://images.unsplash.com/photo-1521369909029-2afed882baee?w=800"], description: "A cap printed with your own design, logo, or text." },
  { slug: "custom-mug", name: "Custom mug", price: 60000, category: "customized", duration: "3-5 days", badge: "Custom", isCustomized: true, images: ["https://images.unsplash.com/photo-1514228742587-6b1558fcca3d?w=800"], description: "A ceramic mug printed with your own text or photo." },

  // Gifts for men
  { slug: "mens-watch", name: "Men's watch", price: 60000, category: "mens", duration: "1-2 days", images: ["https://images.unsplash.com/photo-1524805444758-089113d48a6d?w=800"], description: "A two-tone steel watch with a navy dial. Comes boxed, ready to gift." },
  { slug: "male-ring", name: "Male ring", price: 50000, category: "mens", duration: "1-2 days", badge: "Fast", images: ["https://images.unsplash.com/photo-1605100804763-247f67b3557e?w=800"], description: "A brushed silver band, understated and built to be worn daily." },

  // Gifts for women
  { slug: "female-ring", name: "Female ring", price: 50000, category: "womens", duration: "1-2 days", badge: "Fast", images: ["https://images.unsplash.com/photo-1605100804763-247f67b3557e?w=800"], description: "A cushion-cut stone set in a silver halo band." },
  { slug: "female-ring-2", name: "Female ring 2", price: 40000, category: "womens", duration: "1-2 days", badge: "Fast", images: ["https://images.unsplash.com/photo-1605100804763-247f67b3557e?w=800"], description: "A second halo-cut ring style, silver band." },
  { slug: "female-necklace", name: "Female necklace", price: 50000, category: "womens", duration: "1-2 days", badge: "Fast", images: ["https://images.unsplash.com/photo-1599643478518-a784e5dc4c8f?w=800"], description: "A fine gold chain with an infinity pendant." },
  { slug: "female-bracelet", name: "Female bracelet", price: 50000, category: "womens", duration: "1-2 days", badge: "Fast", images: ["https://images.unsplash.com/photo-1611591437281-460bfbe1220a?w=800"], description: "A gold bangle set with a single row of stones." },

  // Cards and documents
  { slug: "love-card", name: "Love card", price: 30000, category: "cards", duration: "Same day", images: ["https://images.unsplash.com/photo-1520903920243-8d9b8752f0eb?w=800"], description: "A hand-illustrated greeting card, blank inside for your own message." },
  { slug: "document", name: "Document", price: 90000, category: "cards", duration: "3-5 days", badge: "Custom", isCustomized: true, images: ["https://images.unsplash.com/photo-1568667256549-094345857637?w=800"], description: "A certificate, letter, or keepsake document, professionally typeset and printed." }
];

async function main() {
  const uri = process.env.MONGODB_URI;
  if (!uri) throw new Error("Set MONGODB_URI in the environment before running this.");

  await mongoose.connect(uri);

  const CategorySchema = new mongoose.Schema({ slug: String, label: String, blurb: String, createdAt: { type: Date, default: Date.now } });
  const Category = mongoose.models.Category || mongoose.model("Category", CategorySchema);

  const ProductSchema = new mongoose.Schema({
    name: String, slug: String, description: String, price: Number, compareAt: Number,
    category: { type: mongoose.Schema.Types.ObjectId, ref: "Category" },
    images: [String], duration: String, isCustomized: Boolean, badge: String,
    active: { type: Boolean, default: true }, createdAt: { type: Date, default: Date.now }
  });
  const Product = mongoose.models.Product || mongoose.model("Product", ProductSchema);

  const categoryIds = {};
  for (const c of categories) {
    const doc = await Category.findOneAndUpdate({ slug: c.slug }, c, { upsert: true, new: true });
    categoryIds[c.slug] = doc._id;
    console.log(`Category: ${c.label}`);
  }

  for (const p of products) {
    const { category, ...rest } = p;
    await Product.findOneAndUpdate(
      { slug: p.slug },
      { ...rest, category: categoryIds[category] },
      { upsert: true, new: true }
    );
    console.log(`Product: ${p.name}`);
  }

  console.log("Seed complete.");
  await mongoose.disconnect();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});