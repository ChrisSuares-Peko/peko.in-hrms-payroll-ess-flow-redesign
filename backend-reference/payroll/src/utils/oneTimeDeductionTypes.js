// "Deduction for" options on Add Deduction — one-time recoveries from earned pay
// (Code on Wages 2019 s.18(2)). Unpaid days are Loss of Pay, recurring charges are
// Salary Components › Deductions; neither belongs here.
const ONE_TIME_DEDUCTION_TYPES = [
  'Salary advance recovery',
  'Loan instalment',
  'Overpayment adjustment',
  'Fine',
  'Damage or loss recovery',
  'Notice period recovery',
  'Court order',
  'Other',
];

// Total deductions in a month are capped at 50% of the month's gross (Code on Wages s.18(2)).
const MAX_DEDUCTION_SHARE_OF_WAGES = 0.5;

/**
 * Fits one-time recoveries into the month under the 50% limit. They come after every
 * other deduction (PF, ESI, PT, LWF, TDS), so their room is half the month's gross minus
 * those, in whole rupees; oldest first, and whatever does not fit carries forward.
 */
const allocateOneTimeRecoveries = ({ outstanding, monthGross, otherDeductions }) => {
  let room = Math.max(0, Math.floor(monthGross * MAX_DEDUCTION_SHARE_OF_WAGES - otherDeductions));
  return outstanding.map((item) => {
    const appliedAmount = Math.min(item.outstanding, room);
    room -= appliedAmount;
    return {
      ...item,
      appliedAmount,
      carriedForward: Math.round((item.outstanding - appliedAmount) * 100) / 100,
    };
  });
};

module.exports = { ONE_TIME_DEDUCTION_TYPES, MAX_DEDUCTION_SHARE_OF_WAGES, allocateOneTimeRecoveries };
