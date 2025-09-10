const mongoose = require('mongoose');

const healthIssueSchema = new mongoose.Schema({
  healthIssue: { type: String, required: true },
  gender: { type: String, enum: ['male', 'female'], required: true },
  maritalStatus: { type: String, enum: ['unmarried', 'married'], required: true },
  fromAge: { type: Number, required: true },
  toAge: { type: Number, required: true }
});

module.exports = mongoose.model('HealthIssue', healthIssueSchema);
