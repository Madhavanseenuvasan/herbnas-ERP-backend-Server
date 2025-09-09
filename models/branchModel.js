const mongoose = require('mongoose');

// -------- User Assignment --------
const UserAssignmentSchema = new mongoose.Schema({
  userId: { type: String, required: true },   // frontend sends "U001", not ObjectId
  role: { type: String, required: true },
  startDate: Date,
  endDate: Date
}, { _id: false });

// -------- Product Assignment --------
const ProductAssignmentSchema = new mongoose.Schema({
  productId: { type: String, required: true },   // frontend sends "P001"
  priceOverride: Number,
  discount: Number,
  effectiveFrom: Date,
  effectiveTo: Date                     // 🔑 added as requested
}, { _id: false });

// -------- Branch Schema --------
const BranchSchema = new mongoose.Schema({
  branchCode: { type: String, unique: true },  // auto-generated BR001, BR002...
  branchName: { type: String, required: true },
  type: { type: String, enum: ["SALES", "MANUFACTURING"], required: true },
  status: { type: String, enum: ["DRAFT", "ACTIVE", "INACTIVE"], default: "DRAFT" },
  managerName: String,
  parentCompany: String,
  totalEmployees: { type: Number, default: 0 },

  // Location + Contact merged (as frontend expects)
  location: {
    address1: String,
    address2: String,
    city: String,
    state: String,
    country: String,
    postalCode: String,
    latitude: Number,
    longitude: Number,
    phone: String,
    email: { type: String, match: /.+\@.+\..+/ }
  },

  // Assignments
  userAssignments: [UserAssignmentSchema],
  productAssignments: [ProductAssignmentSchema],

  // Config
  config: {
    defaultProductSet: String,
    pricingPolicy: String,
    taxRegion: String,
    incentiveScheme: String,
    workingHours: String
  },

  // Audit
  audit: {
    createdBy: String,
    createdDate: { type: Date, default: Date.now },
    modifiedBy: String,
    modifiedDate: Date
  }
}, { timestamps: true });

// 🔑 Auto-generate branchCode (BR001, BR002...)
BranchSchema.pre("save", async function (next) {
  if (!this.branchCode) {
    const lastBranch = await mongoose.model("Branch").findOne().sort({ createdAt: -1 });
    let newCode = "BR001";

    if (lastBranch && lastBranch.branchCode) {
      const lastNumber = parseInt(lastBranch.branchCode.replace("BR", "")) || 0;
      newCode = "BR" + String(lastNumber + 1).padStart(3, "0");
    }

    this.branchCode = newCode;
  }
  next();
});

module.exports = mongoose.model("Branch", BranchSchema);
