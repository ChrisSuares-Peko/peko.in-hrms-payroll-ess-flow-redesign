const mockSift = require('sift').default;

// In-memory stand-ins for the Mongo models, evaluating the real query filters with sift
// (the matcher Mongoose itself uses) so the month-range logic is actually exercised.
// Single corporate/employee per test, so those two keys are dropped before matching.
const mockDb = { overrides: [], salaries: [], employee: null, compliance: null };

const mockStripScope = (filter) => {
  const rest = { ...filter };
  delete rest.corporateUser;
  delete rest.employee;
  return rest;
};
const mockSortDocs = (docs, sort) => {
  if (!sort) return docs;
  const keys = Object.entries(sort);
  return [...docs].sort((a, b) => {
    for (const [key, dir] of keys) {
      if (a[key] !== b[key]) return (a[key] - b[key]) * dir;
    }
    return 0;
  });
};
const mockQuery = (docs, single) => {
  const q = {
    sortSpec: null,
    select: () => q,
    sort: (s) => { q.sortSpec = s; return q; },
    lean: () => {
      const sorted = mockSortDocs(docs, q.sortSpec);
      return Promise.resolve(single ? (sorted[0] ?? null) : sorted);
    },
  };
  return q;
};
const mockSetPath = (obj, path, value) => {
  const parts = path.split('.');
  let cur = obj;
  parts.slice(0, -1).forEach((p) => { cur[p] = cur[p] || {}; cur = cur[p]; });
  cur[parts[parts.length - 1]] = value;
};

jest.mock('../../../entities/tdsOverride', () => ({
  findOne: jest.fn((filter) => mockQuery(mockDb.overrides.filter(mockSift(mockStripScope(filter))), true)),
  find: jest.fn((filter) => mockQuery(mockDb.overrides.filter(mockSift(mockStripScope(filter))), false)),
  findOneAndUpdate: jest.fn(async (filter, update) => {
    const existing = mockDb.overrides.find((o) => o.month === filter.month && o.year === filter.year);
    if (existing) Object.assign(existing, update.$set);
    else mockDb.overrides.push({ month: filter.month, year: filter.year, ...update.$set });
  }),
}));
jest.mock('../../../entities/salary', () => ({
  findOne: jest.fn((filter) => mockQuery(mockDb.salaries.filter(mockSift(mockStripScope(filter))), true)),
  find: jest.fn((filter) => mockQuery(mockDb.salaries.filter(mockSift(mockStripScope(filter))), false)),
  updateOne: jest.fn(async (filter, update) => {
    const doc = mockDb.salaries.filter(mockSift(mockStripScope(filter))).find((s) => s._id === filter._id);
    if (!doc) return;
    Object.entries(update.$set || {}).forEach(([k, v]) => mockSetPath(doc, k, v));
    Object.entries(update.$inc || {}).forEach(([k, v]) => { doc[k] = (doc[k] || 0) + v; });
  }),
}));
jest.mock('../../../entities/employee', () => ({ findOne: jest.fn(() => mockQuery([mockDb.employee].filter(Boolean), true)) }));
jest.mock('../../../entities/complianceSettings', () => ({ findOne: jest.fn(() => mockQuery([mockDb.compliance].filter(Boolean), true)) }));

const { setTdsOverride, resolveManualTds, getTdsOverrideInfo } = require('../../tdsOverride');

const CORP = 'corp-1';
const EMP = '64b000000000000000000001';
// tds doubles as the tax engine's own figure (taxInformation.tdsMonthly) for the record.
const salary = (month, year, tds, paymentStatus = 'UPCOMING', totalPayable = 100000) => ({
  _id: `${year}-${month}`, month, year, paymentStatus, totalPayable,
  salaryInformation: { tdsAmount: tds, taxInformation: { tdsMonthly: tds } },
});
const tdsFor = async (month, year) =>
  (await resolveManualTds({ corporateUserID: CORP, employeeId: EMP, month, year }))?.amount ?? null;
const set = (month, year, amount, applyToFutureMonths = true) =>
  setTdsOverride({ corporateUserID: CORP, employeeId: EMP, month, year, amount, applyToFutureMonths });

beforeEach(() => {
  mockDb.overrides = [];
  mockDb.salaries = [];
  mockDb.employee = { otherConfigurations: { tdsRegime: 'Old Tax Regime' } };
  mockDb.compliance = { tds: { taxRegime: 'New Tax Regime' } };
});

describe('TDS override — applies from its month until the next entry', () => {
  it('ticket example: ₹18,000 from Oct, ₹20,000 from Jan, then Nov edited to ₹19,000', async () => {
    await set(10, 2026, 18000);
    await set(1, 2027, 20000);

    expect(await tdsFor(9, 2026)).toBeNull(); // before any entry → engine figure stands
    expect(await tdsFor(10, 2026)).toBe(18000);
    expect(await tdsFor(11, 2026)).toBe(18000);
    expect(await tdsFor(12, 2026)).toBe(18000);
    expect(await tdsFor(1, 2027)).toBe(20000);
    expect(await tdsFor(6, 2027)).toBe(20000);

    await set(11, 2026, 19000);

    expect(await tdsFor(10, 2026)).toBe(18000);
    expect(await tdsFor(11, 2026)).toBe(19000);
    expect(await tdsFor(12, 2026)).toBe(19000);
    expect(await tdsFor(1, 2027)).toBe(20000); // January keeps its own entry
  });

  it('re-saving the same month replaces it rather than adding a second entry', async () => {
    await set(10, 2026, 18000);
    await set(10, 2026, 17500);
    expect(mockDb.overrides).toHaveLength(1);
    expect(await tdsFor(10, 2026)).toBe(17500);
  });

  it('rounds the entered amount to whole rupees', async () => {
    await set(10, 2026, 18000.6);
    expect(await tdsFor(10, 2026)).toBe(18001);
  });
});

describe('TDS override — Old Tax Regime only', () => {
  it('rejects a New Tax Regime employee and saves nothing', async () => {
    mockDb.employee = { otherConfigurations: { tdsRegime: 'New Tax Regime' } };
    const result = await set(10, 2026, 18000);
    expect(result.success).toBe(false);
    expect(mockDb.overrides).toHaveLength(0);
  });

  it("falls back to the company's regime when the employee has none set", async () => {
    mockDb.employee = { otherConfigurations: {} };
    mockDb.compliance = { tds: { taxRegime: 'Old Tax Regime' } };
    expect((await set(10, 2026, 18000)).success).toBe(true);
  });

  it('uses the Basic Information regime when otherConfigurations has none (employee set up before the sync)', async () => {
    mockDb.employee = { employeeInformation: { taxRegime: 'Old Tax Regime' }, otherConfigurations: {} };
    mockDb.compliance = { tds: { taxRegime: 'New Tax Regime' } };
    expect((await set(10, 2026, 18000)).success).toBe(true);
  });

  it('ignores existing entries once the employee is on the New Tax Regime', async () => {
    await set(10, 2026, 18000);
    mockDb.employee = { otherConfigurations: { tdsRegime: 'New Tax Regime' } };
    expect(await tdsFor(11, 2026)).toBeNull();
  });

  it('returns not-found for an unknown employee', async () => {
    mockDb.employee = null;
    expect(await set(10, 2026, 18000)).toEqual({ success: false, message: 'Employee not found' });
  });
});

describe('TDS override — syncing saved salary records', () => {
  it('rejects editing a month that is already approved or paid', async () => {
    mockDb.salaries = [salary(10, 2026, 5000, 'PAID')];
    const result = await set(10, 2026, 18000);
    expect(result.success).toBe(false);
    expect(mockDb.overrides).toHaveLength(0);
  });

  it('updates unlocked records from the month up to the next entry, adjusting take-home', async () => {
    await set(1, 2027, 20000); // later entry already exists
    mockDb.salaries = [
      salary(9, 2026, 4000),            // before → untouched
      salary(10, 2026, 4000, 'PENDING'),
      salary(11, 2026, 4000),
      salary(12, 2026, 4000),
      salary(1, 2027, 4000),            // governed by the January entry
    ];

    await set(10, 2026, 18000);

    const byKey = Object.fromEntries(mockDb.salaries.map((s) => [s._id, s]));
    expect(byKey['2026-9'].salaryInformation.tdsAmount).toBe(4000);
    ['2026-10', '2026-11', '2026-12'].forEach((key) => {
      expect(byKey[key].salaryInformation.tdsAmount).toBe(18000);
      expect(byKey[key].salaryInformation.tdsSource).toBe('MANUAL');
      expect(byKey[key].totalPayable).toBe(100000 - (18000 - 4000));
    });
    expect(byKey['2027-1'].salaryInformation.tdsAmount).toBe(20000); // its own entry, not October's
  });

  it('never touches an approved/paid record inside the range', async () => {
    mockDb.salaries = [salary(11, 2026, 4000, 'APPROVED')];
    await set(10, 2026, 18000);
    expect(mockDb.salaries[0].salaryInformation.tdsAmount).toBe(4000);
    expect(mockDb.salaries[0].totalPayable).toBe(100000);
  });
});

describe('getTdsOverrideInfo — Salary Structure tab lookup', () => {
  const info = (month, year) => getTdsOverrideInfo({ corporateUserID: CORP, employeeId: EMP, month, year });

  it('reports the amount in force and the month it applies from', async () => {
    await set(10, 2026, 18000);
    expect((await info(12, 2026)).data).toEqual({ isOldRegime: true, amount: 18000, effectiveFrom: { month: 10, year: 2026 }, applyToFutureMonths: true });
  });

  it('reports Old regime with no amount before anything is entered', async () => {
    expect((await info(10, 2026)).data).toEqual({ isOldRegime: true, amount: null, effectiveFrom: null, applyToFutureMonths: null });
  });

  it('reports New regime employees as not editable', async () => {
    mockDb.employee = { otherConfigurations: { tdsRegime: 'New Tax Regime' } };
    expect((await info(10, 2026)).data.isOldRegime).toBe(false);
  });
});

describe('TDS override — "this month only" (Apply for all future months unticked)', () => {
  it('overrides only that month; the next month keeps the earlier "all future months" amount', async () => {
    await set(10, 2026, 18000);
    await set(11, 2026, 19000, false);

    expect(await tdsFor(10, 2026)).toBe(18000);
    expect(await tdsFor(11, 2026)).toBe(19000);
    expect(await tdsFor(12, 2026)).toBe(18000);
  });

  it('with no earlier entry, later months fall back to the calculated TDS', async () => {
    mockDb.salaries = [salary(10, 2026, 4000), salary(11, 2026, 4000)];
    await set(10, 2026, 18000, false);

    expect(await tdsFor(11, 2026)).toBeNull();
    const [oct, nov] = mockDb.salaries;
    expect(oct.salaryInformation.tdsAmount).toBe(18000);
    expect(oct.totalPayable).toBe(100000 - 14000);
    expect(nov.salaryInformation.tdsAmount).toBe(4000);
    expect(nov.totalPayable).toBe(100000);
  });

  it('switching an "all future months" entry to this month only restores the later months', async () => {
    mockDb.salaries = [salary(10, 2026, 4000), salary(11, 2026, 4000), salary(12, 2026, 4000)];
    await set(10, 2026, 18000);
    expect(mockDb.salaries.map((x) => x.salaryInformation.tdsAmount)).toEqual([18000, 18000, 18000]);

    await set(10, 2026, 18000, false);

    expect(mockDb.salaries.map((x) => x.salaryInformation.tdsAmount)).toEqual([18000, 4000, 4000]);
    expect(mockDb.salaries.map((x) => x.salaryInformation.tdsSource)).toEqual(['MANUAL', 'CALCULATED', 'CALCULATED']);
    expect(mockDb.salaries.map((x) => x.totalPayable)).toEqual([86000, 100000, 100000]);
  });

  it('an "all future months" entry does not overwrite a later month that has its own one-off entry', async () => {
    await set(11, 2026, 19000, false);
    await set(10, 2026, 18000);
    expect(await tdsFor(11, 2026)).toBe(19000);
    expect(await tdsFor(12, 2026)).toBe(18000);
  });
});
