import { Schema, models, model } from "mongoose";

export type Role = "customer" | "admin";

export interface IUser {
  name: string;
  email: string;
  passwordHash: string;
  role: Role;
  emailVerified: boolean;
  verificationToken?: string;
  verificationTokenExpires?: Date;
  walletBalance: number;
  createdAt: Date;
}

const UserSchema = new Schema<IUser>({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true, lowercase: true, trim: true },
  passwordHash: { type: String, required: true },
  role: { type: String, enum: ["customer", "admin"], default: "customer" },
  emailVerified: { type: Boolean, default: false },
  verificationToken: { type: String },
  verificationTokenExpires: { type: Date },
  walletBalance: { type: Number, default: 0 },
  createdAt: { type: Date, default: Date.now }
});

export default models.User || model<IUser>("User", UserSchema);
