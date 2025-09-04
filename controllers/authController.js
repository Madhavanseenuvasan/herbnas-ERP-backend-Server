const User = require('../models/userModel');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const sendEmail = require('../utils/sendEmail');
const generateToken = require('../utils/generateToken');

exports.register = async (req, res) => {
  try {
    const { name, email, password, mobileNo, gender, role, branch, employeeStatus } = req.body;
    if (!name || !email || !password || !mobileNo || !gender || !employeeStatus) {
      return res.status(400).json({ message: 'All required fields must be provided' });
    }
    // Check if user already exists
    const userExists = await User.findOne({ email });
    if (userExists) {
      return res.status(400).json({ message: 'User already exists' });
    }
    // Create new user (role defaults to 'staff' via schema)
    const user = new User({
      name,
      email,
      password,
      mobileNo,
      gender,
      role, // optional, defaults to 'staff'
      branch,
      employeeStatus
    });
    await user.save();
    res.status(201).json({
      _id: user._id,
      employeeId: user.employeeId,
      name: user.name,
      email: user.email,
      mobileNo: user.mobileNo,
      role: user.role,
      token: generateToken(user._id, user.role)
    });
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

// Login user
exports.login = async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ message: 'Email and password are required' });
  }
  try {
    const user = await User.findOne({ email }).select("+password"); 
    if (!user) {
      return res.status(400).json({ message: "Invalid credentials" });
    }
    const isMatch = await user.matchPassword(password);
    if (!isMatch) {
      return res.status(400).json({ message: "Invalid credentials" });
    }
    if (user.credentialStatus === 'Inactive') {
      return res.status(403).json({ message: 'Account is inactive. Contact admin.' });
    }
    res.status(200).json({
      message: "Login successful",
      token: generateToken(user._id, user.role),
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get all users (only Super Admin & Branch Manager)
exports.getUsers = async (req, res) => {
  const users = await User.find();
  res.json(users);
};

// Update user role/branch
exports.updateUser = async (req, res) => {
  const user = await User.findById(req.params.id);
  if (!user) return res.status(404).json({ message: "User not found" });

  user.role = req.body.role || user.role;
  user.branch = req.body.branch || user.branch;
  user.isActive = req.body.isActive !== undefined ? req.body.isActive : user.isActive;

  await user.save();
  res.json({ message: "User updated successfully", user });
};

//get user by name
exports.getUserByName = async(req,res)=>{
  try{
    const {name} = req.params;
    const regex = new RegExp(name, 'i');
    const users = await User.find({name:regex});
    if (users.length === 0) {
      return res.status(404).json({ message: 'No users found with that name' });
    }
    res.json(users);
  } catch (err){
    res.status(500).json({ message: err.message });
  }
}

//Soft delete (deactivate)
exports.deactivateUser = async (req, res) => {
  const user = await User.findById(req.params.id);
  if (!user) return res.status(404).json({ message: "User not found" });

  user.isActive = false;
  await user.save();
  res.json({ message: "User deactivated" });
};

//delete user
exports.deleteUser = async(req,res)=>{
  const {id} = req.params;
  await User.findByIdAndDelete(id);
  res.json({message:"User deleted successfully"});
}

//toggle web access
exports.toggleWebAccess = async (req, res) => {
  const { id } = req.params;
  const user = await User.findById(id);
  if (!user) return res.status(404).json({ message: 'User not found' });
  user.webAccess = !user.webAccess;
  await user.save();
  res.json({ webAccess: user.webAccess });
};

//forgot password
exports.forgotPassword = async (req, res) => {
    const user = await User.findOne({ email: req.body.email });
    if (!user) return res.status(404).json({ error: 'User not found' });

    const resetToken = user.generateResetToken();
    await user.save({ validateBeforeSave: false });

    const resetUrl = `${req.protocol}://${req.get('host')}/api/auth/reset-password/${resetToken}`;
    const message = `<p>Click <a href="${resetUrl}">here</a> to reset your password. This link expires in 10 minutes.</p>`;

    try {
        await sendEmail(user.email, 'Password Reset', message);
        res.status(200).json({ message: 'Reset email sent' });
    } catch (err) {
        user.resetPasswordToken = undefined;
        user.resetPasswordExpire = undefined;
        await user.save({ validateBeforeSave: false });
        res.status(500).json({ error: 'Email failed to send' });
    }
};

exports.updateRole = async (req, res) => {
  try {
    const { id } = req.params;
    const updates = { ...req.body };

    // Prevent non-admin from updating role (extra safety)
    if (
      updates.role &&
      req.user.role !== "super_admin" &&
      req.user.role !== "admin"
    ) {
      delete updates.role; // remove role if unauthorized
    }

    const user = await User.findByIdAndUpdate(id, updates, {
      new: true,
      runValidators: true,
    }).select("-password");

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    res.json(user);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.resetPassword = async (req, res) => {
    try {
        if (!req.body.password) {
            return res.status(400).json({ error: 'Password is required' });
        }

        const hashedToken = crypto.createHash('sha256').update(req.params.token).digest('hex');
        const user = await User.findOne({
            resetPasswordToken: hashedToken,
            resetPasswordExpire: { $gt: Date.now() }
        });

        if (!user) {
            return res.status(400).json({ error: 'Token is invalid or has expired' });
        }

        user.password = await bcrypt.hash(req.body.password, 10);
        user.resetPasswordToken = undefined;
        user.resetPasswordExpire = undefined;
        await user.save();

        res.status(200).json({ message: 'Password reset successful' });
    } catch (error) {
        console.error('Reset error:', error);
        res.status(500).json({ error: 'Server error' });
    }
};