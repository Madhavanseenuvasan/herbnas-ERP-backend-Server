const mongoose = require("mongoose");

const employeeSchema = new mongoose.Schema({
  firstName: { type: String, required: true },
  lastName: { type: String, required: true },
  employeeId: { type: String, unique: true },
  branch: { type: String, unique: true },
  gender: { type: String, enum: ["Male", "Female", "Other"], required: true },
  address: { type: String },
  mobile: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  birthDate: { type: Date, required: true },
  incentives: { type: Number, default: 0 },

  // Personal Information
  aadharNumber: { type: String },

  bankAccount: { type: String },
  pancardNumber: { type: String },

  // Job Information
  joiningDate: { type: Date, required: true },
  department: { type: String, required: true },
  jobPosition: { type: String, required: true },
  salaryGrade: { type: String, enum: ["Basic", "Advanced", "Manager"], default: "Basic" },
  resigned: { type: Boolean, default: false },
  releaseDate: { type: Date },
  notes: { type: String },

  // Pay Elements
//   usePersonalSalaryStructure: { type: Boolean, default: false },
  basicSalaryAmount: { type: Number, default: 0 },
  transportationAllowance: { type: Number, default: 0 }
}, { timestamps: true });

employeeSchema.pre('save', async function (next) {
  if (!this.employeeId) {
    const count = await mongoose.model('User').countDocuments();
    this.employeeId = `emp${1001 + count}`;
  }
  next();
});

module.exports = mongoose.model("Employee", employeeSchema);