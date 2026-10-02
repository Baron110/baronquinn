import mongoose, { Schema, Types } from "mongoose";

export interface IPageView {
  path: string;
  user?: Types.ObjectId; // set when the visitor was logged in
  createdAt: Date;
}

const PageViewSchema = new Schema<IPageView>({
  path: { type: String, required: true },
  user: { type: Schema.Types.ObjectId, ref: "User" },
  createdAt: { type: Date, default: Date.now }
});

// Powers the admin analytics "visits by day" breakdown.
PageViewSchema.index({ createdAt: 1 });

export default mongoose.models.PageView || mongoose.model<IPageView>("PageView", PageViewSchema);
