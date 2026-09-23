import { Schema, models, model, Types } from "mongoose";

export type WalletTxType = "deposit" | "debit";
export type WalletTxStatus = "pending" | "completed" | "failed";

export interface IWalletTransaction {
  user: Types.ObjectId; // ref User
  type: WalletTxType;
  status: WalletTxStatus;
  amount: number;
  reference: string; // deposits: matches the PayGate reference. debits: matches the Order reference.
  relatedOrder?: Types.ObjectId; // ref Order, set on debit entries
  description?: string;
  payment?: {
    accountNumber: string;
    accountName: string;
    bankName: string;
    virtualAccountUuid: string;
  };
  createdAt: Date;
}

const WalletTransactionSchema = new Schema<IWalletTransaction>({
  user: { type: Schema.Types.ObjectId, ref: "User", required: true },
  type: { type: String, enum: ["deposit", "debit"], required: true },
  status: { type: String, enum: ["pending", "completed", "failed"], default: "pending" },
  amount: { type: Number, required: true },
  reference: { type: String, required: true, unique: true },
  relatedOrder: { type: Schema.Types.ObjectId, ref: "Order" },
  description: { type: String },
  payment: {
    accountNumber: { type: String },
    accountName: { type: String },
    bankName: { type: String },
    virtualAccountUuid: { type: String }
  },
  createdAt: { type: Date, default: Date.now }
});

export default models.WalletTransaction || model<IWalletTransaction>("WalletTransaction", WalletTransactionSchema);
