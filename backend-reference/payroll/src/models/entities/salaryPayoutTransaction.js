const mongoose = require('mongoose');
const { Schema } = mongoose;

const salaryPayoutTransactionSchema = new Schema({
  corporateUser: {
    type: String,
    ref: 'CorporateUser',
    required: true,
    index: true,
  },
  batchReferenceId: {
    type: String,
    required: true,
    index: true,
  },
  salary: {
    type: Schema.Types.ObjectId,
    ref: 'Salary',
    required: true,
    index: true,
  },
  employee: {
    type: Schema.Types.ObjectId,
    ref: 'Employee',
    required: true,
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
  referenceId: {
    type: String,
    required: true,
    unique: true,
    index: true,
  },
  decentroTxnId: {
    type: String,
    index: true,
  },
  amount: {
    type: Number,
    required: true,
  },
  transferType: {
    type: String,
    default: 'IMPS',
  },
  sourceAccount: {
    virtualAccountNumber: String,
    virtualAccountIfsc: String,
    accountName: String,
  },
  beneficiary: {
    accountName: String,
    accountNumber: String,
    ifscCode: String,
    bankName: String,
    email: String,
    mobile: String,
  },
  status: {
    type: String,
    enum: ['PENDING', 'INITIATED', 'SUCCESS', 'FAILED', 'SKIPPED'],
    default: 'PENDING',
    index: true,
  },
  statusReason: String,
  providerStatus: String,
  providerMessage: String,
  providerRequest: Schema.Types.Mixed,
  providerResponse: Schema.Types.Mixed,
  statusResponse: Schema.Types.Mixed,
  vaDebitReferenceId: {
    type: String,
    index: true,
  },
  vaDebitStatus: {
    type: String,
    enum: ['PENDING', 'SUCCESS', 'FAILED'],
    index: true,
  },
  vaDebitTxnId: {
    type: String,
    index: true,
  },
  vaDebitProviderRequest: Schema.Types.Mixed,
  vaDebitProviderResponse: Schema.Types.Mixed,
  virtualAccountTransaction: {
    type: Schema.Types.ObjectId,
    ref: 'VirtualAccountTransaction',
  },
  debitedAt: Date,
  statusHistory: [{
    status: String,
    providerStatus: String,
    message: String,
    occurredAt: {
      type: Date,
      default: Date.now,
    },
    raw: Schema.Types.Mixed,
  }],
  initiatedAt: Date,
  completedAt: Date,
  failedAt: Date,
}, { timestamps: true });

salaryPayoutTransactionSchema.index({ corporateUser: 1, month: 1, year: 1, createdAt: -1 });
salaryPayoutTransactionSchema.index({ corporateUser: 1, batchReferenceId: 1, createdAt: -1 });
salaryPayoutTransactionSchema.index({ corporateUser: 1, salary: 1, status: 1 });

salaryPayoutTransactionSchema.set('toJSON', {
  transform(doc, ret) {
    ret.id = ret._id;
    delete ret._id;
    delete ret.__v;
  },
});

const SalaryPayoutTransaction = mongoose.model(
  'SalaryPayoutTransaction',
  salaryPayoutTransactionSchema
);

module.exports = SalaryPayoutTransaction;
