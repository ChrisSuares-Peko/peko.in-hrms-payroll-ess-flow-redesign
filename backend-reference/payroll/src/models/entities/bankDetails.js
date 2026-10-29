const mongoose = require('mongoose');
const { Schema } = mongoose;

const BankDetailsSchema = new Schema({
  employeeId: {
    type: Schema.Types.ObjectId,
    ref: 'Employee',
    required: true
  },
  corporateUser: {
    type: String,
    ref: 'CorporateUser',
    required: true,
  },
  accountName: {
    type: String,
    default: null,
  },
  accountNumber: {
    type: String,
    default: null,
  },
  bankName: {
    type: String,
    default: null,
  },
  ifscCode: {
    type: String,
    default: null,
  },
  isDefaultAccount: {
    type: Boolean,
    default: false,
  },
  upiId: {
    type: String,
    default: null,
  },
  transactionType: {
    type: String,
    enum: ['NEFT', 'UPI', 'IMPS', 'RTGS'],
    default: null,
  },
  bankAccountStatus: {
    type: String,
    enum: ['Approved', 'Pending Verification', 'Missing Information', 'Pending', 'In Progress', 'Completed', 'Failed'],//adding new status fields as per product requirement
    default: 'Pending',
  },
  beneficiaryStatus: {
    type: String,
    enum: ['Added', 'Pending', 'Failed',],
    default: 'Pending',
  },
  remark: {
    type: String,
    default: null,
  },
}, {
  timestamps: true
});

// Creating the model from the schema
const BankDetails = mongoose.model('BankDetails', BankDetailsSchema, 'bankdetails');

module.exports = BankDetails;
