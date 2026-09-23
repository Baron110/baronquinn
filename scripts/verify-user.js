// Marks a user's email as verified, without needing a verification email to
// actually send — useful for testing checkout before Resend is fully wired up.
// Run with: MONGODB_URI="..." node scripts/verify-user.js you@example.com
const mongoose = require("mongoose");

async function main() {
  const [, , email] = process.argv;
  const uri = process.env.MONGODB_URI;

  if (!uri) throw new Error("Set MONGODB_URI in the environment before running this.");
  if (!email) throw new Error('Usage: MONGODB_URI="..." node scripts/verify-user.js email');

  await mongoose.connect(uri);

  const UserSchema = new mongoose.Schema({
    email: String,
    emailVerified: Boolean
  });
  const User = mongoose.models.User || mongoose.model("User", UserSchema);

  const result = await User.findOneAndUpdate(
    { email: email.toLowerCase() },
    { emailVerified: true }
  );

  if (!result) {
    console.log(`No user found with email ${email}.`);
  } else {
    console.log(`Marked ${email} as verified.`);
  }

  await mongoose.disconnect();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
