// Uploads a local folder of photos to Cloudinary, then updates existing
// products (replacing their placeholder photo) or creates new ones, in a
// single run.
//
// Usage:
//   set MONGODB_URI="..."
//   node scripts/import-photos.js "path/to/photos/folder"
//
// If you omit the folder path, it defaults to ./photos in the current directory.

const fs = require("fs");
const path = require("path");
const mongoose = require("mongoose");

const CLOUD_NAME = "dplfthmnt";
const UPLOAD_PRESET = "baronquinn_products";

const UPDATES = [
  { file: "IMG_3290.jpeg", slug: "male-ring", mode: "replace" },
  { file: "5fd0bf27-02c9-421f-924e-e612a6aea757.jpeg", slug: "female-ring", mode: "replace" },
  { file: "5d766fa1-b580-49fd-9a62-413ba07ffbe3.jpeg", slug: "mens-watch", mode: "replace" },
  { file: "50bbe18a-4b27-457c-93ab-158960d5ae40.jpeg", slug: "mens-watch", mode: "append" },
  { file: "31eff903-2eb2-4969-a501-c7cc910c11ec.jpeg", slug: "birthday-cake", mode: "replace" },
  { file: "IMG_3275.jpeg", slug: "document", mode: "replace" },
  { file: "5bb33da7-330b-4202-8c55-45de79224e94.jpeg", slug: "female-necklace", mode: "replace" },
  { file: "79231f3d-b5b3-428c-8aff-49c74dbd3397_1_.jpeg", slug: "glass-flower-2", mode: "replace" },
  { file: "IMG_6237.png", slug: "fresh-cut-flower-usa-canada", mode: "replace" }
];

const CREATES = [
  {
    file: "IMG_3248.jpeg",
    name: "Custom photo locket necklace",
    slug: "custom-photo-locket-necklace",
    description: "A spinning circular pendant with your own photo inside, on a rope chain. Available in gold or silver.",
    price: 55000,
    category: "customized",
    duration: "3-5 days",
    isCustomized: true,
    badge: "Custom"
  },
  {
    file: "IMG_3268.jpeg",
    name: "Custom VIP membership card",
    slug: "custom-vip-membership-card",
    description: "A printed VIP membership card with your own name and number.",
    price: 40000,
    category: "cards",
    duration: "3-5 days",
    isCustomized: true,
    badge: "Custom"
  },
  {
    file: "IMG_3303.jpeg",
    name: "Lace lingerie set",
    slug: "lace-lingerie-set",
    description: "A set of lace pieces in assorted colors.",
    price: 38000,
    category: "womens",
    duration: "1-2 days"
  },
  {
    file: "IMG_3313.jpeg",
    name: "Handwritten love letter",
    slug: "handwritten-love-letter",
    description: "A personal letter, handwritten in calligraphy with your own words.",
    price: 45000,
    category: "cards",
    duration: "3-5 days",
    isCustomized: true,
    badge: "Custom"
  },
  {
    file: "IMG_3284.jpeg",
    name: "Custom initial necklace",
    slug: "custom-initial-necklace",
    description: "A silver pendant engraved with a single initial of your choice.",
    price: 55000,
    category: "customized",
    duration: "3-5 days",
    isCustomized: true,
    badge: "Custom"
  },
  {
    file: "IMG_3272.jpeg",
    name: "Rose gift box",
    slug: "rose-gift-box",
    description: "A drawer-style gift box filled with rose petals. Available in black or grey.",
    price: 45000,
    category: "flowers",
    duration: "1-2 days"
  },
  {
    file: "IMG_3266.jpeg",
    name: "Watch travel roll",
    slug: "watch-travel-roll",
    description: "A leather travel case that holds up to 4 watches. Case only — watches shown for scale.",
    price: 60000,
    category: "mens",
    duration: "1-2 days"
  },
  {
    file: "IMG_3233.jpeg",
    name: "Custom photo phone case",
    slug: "custom-photo-phone-case",
    description: "A phone case printed with your own photo collage.",
    price: 45000,
    category: "customized",
    duration: "3-5 days",
    isCustomized: true,
    badge: "Custom"
  },
  {
    file: "IMG_3280.jpeg",
    name: "Rose bouquet gift box with teddy bear",
    slug: "rose-bouquet-gift-box-bear",
    description: "A rose bouquet in a presentation box with a keepsake teddy bear, gift-bagged.",
    price: 50000,
    category: "flowers",
    duration: "1-2 days"
  },
  {
    file: "a554ec13-1afc-419c-a39d-3a95915895ca.jpeg",
    name: "Iridescent glass rose",
    slug: "iridescent-glass-rose",
    description: "A holographic, color-shifting preserved rose under glass, lit from within.",
    price: 45000,
    category: "flowers",
    duration: "1-2 days",
    badge: "Popular"
  },
  {
    file: "baceed9a-e758-4a0d-83ce-6687b8e1205a.jpeg",
    name: "Leather handbag",
    slug: "leather-handbag",
    description: "A structured leather handbag with a detachable pom-pom charm.",
    price: 60000,
    category: "womens",
    duration: "1-2 days"
  }
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

  console.log("--- Updating existing products ---");
  for (const u of UPDATES) {
    const filePath = path.join(folder, u.file);
    if (!fs.existsSync(filePath)) {
      console.warn(`Skipping ${u.file} — not found in ${folder}`);
      continue;
    }
    try {
      const url = await uploadToCloudinary(filePath);
      const product = await Product.findOne({ slug: u.slug });
      if (!product) {
        console.warn(`Skipping update — no product with slug "${u.slug}"`);
        continue;
      }
      if (u.mode === "append") {
        product.images = [...(product.images || []), url];
      } else {
        product.images = [url];
      }
      await product.save();
      console.log(`Updated ${u.slug} (${u.mode})`);
    } catch (err) {
      console.error(`Failed on ${u.file}:`, err.message);
    }
  }

  console.log("--- Creating new products ---");
  for (const c of CREATES) {
    const filePath = path.join(folder, c.file);
    if (!fs.existsSync(filePath)) {
      console.warn(`Skipping ${c.file} — not found in ${folder}`);
      continue;
    }
    const categoryId = categoryIds[c.category];
    if (!categoryId) {
      console.warn(`Skipping ${c.name} — category "${c.category}" not found. Run npm run seed first.`);
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
