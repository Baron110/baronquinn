// Second batch — uploads to Cloudinary and creates these products.
// Usage:
//   set "MONGODB_URI=..."
//   node scripts/import-products-batch2.js photos

const fs = require("fs");
const path = require("path");
const mongoose = require("mongoose");

const CLOUD_NAME = "dplfthmnt";
const UPLOAD_PRESET = "baronquinn_products";

const CREATES = [
  { file: "IMG_4373.PNG", name: "Gold bangle (Tree of Life)", slug: "gold-bangle-tree-of-life", description: "A gold-tone bangle with a Tree of Life design.", price: 40000, category: "womens", duration: "1-3 days" },
  { file: "IMG_4374.PNG", name: "Silver heart bracelet", slug: "silver-heart-bracelet", description: "A silver bracelet with a heart charm.", price: 40000, category: "womens", duration: "1-3 days" },
  { file: "IMG_4375.PNG", name: "\"I Love You\" glass block", slug: "i-love-you-glass-block", description: "An engraved glass block with a lit base.", price: 35000, category: "flowers", duration: "1-2 days" },
  { file: "IMG_4376.PNG", name: "Rose bear & necklace box", slug: "rose-bear-necklace-box", description: "A rose-petal teddy bear paired with a necklace, presented in a gift box.", price: 80000, category: "flowers", duration: "1-2 days", badge: "Popular" },
  { file: "IMG_4377.PNG", name: "Lace bra set", slug: "lace-bra-set", description: "A lace bra, available in pink, purple, blue, or black.", price: 45000, category: "womens", duration: "1-3 days" },
  { file: "IMG_4378.PNG", name: "Men's silver ring", slug: "mens-silver-ring", description: "A polished silver band ring.", price: 50000, category: "mens", duration: "1-3 days" },
  { file: "IMG_4379.PNG", name: "Wall photo frame", slug: "wall-photo-frame", description: "A personalized wall-mounted photo frame with your own picture.", price: 60000, category: "customized", duration: "7-14 days (1-2 days to USA)", isCustomized: true, badge: "Custom" },
  { file: "IMG_4380.PNG", name: "Grey checkered handbag", slug: "grey-checkered-handbag", description: "A grey checkered handbag with a bear charm.", price: 60000, category: "womens", duration: "1-3 days" },
  { file: "IMG_4381.PNG", name: "Beige monogram handbag", slug: "beige-monogram-handbag", description: "A beige monogram handbag with a charm accent.", price: 60000, category: "womens", duration: "1-3 days" },
  { file: "IMG_4383.PNG", name: "Leather wallet", slug: "leather-wallet", description: "An original leather wallet for men.", price: 45000, category: "mens", duration: "1-3 days" },
  { file: "IMG_4384.PNG", name: "Watch & jewelry gift set", slug: "watch-jewelry-gift-set", description: "A classy women's gift set with a watch and matching jewelry.", price: 70000, category: "womens", duration: "1-3 days" },
  { file: "IMG_4385.PNG", name: "Big teddy bear", slug: "big-teddy-bear", description: "A large pink teddy bear.", price: 120000, category: "same-day", duration: "Same day" },
  { file: "IMG_4386.PNG", name: "Men's gift combo", slug: "mens-gift-combo", description: "A gift set with a mug, notebook, pen, and bag.", price: 80000, category: "mens", duration: "1-2 days" },
  { file: "IMG_4387.PNG", name: "Perfume collection", slug: "perfume-collection", description: "A collection of original perfumes.", price: 50000, category: "womens", duration: "1-2 days" },
  { file: "IMG_4405.PNG", name: "Fruit basket", slug: "fruit-basket", description: "A gift basket of fresh fruit.", price: 150000, category: "same-day", duration: "Same day" },
  { file: "IMG_4407.PNG", name: "3D crystal ball", slug: "3d-crystal-ball", description: "A laser-etched 3D photo inside a crystal ball, personalized with your own image.", price: 50000, category: "customized", duration: "7-14 days (1-2 days to USA)", isCustomized: true, badge: "Custom" }
];

async function uploadToCloudinary(filePath) {
  const buffer = fs.readFileSync(filePath);
  const blob = new Blob([buffer]);
  const form = new FormData();
  form.append("file", blob, path.basename(filePath));
  form.append("upload_preset", UPLOAD_PRESET);

  const res = await fetch(`https://api.cloudinary.com/v1_1/${CLOUD_NAME}/image/upload`, {
    method: "POST",
    body: form
  });
  const data = await res.json();
  if (!data.secure_url) throw new Error(`Cloudinary upload failed: ${JSON.stringify(data)}`);
  return data.secure_url;
}

async function main() {
  const uri = process.env.MONGODB_URI;
  if (!uri) throw new Error("Set MONGODB_URI in the environment before running this.");

  const folder = process.argv[2] || "./photos";
  if (!fs.existsSync(folder)) throw new Error(`Folder not found: ${folder}`);

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

  const categories = await Category.find();
  const categoryIds = Object.fromEntries(categories.map((c) => [c.slug, c._id]));

  for (const c of CREATES) {
    const filePath = path.join(folder, c.file);
    if (!fs.existsSync(filePath)) {
      console.warn(`Skipping ${c.file} — not found in ${folder}`);
      continue;
    }
    const categoryId = categoryIds[c.category];
    if (!categoryId) {
      console.warn(`Skipping ${c.name} — category "${c.category}" not found.`);
      continue;
    }
    try {
      const url = await uploadToCloudinary(filePath);
      await Product.findOneAndUpdate(
        { slug: c.slug },
        {
          name: c.name,
          slug: c.slug,
          description: c.description,
          price: c.price,
          category: categoryId,
          images: [url],
          duration: c.duration,
          isCustomized: !!c.isCustomized,
          badge: c.badge,
          active: true
        },
        { upsert: true }
      );
      console.log(`Created/updated ${c.name}`);
    } catch (err) {
      console.error(`Failed on ${c.file}:`, err.message);
    }
  }

  console.log("Done.");
  await mongoose.disconnect();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
