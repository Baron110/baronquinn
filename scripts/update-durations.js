// Applies the delivery-duration corrections in one run.
// Usage:
//   set "MONGODB_URI=..."
//   node scripts/update-durations.js

const mongoose = require("mongoose");

// Every product with isCustomized:true gets this compound duration —
// covers the "7-14 days, except 1-2 days to USA" rule for anything custom,
// including the phone case.
const CUSTOM_DURATION = "7-14 days (1-2 days to USA)";

const UPDATES = [
  { slug: "leather-handbag", duration: "1-3 days" },
  { slug: "female-necklace", duration: "1-3 days" },
  { slug: "female-ring", duration: "1-3 days" },
  { slug: "female-ring-2", duration: "7-14 days" },
  { slug: "birthday-cake", duration: "Same day (30 minutes)" }
];

async function main() {
  const uri = process.env.MONGODB_URI;
  if (!uri) throw new Error("Set MONGODB_URI in the environment before running this.");

  await mongoose.connect(uri);

  const ProductSchema = new mongoose.Schema({
    name: String, slug: String, description: String, price: Number, compareAt: Number,
    category: { type: mongoose.Schema.Types.ObjectId, ref: "Category" },
    images: [String], duration: String, isCustomized: Boolean, badge: String,
    active: { type: Boolean, default: true }, createdAt: { type: Date, default: Date.now }
  });
  const Product = mongoose.models.Product || mongoose.model("Product", ProductSchema);

  for (const u of UPDATES) {
    const result = await Product.findOneAndUpdate({ slug: u.slug }, { duration: u.duration });
    console.log(result ? `Updated ${u.slug} -> "${u.duration}"` : `No product found for slug "${u.slug}"`);
  }

  const customResult = await Product.updateMany({ isCustomized: true }, { duration: CUSTOM_DURATION });
  console.log(`Set "${CUSTOM_DURATION}" on ${customResult.modifiedCount} customized product(s).`);

  console.log("Done.");
  await mongoose.disconnect();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
