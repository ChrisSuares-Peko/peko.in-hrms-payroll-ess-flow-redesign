const mongoose = require('mongoose');

const statusHistorySchema = new mongoose.Schema({
  status: { type: String },
  message: { type: String },
  occurredAt: { type: Date, default: Date.now },
  raw: { type: mongoose.Schema.Types.Mixed },
}, { _id: false });

const oneTimePaymentSchema = new mongoose.Schema({
  corporateUser: { type: String, ref: 'CorporateUser', required: true, index: true },
  employee: { type: mongoose.Schema.Types.ObjectId, ref: 'Employee', required: true },
  amount: { type: Number, required: true },
  remark: { type: String, default: '' },
  month: { type: Number, required: true },
  year: { type: Number, required: true },
  payFrom: { type: String },
  referenceId: { type: String, unique: true, sparse: true },
  decentroTxnId: { type: String },
  paymentStatus: {
    type: String,
    enum: ['PENDING', 'INITIATED', 'SUCCESS', 'FAILED'],
    default: 'PENDING',
    index: true,
  },
  providerRequest: { type: mongoose.Schema.Types.Mixed },
  providerResponse: { type: mongoose.Schema.Types.Mixed },
  statusHistory: { type: [statusHistorySchema], default: [] },
  initiatedAt: { type: Date },
  completedAt: { type: Date },
  failedAt: { type: Date },
}, { timestamps: true });

module.exports = mongoose.model('OneTimePayment', oneTimePaymentSchema);
