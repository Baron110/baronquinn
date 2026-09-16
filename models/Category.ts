import { Schema, models, model } from "mongoose";

export interface ICategory {
  slug: string;
  label: string;
  blurb?: string;
  createdAt: Date;
}

const CategorySchema = new Schema<ICategory>({
  slug: { type: String, required: true, unique: true, lowercase: true, trim: true },
  label: { type: String, required: true },
  blurb: { type: String },
  createdAt: { type: Date, default: Date.now }
});

export default models.Category || model<ICategory>("Category", CategorySchema);
