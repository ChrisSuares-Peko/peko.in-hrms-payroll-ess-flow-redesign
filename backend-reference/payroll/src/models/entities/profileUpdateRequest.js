const mongoose = require('mongoose');

const profileUpdateRequestSchema = new mongoose.Schema({
  corporateUser: {
    type: String,
    ref: 'CorporateUser',
    required: true,
  },
  employee: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Employee',
    required: true,
  },
  userId: {
    type: String,
  },
  type: {
    type: String,
    enum: ['profileDetails', 'bankDetails'],
    required: true,
  },
  // Requested new values (shape depends on `type`).
  requestedData: {
    type: mongoose.Schema.Types.Mixed,
    required: true,
  },
  // Snapshot of the employee's values at submit time, so HR's review always
  // shows an accurate before-state even if the employee's live data changes later.
  currentData: {
    type: mongoose.Schema.Types.Mixed,
    default: {},
  },
  status: {
    type: String,
    enum: ['requestedByEmployee', 'approved', 'rejected'],
    default: 'requestedByEmployee',
  },
  remarks: {
    type: String,
  },
}, { timestamps: true });

profileUpdateRequestSchema.index({ corporateUser: 1, status: 1 });
profileUpdateRequestSchema.index({ employee: 1, type: 1, status: 1 });

profileUpdateRequestSchema.set('toJSON', {
  transform: function (doc, ret) {
    ret.id = ret._id;
    delete ret._id;
    delete ret.__v;
  },
});

module.exports = mongoose.model('ProfileUpdateRequest', profileUpdateRequestSchema);
