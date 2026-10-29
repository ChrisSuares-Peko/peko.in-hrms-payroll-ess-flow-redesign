const Salary = require('../../models/entities/salary');
const { processEmpSalary } = require('../salary');
const { fetchEmployeeIdsForGenerateSalary } = require('../../models/use-cases/employee');
const { ensureEpfEnabledWhenMandatory } = require('../../models/use-cases/complianceSettings');
const { ensureSalaryRecords } = require('../salarySync');
const { markSalaryStale } = require('../salaryStaleMarker');

jest.mock('../../models/entities/salary');
jest.mock('../salary', () => ({
  processEmpSalary: jest.fn(),
  calculateEmpSalaryCycleBasedOnMonth: jest.fn(),
  SALARY_CALC_ENGINE_VERSION: 2,
}));
jest.mock('../../models/use-cases/salary', () => ({
  getSalaryCycleDay: jest.fn(),
  calculateWorkingDays: jest.fn(),
}));
jest.mock('../../models/use-cases/employee', () => ({
  fetchEmployeeIdsForGenerateSalary: jest.fn(),
}));
jest.mock('../../models/use-cases/complianceSettings', () => ({
  ensureEpfEnabledWhenMandatory: jest.fn(),
}));
jest.mock('../../models/use-cases/ctcCalculator', () => ({
  // Oct 1 – Mar 31 period for the fixed "now" below.
  getContributionPeriodBounds: () => ({ start: new Date('2026-10-01T00:00:00Z'), end: new Date('2027-03-31T23:59:59Z') }),
}));

const NOW = new Date('2026-11-15T10:00:00Z');
const CYCLE = { cycleStart: new Date('2026-11-01T00:00:00Z'), cycleEnd: new Date('2026-11-30T23:59:59Z') };
const PARAMS = { corporateUserID: 'corp-1', month: 11, year: 2026, ...CYCLE, payrollStartsFrom: null, salaryCycleDay: 1 };

const findQuery = (rows) => ({ select: () => ({ lean: () => Promise.resolve(rows) }) });

const freshRow = (employee, overrides = {}) => ({
  employee,
  paymentStatus: 'PENDING',
  staleVersion: 2,
  calculatedVersion: 2,
  calcEngineVersion: 2,
  calculatedAt: new Date('2026-11-15T09:00:00Z'),
  salaryCycleEnd: CYCLE.cycleEnd,
  ...overrides,
});

describe('ensureSalaryRecords — recalculates only missing / stale employees', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers({ now: NOW, doNotFake: ['setImmediate', 'nextTick'] });
    jest.spyOn(console, 'log').mockImplementation(() => {});
    delete process.env.SALARY_SYNC_MODE;
    processEmpSalary.mockResolvedValue({ status: true, message: 'Success' });
    ensureEpfEnabledWhenMandatory.mockResolvedValue(false);
  });

  afterEach(() => jest.useRealTimers());

  const run = async (employeeIds, rows, extra = {}) => {
    fetchEmployeeIdsForGenerateSalary.mockResolvedValue(employeeIds);
    Salary.find.mockReturnValue(findQuery(rows));
    return ensureSalaryRecords({ ...PARAMS, ...extra });
  };

  it('does not recalculate anyone when every row is fresh', async () => {
    const result = await run(['e1', 'e2'], [freshRow('e1'), freshRow('e2')]);
    expect(result).toEqual({ status: true, message: 'Success' });
    expect(processEmpSalary).not.toHaveBeenCalled();
  });

  it('recalculates only the employees without a row or with a stale row', async () => {
    await run(['e1', 'e2', 'e3'], [freshRow('e1'), freshRow('e2', { staleVersion: 3 })]);
    expect(processEmpSalary).toHaveBeenCalledTimes(1);
    expect(processEmpSalary.mock.calls[0][0].employeeIds).toEqual(['e2', 'e3']);
    expect(processEmpSalary.mock.calls[0][0]).toMatchObject({ corporateUserID: 'corp-1', month: 11, year: 2026, ...CYCLE });
  });

  it('treats a row that never settled (calculatedVersion null) as stale', async () => {
    await run(['e1'], [freshRow('e1', { calculatedVersion: null })]);
    expect(processEmpSalary.mock.calls[0][0].employeeIds).toEqual(['e1']);
  });

  it('never recalculates PAID / APPROVED / COMPLETED rows', async () => {
    await run(['e1', 'e2', 'e3'], [
      freshRow('e1', { paymentStatus: 'PAID', calculatedVersion: null }),
      freshRow('e2', { paymentStatus: 'APPROVED', staleVersion: 9 }),
      freshRow('e3', { paymentStatus: 'COMPLETED' }),
    ]);
    expect(processEmpSalary).not.toHaveBeenCalled();
  });

  it('keeps recalculating INITIATED / FAILD rows on every read, as before', async () => {
    await run(['e1', 'e2'], [freshRow('e1', { paymentStatus: 'INITIATED' }), freshRow('e2', { paymentStatus: 'FAILD' })]);
    expect(processEmpSalary.mock.calls[0][0].employeeIds).toEqual(['e1', 'e2']);
  });

  it('recalculates an UPCOMING row once its cycle has ended (flips to PENDING)', async () => {
    await run(['e1', 'e2'], [
      freshRow('e1', { paymentStatus: 'UPCOMING', salaryCycleEnd: new Date('2026-11-14T23:59:59Z') }),
      freshRow('e2', { paymentStatus: 'UPCOMING' }),
    ]);
    expect(processEmpSalary.mock.calls[0][0].employeeIds).toEqual(['e1']);
  });

  it('recalculates a row calculated in a previous ESI contribution period', async () => {
    await run(['e1'], [freshRow('e1', { calculatedAt: new Date('2026-09-30T12:00:00Z') })]);
    expect(processEmpSalary.mock.calls[0][0].employeeIds).toEqual(['e1']);
  });

  it('recalculates a row produced by an older version of the calculation rules', async () => {
    await run(['e1', 'e2'], [freshRow('e1', { calcEngineVersion: 1 }), freshRow('e2', { calcEngineVersion: undefined })]);
    expect(processEmpSalary.mock.calls[0][0].employeeIds).toEqual(['e1', 'e2']);
  });

  it('recalculates a row older than the max age safety net', async () => {
    await run(['e1'], [freshRow('e1', { calculatedAt: new Date('2026-11-14T09:00:00Z') })]);
    expect(processEmpSalary.mock.calls[0][0].employeeIds).toEqual(['e1']);
  });

  it('only refreshes existing rows when createMissing is false (background runs)', async () => {
    await run(['e1', 'e2'], [freshRow('e1', { staleVersion: 5 })], { createMissing: false });
    expect(processEmpSalary.mock.calls[0][0].employeeIds).toEqual(['e1']);
  });

  it('runs the full recalculation when forced or in legacy mode', async () => {
    await run(['e1'], [freshRow('e1')], { force: true });
    expect(processEmpSalary).toHaveBeenLastCalledWith(expect.not.objectContaining({ employeeIds: expect.anything() }));

    process.env.SALARY_SYNC_MODE = 'legacy';
    await run(['e1'], [freshRow('e1')]);
    expect(processEmpSalary).toHaveBeenCalledTimes(2);
    expect(fetchEmployeeIdsForGenerateSalary).toHaveBeenCalledTimes(0);
  });

  it('still runs the EPF headcount safety net on every read', async () => {
    await run(['e1'], [freshRow('e1')]);
    expect(ensureEpfEnabledWhenMandatory).toHaveBeenCalledWith('corp-1');
  });

  it('propagates a failed recalculation as status false', async () => {
    processEmpSalary.mockResolvedValue({ status: false, message: 'boom' });
    const result = await run(['e1'], []);
    expect(result).toEqual({ status: false, message: 'boom' });
  });
});

describe('markSalaryStale', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    process.env.SALARY_SYNC_MODE = 'legacy'; // no background timer in these tests
  });
  afterAll(() => { delete process.env.SALARY_SYNC_MODE; });

  it('bumps staleVersion on the unpaid rows of the given employees', async () => {
    Salary.updateMany.mockResolvedValue({ modifiedCount: 2 });
    await expect(markSalaryStale({ corporateUserID: 'corp-1', employeeIds: ['e1'], reason: 'bonus' })).resolves.toBe(2);
    expect(Salary.updateMany).toHaveBeenCalledWith(
      { corporateUser: 'corp-1', paymentStatus: { $nin: ['PAID', 'APPROVED', 'COMPLETED'] }, employee: { $in: ['e1'] } },
      { $inc: { staleVersion: 1 }, $set: { staleAt: expect.any(Date), staleReason: 'bonus' } }
    );
  });

  it('marks the whole payroll when no employees are given', async () => {
    Salary.updateMany.mockResolvedValue({ modifiedCount: 10 });
    await markSalaryStale({ corporateUserID: 'corp-1', reason: 'compliance' });
    expect(Salary.updateMany.mock.calls[0][0]).not.toHaveProperty('employee');
  });

  it('does nothing for an empty employee list', async () => {
    await expect(markSalaryStale({ corporateUserID: 'corp-1', employeeIds: [] })).resolves.toBe(0);
    expect(Salary.updateMany).not.toHaveBeenCalled();
  });

  it('never throws — the source write already succeeded', async () => {
    jest.spyOn(console, 'error').mockImplementation(() => {});
    Salary.updateMany.mockRejectedValue(new Error('db down'));
    await expect(markSalaryStale({ corporateUserID: 'corp-1', reason: 'x' })).resolves.toBe(0);
  });
});
