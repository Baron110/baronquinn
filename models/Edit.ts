import mongoose, { Schema, Types } from "mongoose";

export type EditType =
  | "prompt-edit"
  | "face-swap"
  | "remove-bg"
  | "enhance"
  | "image-to-video"
  | "talking-video"
  | "voice-clone"
  | "docs";

export interface IEdit {
  _id: Types.ObjectId;
  user: Types.ObjectId;
  type: EditType;
  prompt?: string;
  originalImage?: string;
  resultUrl?: string;
  status: "pending" | "processing" | "completed" | "failed";
  cost: number;
  error?: string;
  freeRegenerateUsed: boolean;
  usedFreeEdit: boolean;
  createdAt: Date;
}

const EditSchema = new Schema<IEdit>({
  user: { type: Schema.Types.ObjectId, ref: "User", required: true },
  type: {
    type: String,
    enum: ["prompt-edit", "face-swap", "remove-bg", "enhance", "image-to-video", "talking-video", "voice-clone", "docs"],
    required: true
  },
  prompt: { type: String },
  originalImage: { type: String },
  resultUrl: { type: String },
  status: { type: String, enum: ["pending", "processing", "completed", "failed"], default: "pending" },
  cost: { type: Number, required: true },
  error: { type: String },
  freeRegenerateUsed: { type: Boolean, default: false },
  usedFreeEdit: { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now }
});

export default mongoose.models.Edit || mongoose.model<IEdit>("Edit", EditSchema);
