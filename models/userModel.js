const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');

const counterSchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true }, // e.g. "employeeId"
  seq: { type: Number, default: 1000 } // start from emp1001
});

const Counter = mongoose.model('Counter', counterSchema);


const userSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true, select: false },
  mobileNo: { type: String, required: true },
  gender: { type: String, enum: ['Male', 'Female', 'Other'], required: true },
  employeeId: { type: String, unique: true },
  role: {
    type: String,
    enum: ['admin', 'super_admin', 'supervisor', 'production_manager','account_manager','sales'],
    default: 'staff',
    required: true
  },
  branch: { type: String },
  webAccess: { type: Boolean, default: true },
  credentialStatus: { type: String, enum: ['Active', 'Inactive'], default: 'Active' },
  employeeStatus: { type: String, enum: ['Permanent', 'Contract'], required: true },
  resetPasswordToken: String,
  resetPasswordExpire: Date
}, { timestamps: true });

userSchema.pre('save', async function (next) {
  if (!this.employeeId) {
    const counter = await Counter.findOneAndUpdate(
      { id: 'employeeId' },
      { $inc: { seq: 1 } }, // atomically increment
      { new: true, upsert: true } // create if doesn't exist
    );

    this.employeeId = `emp${counter.seq}`;
  }
  if (this.isModified('password')) {
    this.password = await bcrypt.hash(this.password, 12);
  }
  next();
});


// userSchema.pre('save', async function (next) {
//   if (!this.isModified('password')) return next();
//   this.password = await bcrypt.hash(this.password, 12);
//   next();
// });

userSchema.methods.matchPassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

userSchema.methods.generateResetToken = function () {
  const resetToken = crypto.randomBytes(32).toString('hex');
  this.resetPasswordToken = crypto.createHash('sha256').update(resetToken).digest('hex');
  this.resetPasswordExpire = Date.now() + 10 * 60 * 1000;
  return resetToken;
};

module.exports = mongoose.model('User', userSchema);
