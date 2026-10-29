const mongoose = require('mongoose');
const { Schema } = mongoose;

const CorporateBankAccountSchema = new Schema({
  corporateUser: {
    type: String,
    ref: 'CorporateUser',
    required: true,
    unique: true,
  },
  accountHolderName: {
    type: String,
  },
  accountNumber: {
    type: String,
  },
  ifscCode: {
    type: String,
  },
  branch: {
    type: String,
  },
  mobile: {
    type: String,
  },
  nameAtBank: {
    type: String,
  },
  nameMatchScore: {
    type: Number,
  },
  accountStatus: {
    type: String,
  },
  validationType: {
    type: String,
  },
  validationMessage: {
    type: String,
  },
  bankReferenceNumber: {
    type: String,
  },
  decentroTxnId: {
    type: String,
  },
  referenceId: {
    type: String,
  },
  responseKey: {
    type: String,
  },
  message: {
    type: String,
  },
  verifiedAt: {
    type: Date,
  },
  providerResponse: {
    type: Schema.Types.Mixed,
  },
}, {
  timestamps: true,
});

const CorporateBankAccount = mongoose.model(
  'CorporateBankAccount',
  CorporateBankAccountSchema
);

module.exports = CorporateBankAccount;
