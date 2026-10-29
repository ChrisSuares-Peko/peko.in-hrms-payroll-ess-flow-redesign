const mongoose = require('mongoose');

// A manually entered monthly TDS amount for an Old Tax Regime employee — the platform
// doesn't compute old-regime TDS yet, so HR computes it outside and enters it here. An
// "all future months" document applies from its own month/year onward, until the next
// such document takes over. E.g. ₹18,000 from Oct and ₹20,000 from Jan → Nov/Dec pay
// ₹18,000, Jan onward ₹20,000; re-editing Nov to ₹19,000 then changes Nov/Dec only. A
// "this month only" document (applyToFutureMonths: false) overrides just its own month.
const tdsOverrideSchema = new mongoose.Schema(
  {
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
    month: { type: Number, required: true, min: 1, max: 12 },
    year: { type: Number, required: true },
    amount: { type: Number, required: true, min: 0 },
    // false = this month only: later months keep whatever applied before this entry.
    applyToFutureMonths: { type: Boolean, default: true },
  },
  { timestamps: true }
);

tdsOverrideSchema.index({ corporateUser: 1, employee: 1, year: 1, month: 1 }, { unique: true });

module.exports = mongoose.model('TdsOverride', tdsOverrideSchema);
