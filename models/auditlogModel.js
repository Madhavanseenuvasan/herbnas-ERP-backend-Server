const mongoose = require('mongoose');

const AuditLogSchema = new mongoose.Schema({
  module: { type: String, required: true },
  action: { type: String, required: true }, // e.g., CREATE, UPDATE, DELETE, STATUS_CHANGE
  recordId: { type: mongoose.Schema.Types.ObjectId, required: true }, // ref to the entity
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  details: mongoose.Schema.Types.Mixed, // store diff/changes
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('AuditLog', AuditLogSchema);
