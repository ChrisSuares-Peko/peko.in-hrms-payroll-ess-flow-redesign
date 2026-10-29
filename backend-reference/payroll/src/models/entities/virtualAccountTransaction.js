const mongoose = require('mongoose');
const { Schema } = mongoose;

const virtualAccountTransactionSchema = new Schema({
  corporateUser: {
    type: String,
    ref: 'CorporateUser',
    required: true,
    index: true,
  },
  virtualAccountNumber: {
    type: String,
    required: true,
    index: true,
  },
  referenceId: {
    type: String,
    required: true,
    unique: true,
    index: true,
  },
  sourceReferenceId: {
    type: String,
    required: true,
    index: true,
  },
  sourceType: {
    type: String,
    enum: ['SALARY_PAYOUT', 'VA_WITHDRAWAL'],
    required: true,
    index: true,
  },
  type: {
    type: String,
    enum: ['DEBIT', 'CREDIT'],
    required: true,
  },
  amount: {
    type: Number,
    required: true,
  },
  status: {
    type: String,
    enum: ['PENDING', 'SUCCESS', 'FAILED'],
    default: 'SUCCESS',
    index: true,
  },
  decentroTxnId: {
    type: String,
    index: true,
  },
  bankReferenceNumber: String,
  balanceBefore: Number,
  balanceAfter: Number,
  providerRequest: Schema.Types.Mixed,
  providerResponse: Schema.Types.Mixed,
  metadata: Schema.Types.Mixed,
}, { timestamps: true });

virtualAccountTransactionSchema.index({
  corporateUser: 1,
  virtualAccountNumber: 1,
  createdAt: -1,
});
virtualAccountTransactionSchema.index({
  corporateUser: 1,
  sourceType: 1,
  sourceReferenceId: 1,
});

virtualAccountTransactionSchema.set('toJSON', {
  transform(doc, ret) {
    ret.id = ret._id;
    delete ret._id;
    delete ret.__v;
  },
});

const VirtualAccountTransaction = mongoose.model(
  'VirtualAccountTransaction',
  virtualAccountTransactionSchema
);

module.exports = VirtualAccountTransaction;
