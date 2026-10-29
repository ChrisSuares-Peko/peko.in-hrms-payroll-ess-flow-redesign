const mongoose = require('mongoose');
const { Schema } = mongoose;

const salaryPayoutBatchSchema = new Schema({
  corporateUser: {
    type: String,
    ref: 'CorporateUser',
    required: true,
    index: true,
  },
  batchReferenceId: {
    type: String,
    required: true,
    unique: true,
    index: true,
  },
  month: {
    type: Number,
    required: true,
  },
  year: {
    type: Number,
    required: true,
  },
  sourceAccount: {
    virtualAccountNumber: String,
    virtualAccountIfsc: String,
    accountName: String,
    balanceBefore: Number,
    providerData: Schema.Types.Mixed,
  },
  requestedCount: {
    type: Number,
    default: 0,
  },
  initiatedCount: {
    type: Number,
    default: 0,
  },
  skippedCount: {
    type: Number,
    default: 0,
  },
  failedCount: {
    type: Number,
    default: 0,
  },
  successCount: {
    type: Number,
    default: 0,
  },
  totalRequestedAmount: {
    type: Number,
    default: 0,
  },
  totalInitiatedAmount: {
    type: Number,
    default: 0,
  },
  status: {
    type: String,
    enum: [
      'PENDING',
      'PROCESSING',
      'PARTIALLY_PROCESSING',
      'COMPLETED',
      'PARTIALLY_COMPLETED',
      'FAILED',
    ],
    default: 'PENDING',
  },
  remarks: String,
  rawRequest: Schema.Types.Mixed,
}, { timestamps: true });

salaryPayoutBatchSchema.index({ corporateUser: 1, month: 1, year: 1, createdAt: -1 });

salaryPayoutBatchSchema.set('toJSON', {
  transform(doc, ret) {
    ret.id = ret._id;
    delete ret._id;
    delete ret.__v;
  },
});

const SalaryPayoutBatch = mongoose.model('SalaryPayoutBatch', salaryPayoutBatchSchema);

module.exports = SalaryPayoutBatch;
