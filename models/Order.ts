import { Schema, models, model, Types } from "mongoose";

export type OrderStatus = "pending" | "paid" | "failed" | "cancelled";

export interface IOrder {
  user?: Types.ObjectId; // ref User
  product?: Types.ObjectId; // ref Product, when it comes from the Mongo catalog
  productSlug: string;
  productName: string; // snapshot at time of order
  amount: number;
  sender: { name: string; phone: string; email: string };
  recipient: { name: string; phone?: string };
  loveNote?: string;
  address: {
    street: string;
    apartment?: string;
    city: string;
    state: string;
    country: string;
    zip?: string;
  };
  reference: string; // sent to PayGate as REFERENCE, matched back on the notify webhook
  status: OrderStatus;
  createdAt: Date;
}

const OrderSchema = new Schema<IOrder>({
  user: { type: Schema.Types.ObjectId, ref: "User" },
  product: { type: Schema.Types.ObjectId, ref: "Product" },
  productSlug: { type: String, required: true },
  productName: { type: String, required: true },
  amount: { type: Number, required: true },
  sender: {
    name: { type: String, required: true },
    phone: { type: String, required: true },
    email: { type: String, required: true }
  },
  recipient: {
    name: { type: String, required: true },
    phone: { type: String }
  },
  loveNote: { type: String },
  address: {
    street: { type: String, required: true },
    apartment: { type: String },
    city: { type: String, required: true },
    state: { type: String, required: true },
    country: { type: String, required: true },
    zip: { type: String }
  },
  reference: { type: String, required: true, unique: true },
  status: { type: String, enum: ["pending", "paid", "failed", "cancelled"], default: "pending" },
  createdAt: { type: Date, default: Date.now }
});

export default models.Order || model<IOrder>("Order", OrderSchema);
