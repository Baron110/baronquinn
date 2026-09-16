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
  { slug: "pizza-and-coke", name: "Pizza and coke", price: 35000, category: "same-day", duration: "Same day", images: ["https://images.unsplash.com/photo-1513104890138-7c749659a591?w=800"], description: "A fresh pizza and two ice-cold Cokes, delivered the same day." },
  { slug: "birthday-cake", name: "Birthday cake", price: 60000, category: "same-day", duration: "Same day", images: ["https://images.unsplash.com/photo-1602351447937-745cb720612f?w=800"], description: "A red velvet layer cake, baked fresh and delivered same day. Serves 8-10." },
  { slug: "fresh-cut-flowers", name: "Fresh cut flowers", price: 60000, category: "same-day", duration: "Same day", images: ["https://images.unsplash.com/photo-1490750967868-88aa4486c946?w=800"], description: "A hand-tied bouquet of seasonal fresh-cut flowers." },
  { slug: "glass-flower", name: "Glass flower", price: 40000, compareAt: 48000, category: "flowers", duration: "1-2 days", badge: "Popular", images: ["https://images.unsplash.com/photo-1518895949257-7621c3c786d7?w=800"], description: "A preserved rose under glass, lit from within." },
  { slug: "custom-frame-light", name: "Custom frame with light", price: 70000, category: "customized", duration: "3-5 days", badge: "Custom", isCustomized: true, images: ["https://images.unsplash.com/photo-1541961017774-22349e4a1262?w=800"], description: "An acrylic frame with your photo and a song of your choice." },
  { slug: "custom-mug", name: "Custom mug", price: 60000, category: "customized", duration: "3-5 days", badge: "Custom", isCustomized: true, images: ["https://images.unsplash.com/photo-1514228742587-6b1558fcca3d?w=800"], description: "A ceramic mug printed with your own text or photo." },
  { slug: "mens-watch", name: "Men's watch", price: 60000, category: "mens", duration: "1-2 days", images: ["https://images.unsplash.com/photo-1524805444758-089113d48a6d?w=800"], description: "A two-tone steel watch with a navy dial." },
  { slug: "female-ring", name: "Halo ring", price: 50000, category: "womens", duration: "1-2 days", badge: "Fast", images: ["https://images.unsplash.com/photo-1605100804763-247f67b3557e?w=800"], description: "A cushion-cut stone set in a silver halo band." },
  { slug: "love-card", name: "Love card", price: 30000, category: "cards", duration: "Same day", images: ["https://images.unsplash.com/photo-1520903920243-8d9b8752f0eb?w=800"], description: "A hand-illustrated greeting card, blank inside." }
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
