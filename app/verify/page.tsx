import Link from "next/link";
import { connectDB } from "@/lib/mongodb";
import User from "@/models/User";

async function verify(token: string | undefined) {
  if (!token) return "missing" as const;

  await connectDB();
  const user = await User.findOne({ verificationToken: token });

  if (!user) return "invalid" as const;
  if (user.verificationTokenExpires && user.verificationTokenExpires < new Date()) return "expired" as const;

  user.emailVerified = true;
  user.verificationToken = undefined;
  user.verificationTokenExpires = undefined;
  await user.save();

  return "success" as const;
}

export default async function VerifyPage({ searchParams }: { searchParams: { token?: string } }) {
  const result = await verify(searchParams.token);

  const copy = {
    success: {
      title: "Email confirmed",
      body: "Your account is verified — you're all set."
    },
    invalid: {
      title: "Invalid link",
      body: "This verification link doesn't match any account."
    },
    expired: {
      title: "Link expired",
      body: "This verification link has expired. Log in and request a new one."
    },
    missing: {
      title: "Missing token",
      body: "No verification token was provided."
    }
  }[result];

  return (
    <div className="min-h-screen flex items-center justify-center bg-bone px-5">
      <div className="w-full max-w-md bg-paper border border-line rounded-2xl shadow-sm p-8 text-center">
        <h1 className="text-2xl">{copy.title}</h1>
        <p className="text-sm text-ink/60 mt-2">{copy.body}</p>
        <Link
          href="/login"
          className="inline-block mt-6 border border-ink px-6 py-3 text-sm hover:bg-ink hover:text-paper transition-colors"
        >
          Go to login
        </Link>
      </div>
    </div>
  );
}
