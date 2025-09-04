const mongoose = require('mongoose');

const UserAssignmentSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  role: { type: String, required: true },
  startDate: Date,
  endDate: Date
}, { _id: false });

const ProductAssignmentSchema = new mongoose.Schema({
  productId: { type: mongoose.Schema.Types.ObjectId, ref: "Product", required: true },
  priceOverride: Number,
  discount: Number,
  validUntil: Date
}, { _id: false });

const BranchSchema = new mongoose.Schema({
  branchCode: { type: String, required: true, unique: true },
  branchName: { type: String, required: true },
  type: { type: String, enum: ["Sales", "Manufacturing"], required: true },
  status: { type: String, enum: ["Draft", "Active", "Inactive"], default: "Draft" },
  parentCompany: String,
  totalEmployees: { type: Number, default: 0 },

  location: {
    addressLine1: String,
    addressLine2: String,
    city: String,
    state: String,
    country: String,
    postalCode: String,
    latitude: Number,
    longitude: Number
  },

  contactInfo: {
    phone: String,
    email: { type: String, match: /.+\@.+\..+/ },
    managerName: String,
    alternateContact: String
  },

  userAssignments: [UserAssignmentSchema],
  productAssignments: [ProductAssignmentSchema],

  config: {
    defaultProductSet: String,
    taxRegion: String,
    incentiveScheme: String,
    workingHours: String
  },

  audit: {
    createdBy: String,
    createdDate: { type: Date, default: Date.now },
    modifiedBy: String,
    modifiedDate: Date
  }
}, { timestamps: true });

module.exports = mongoose.model("Branch", BranchSchema);
