import mongoose from "mongoose";

const TransactionSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
  type: { type: String, enum: ["subscription", "topup", "refund"], required: true },
  amount: { type: Number, required: true }, // in paise
  currency: { type: String, default: "INR" },
  dodoPaymentId: { type: String, index: true },
  plan: { type: String }, // for subscription transactions
  topUpDms: { type: Number }, // for top-up transactions
  status: { type: String, enum: ["pending", "success", "failed", "refunded"], default: "pending" },
  metadata: { type: mongoose.Schema.Types.Mixed },
  createdAt: { type: Date, default: Date.now },
});

export default mongoose.models.Transaction || mongoose.model("Transaction", TransactionSchema);
