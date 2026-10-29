const { allocateOneTimeRecoveries, ONE_TIME_DEDUCTION_TYPES } = require('../oneTimeDeductionTypes');
const { validateDeductionDirect, validateOneTimeDeductionUpdate } = require('../apiValidation');

const item = (outstanding, extra = {}) => ({ outstanding, deductionAmount: outstanding, ...extra });

describe('allocateOneTimeRecoveries', () => {
  it('takes a recovery that fits in full (Suresh: ₹3,000 salary advance)', () => {
    const [applied] = allocateOneTimeRecoveries({
      outstanding: [item(3000)],
      monthGross: 52500,
      otherDeductions: 3150 + 200 + 2103,
    });
    expect(applied.appliedAmount).toBe(3000);
    expect(applied.carriedForward).toBe(0);
  });

  it('caps total deductions at 50% of gross and carries the rest (Pooja: ₹30,000 loan on ₹45,000)', () => {
    const [applied] = allocateOneTimeRecoveries({
      outstanding: [item(30000)],
      monthGross: 45000,
      otherDeductions: 2700 + 200,
    });
    expect(applied.appliedAmount).toBe(19600);
    expect(applied.carriedForward).toBe(10400);
    expect(applied.appliedAmount + 2900).toBe(22500);
  });

  it('keeps whole rupees when half the gross has paise', () => {
    const [applied] = allocateOneTimeRecoveries({
      outstanding: [item(30000)],
      monthGross: 42096.77,
      otherDeductions: 2726,
    });
    expect(applied.appliedAmount).toBe(18322);
    expect(Number.isInteger(applied.appliedAmount)).toBe(true);
  });

  it('fills oldest first and carries everything once the room is used up', () => {
    const result = allocateOneTimeRecoveries({
      outstanding: [item(5000, { id: 'carried' }), item(8000, { id: 'new' })],
      monthGross: 20000,
      otherDeductions: 2000,
    });
    expect(result.map(r => r.appliedAmount)).toEqual([5000, 3000]);
    expect(result[1].carriedForward).toBe(5000);
  });

  it('applies nothing when other deductions already exceed the limit', () => {
    const [applied] = allocateOneTimeRecoveries({ outstanding: [item(500)], monthGross: 10000, otherDeductions: 6000 });
    expect(applied.appliedAmount).toBe(0);
    expect(applied.carriedForward).toBe(500);
  });
});

const runValidator = (validator, body) => {
  const req = { body };
  let error;
  validator(req, {}, (err) => { error = err; });
  return { error, body: req.body };
};

describe('one-time deduction validation', () => {
  const valid = { deductionFor: 'Fine', note: 'Late submission of timesheet', amount: 500, month: 10, year: 2026 };

  it('accepts a typed deduction with a note', () => {
    expect(runValidator(validateDeductionDirect, valid).error).toBeUndefined();
  });

  it('lists all eight types', () => {
    expect(ONE_TIME_DEDUCTION_TYPES).toHaveLength(8);
  });

  it('refuses "Other" without a note', () => {
    const { error } = runValidator(validateDeductionDirect, { ...valid, deductionFor: 'Other', note: '' });
    expect(error.message).toBe('Add a note when the deduction is for "Other"');
  });

  it('refuses ₹0', () => {
    const { error } = runValidator(validateDeductionDirect, { ...valid, amount: 0 });
    expect(error.message).toBe('Amount must be more than ₹0');
  });

  it('refuses paise', () => {
    const { error } = runValidator(validateDeductionDirect, { ...valid, amount: 499.5 });
    expect(error.message).toBe('Amount must be in whole rupees');
  });

  it('refuses a free-text type', () => {
    const { error } = runValidator(validateDeductionDirect, { ...valid, deductionFor: 'Canteen' });
    expect(error.message).toBe('Choose what the deduction is for from the list');
  });

  it('edit takes the same fields without a month', () => {
    const edit = { deductionFor: valid.deductionFor, note: valid.note, amount: valid.amount };
    expect(runValidator(validateOneTimeDeductionUpdate, edit).error).toBeUndefined();
  });
});
