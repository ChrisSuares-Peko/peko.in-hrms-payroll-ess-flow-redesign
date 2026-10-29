const mongoose = require('mongoose');
const { Schema } = mongoose;

const CorporateVirtualAccountSchema = new Schema({
  corporateUser: {
    type: String,
    ref: 'CorporateUser',
    required: true,
    unique: true,
  },
  decentroCustomerId: {
    type: String,
  },
  decentroTxnId: {
    type: String,
  },
  virtualAccountNumber: {
    type: String,
  },
  virtualAccountIfsc: {
    type: String,
  },
  bankCode: {
    type: String,
  },
  name: {
    type: String,
  },
  pan: {
    type: String,
  },
  mobile: {
    type: String,
  },
  status: {
    type: String,
  },
  responseCode: {
    type: String,
  },
  message: {
    type: String,
  },
  providerResponse: {
    type: Schema.Types.Mixed,
  },
}, {
  timestamps: true,
});

const CorporateVirtualAccount = mongoose.model(
  'CorporateVirtualAccount',
  CorporateVirtualAccountSchema
);

module.exports = CorporateVirtualAccount;
