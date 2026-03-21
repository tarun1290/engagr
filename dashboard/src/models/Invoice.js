import mongoose from "mongoose";

// Auto-increment counter for invoice numbers
const CounterSchema = new mongoose.Schema({
  _id: { type: String, required: true },
  seq: { type: Number, default: 0 },
});

const Counter = mongoose.models.Counter || mongoose.model("Counter", CounterSchema);

const InvoiceSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
  invoiceNumber: { type: String, unique: true },
  dodoPaymentId: { type: String },
  amount: { type: Number, required: true }, // in paise, pre-tax
  tax: { type: Number, required: true }, // 18% GST in paise
  total: { type: Number, required: true }, // amount + tax in paise
  plan: { type: String },
  periodStart: { type: Date },
  periodEnd: { type: Date },
  status: { type: String, enum: ["paid", "pending", "failed"], default: "pending" },
  paidAt: { type: Date },
  downloadUrl: { type: String },
  createdAt: { type: Date, default: Date.now },
});

// Generate invoice number as "ENG-YYYY-NNNN" before save
InvoiceSchema.pre("save", async function (next) {
  if (this.invoiceNumber) return next();

  const year = new Date().getFullYear();
  const counterId = `invoice_${year}`;

  const counter = await Counter.findByIdAndUpdate(
    counterId,
    { $inc: { seq: 1 } },
    { upsert: true, returnDocument: "after" }
  );

  this.invoiceNumber = `ENG-${year}-${String(counter.seq).padStart(4, "0")}`;
  next();
});

export default mongoose.models.Invoice || mongoose.model("Invoice", InvoiceSchema);
