const mongoose = require("mongoose");

const leadSchema = new mongoose.Schema(
  {
    leadId: { type: String, unique: true, index: true },
    contact: { type: String, required: true },
    leadStatus: {
      type: String,
      enum: ["New", "Dispatched", "Order Completed", "Qualified", "Pending"],
      default: "New",
    },
    product: { type: String, required: true },
    healthIssue: { type: mongoose.Schema.Types.ObjectId, ref: "HealthIssue" },
    age: { type: Number },
    gender: { type: String, enum: ["Male", "Female", "Other"] },
    maritalStatus: {
      type: String,
      enum: ["Single", "Married", "Divorced", "Widowed"],
    },
    dispatchedFrom: {type: String},
    notes: {type: String},
    remainder: {type: String},
    address: {
      city: String,
      pinCode: String,
      state: String,
      country: String,
    },
    completed: { type: Boolean, default: false },
  },
  { timestamps: true }
);

// 🔹 Generator function
async function generateLeadId() {
  const lastLead = await mongoose.model("Lead").findOne().sort({ createdAt: -1 });
  let nextNumber = 1;
  if (lastLead && lastLead.leadId) {
    const lastNum = parseInt(lastLead.leadId.replace("Lead", ""));
    if (!isNaN(lastNum)) nextNumber = lastNum + 1;
  }
  return "Lead" + String(nextNumber).padStart(5, "0");
}

// 🔹 Works for .save()
leadSchema.pre("save", async function (next) {
  if (!this.leadId) {
    this.leadId = await generateLeadId();
  }
  next();
});

// ❌ insertMany middleware doesn’t run by default
// 🔹 Fix: Wrap insertMany manually
leadSchema.statics.safeInsertMany = async function (docs) {
  for (let doc of docs) {
    if (!doc.leadId) {
      doc.leadId = await generateLeadId();
    }
  }
  return this.insertMany(docs);
};

module.exports = mongoose.model("Lead", leadSchema);
