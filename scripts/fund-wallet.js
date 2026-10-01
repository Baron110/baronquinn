// Adds a set amount straight to a user's wallet balance — for your own
// testing, not a real payment. Bypasses PayGate entirely.
// Run with: MONGODB_URI="..." node scripts/fund-wallet.js you@example.com 100000
const mongoose = require("mongoose");

async function main() {
  const [, , email, amountArg] = process.argv;
  const uri = process.env.MONGODB_URI;
  const amount = Number(amountArg);

  if (!uri) throw new Error("Set MONGODB_URI in the environment before running this.");
  if (!email || !amount || amount <= 0) {
    throw new Error('Usage: MONGODB_URI="..." node scripts/fund-wallet.js email amount');
  }

  await mongoose.connect(uri);

  const UserSchema = new mongoose.Schema({
    email: String,
    walletBalance: Number
  });
  const User = mongoose.models.User || mongoose.model("User", UserSchema);

  const result = await User.findOneAndUpdate(
    { email: email.toLowerCase() },
    { $inc: { walletBalance: amount } },
    { new: true }
  );

  if (!result) {
    console.log(`No user found with email ${email}.`);
  } else {
    console.log(`Added ₦${amount.toLocaleString()} to ${email}. New balance: ₦${result.walletBalance.toLocaleString()}.`);
  }

  await mongoose.disconnect();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
