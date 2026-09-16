import { Schema, models, model, Types } from "mongoose";

export interface IProduct {
  name: string;
  slug: string;
  description: string;
  price: number;
  compareAt?: number;
  category: Types.ObjectId; // ref Category
  images: string[]; // Cloudinary URLs
  duration: string; // e.g. "Same day", "1-2 days", "3-5 days"
  isCustomized: boolean; // whether this item takes custom text/photo/message
  badge?: string;
  active: boolean;
  createdAt: Date;
}

const ProductSchema = new Schema<IProduct>({
  name: { type: String, required: true },
  slug: { type: String, required: true, unique: true, lowercase: true, trim: true },
  description: { type: String, default: "" },
  price: { type: Number, required: true },
  compareAt: { type: Number },
  category: { type: Schema.Types.ObjectId, ref: "Category", required: true },
  images: { type: [String], default: [] },
  duration: { type: String, default: "1-2 days" },
  isCustomized: { type: Boolean, default: false },
  badge: { type: String },
  active: { type: Boolean, default: true },
  createdAt: { type: Date, default: Date.now }
});

export default models.Product || model<IProduct>("Product", ProductSchema);
