const mongoose = require('mongoose');
const { Schema } = mongoose;

const virtualAccountWithdrawalRequestSchema = new Schema({
  corporateUser: {
    type: String,
    ref: 'CorporateUser',
    required: true,
    index: true,
  },
  referenceId: {
    type: String,
    required: true,
    unique: true,
    index: true,
  },
  amount: {
    type: Number,
    required: true,
  },
  transferType: {
    type: String,
    enum: ['IMPS', 'NEFT', 'RTGS'],
    default: 'IMPS',
  },
  status: {
    type: String,
    enum: ['PENDING', 'INITIATED', 'SUCCESS', 'FAILED'],
    default: 'PENDING',
    index: true,
  },
  providerStatus: String,
  providerMessage: String,
  decentroTxnId: {
    type: String,
    index: true,
  },
  bankReferenceNumber: String,
  remarks: String,
  sourceVirtualAccount: {
    virtualAccountNumber: String,
    virtualAccountIfsc: String,
    accountName: String,
    balanceBefore: Number,
    balanceAfter: Number,
    providerData: Schema.Types.Mixed,
  },
  beneficiary: {
    name: String,
    bankName: String,
    accountNumber: String,
    ifscCode: String,
    phone: String,
  },
  providerRequest: Schema.Types.Mixed,
  providerResponse: Schema.Types.Mixed,
  statusResponse: Schema.Types.Mixed,
  statusReason: String,
  statusHistory: [
    {
      status: String,
      providerStatus: String,
      message: String,
      occurredAt: Date,
      raw: Schema.Types.Mixed,
    },
  ],
  initiatedAt: Date,
  completedAt: Date,
  failedAt: Date,
  virtualAccountTransaction: {
    type: Schema.Types.ObjectId,
    ref: 'VirtualAccountTransaction',
  },
}, { timestamps: true });

virtualAccountWithdrawalRequestSchema.index({
  corporateUser: 1,
  createdAt: -1,
});

virtualAccountWithdrawalRequestSchema.index({
  corporateUser: 1,
  status: 1,
  createdAt: -1,
});

virtualAccountWithdrawalRequestSchema.set('toJSON', {
  transform(doc, ret) {
    ret.id = ret._id;
    delete ret._id;
    delete ret.__v;
  },
});

module.exports = mongoose.model(
  'VirtualAccountWithdrawalRequest',
  virtualAccountWithdrawalRequestSchema
);
