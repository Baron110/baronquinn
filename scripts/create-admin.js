// Creates a user with role "admin", or promotes an existing user to admin.
// Run with: MONGODB_URI="..." node scripts/create-admin.js you@example.com "a strong password" "Your Name"
const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

async function main() {
  const [, , email, password, name] = process.argv;
  const uri = process.env.MONGODB_URI;

  if (!uri) throw new Error("Set MONGODB_URI in the environment before running this.");
  if (!email || !password) {
    throw new Error('Usage: MONGODB_URI="..." node scripts/create-admin.js email password "Name"');
  }

  await mongoose.connect(uri);

  const UserSchema = new mongoose.Schema({
    name: String,
    email: String,
    passwordHash: String,
    role: String,
    createdAt: { type: Date, default: Date.now }
  });
  const User = mongoose.models.User || mongoose.model("User", UserSchema);

  const passwordHash = await bcrypt.hash(password, 10);
  const existing = await User.findOne({ email: email.toLowerCase() });

  if (existing) {
    existing.role = "admin";
    existing.passwordHash = passwordHash;
    await existing.save();
    console.log(`Promoted existing user ${email} to admin.`);
  } else {
    await User.create({
      name: name || "Admin",
      email: email.toLowerCase(),
      passwordHash,
      role: "admin"
    });
    console.log(`Created admin user ${email}.`);
  }

  await mongoose.disconnect();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
