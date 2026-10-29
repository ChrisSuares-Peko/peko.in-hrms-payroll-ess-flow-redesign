const mongoose = require('mongoose');



const salaryInformationSchema = new mongoose.Schema({
  basicPay: {
    type: Number,
    default: 0
  },
  hraAmount: { type: Number, default: 0 },
  daAmount: { type: Number, default: 0 },
  bonus: {
    type: Number,
    default: 0
  },
  incentiveAmount: {
    type: Number,
    default: 0
  },
  increamentAmount: {
    type: Number,
    default: 0
  },
  overtimeAmount: {
    type: Number,
    default: 0
  },
  deductionAmount: {
    type: Number,
    default: 0
  },
  tdsAmount: {
    type: Number,
    default: 0
  },
  leavesAmount: {
    type: Number,
    default: 0
  },
  esiAmount: {
    type: Number,
    default: 0
  },
  epfAmount: {
    type: Number,
    default: 0
  },
  lwfAmount: {
    type: Number,
    default: 0
  },
  other: {
    type: Number,
    default: 0
  },
}, { _id: false, strict: false })



module.exports = salaryInformationSchema;

