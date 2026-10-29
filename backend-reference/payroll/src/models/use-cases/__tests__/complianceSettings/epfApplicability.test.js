const ComplianceSettings = require('../../../entities/complianceSettings');
const Employee = require('../../../entities/employee');
const Salary = require('../../../entities/salary');
const DeductionComponent = require('../../../entities/deductionComponent');
const { ensureEpfEnabledWhenMandatory, setEpfApplicability } = require('../../complianceSettings');

jest.mock('../../../entities/complianceSettings');
jest.mock('../../../entities/employee');
jest.mock('../../../entities/salary');
jest.mock('../../../entities/deductionComponent');

// Chainable stand-ins for mongoose queries (.select().lean(), .sort().select().lean()).
const query = (result) => {
  const q = { select: () => q, sort: () => q, lean: () => Promise.resolve(result), then: (r, j) => Promise.resolve(result).then(r, j) };
  return q;
};

const settingsDoc = (epf) => ({ epf: { ...epf }, save: jest.fn().mockResolvedValue(undefined) });

describe('EPF applicability — mandatory at 20 employees', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.spyOn(console, 'error').mockImplementation(() => {});
    // Latest paid payroll: August 2026 → a flip takes effect from September 2026.
    Salary.findOne.mockReturnValue(query({ year: 2026, month: 8 }));
    DeductionComponent.findOneAndUpdate.mockResolvedValue({});
  });

  it('does nothing while EPF is already on', async () => {
    ComplianceSettings.findOne.mockReturnValue(query({ epf: { isApplicable: true } }));
    await expect(ensureEpfEnabledWhenMandatory('corp-1')).resolves.toBe(false);
    expect(Employee.countDocuments).not.toHaveBeenCalled();
  });

  it('leaves EPF off below 20 active employees', async () => {
    ComplianceSettings.findOne.mockReturnValue(query({ epf: { isApplicable: false } }));
    Employee.countDocuments.mockResolvedValue(19);
    await expect(ensureEpfEnabledWhenMandatory('corp-1')).resolves.toBe(false);
  });

  it('switches EPF back on from the next unpaid month once headcount reaches 20', async () => {
    const doc = settingsDoc({ isApplicable: false, applicabilityHistory: [] });
    ComplianceSettings.findOne
      .mockReturnValueOnce(query({ epf: { isApplicable: false } })) // ensure… precheck
      .mockReturnValueOnce(doc) // setEpfApplicability load
      .mockReturnValue(query({ epf: { isApplicable: true } })); // context read-back
    Employee.countDocuments.mockResolvedValue(20);

    await expect(ensureEpfEnabledWhenMandatory('corp-1')).resolves.toBe(true);
    expect(doc.epf.isApplicable).toBe(true);
    expect(doc.epf.applicabilityHistory[0]).toMatchObject({
      isApplicable: true,
      effectiveMonth: 9,
      effectiveYear: 2026,
      changedBy: 'SYSTEM',
    });
    expect(doc.save).toHaveBeenCalled();
  });

  it('counts pending new hires (except rejected offers) toward the 20', async () => {
    ComplianceSettings.findOne.mockReturnValue(query({ epf: { isApplicable: false } }));
    Employee.countDocuments.mockResolvedValue(19);
    await ensureEpfEnabledWhenMandatory('corp-1');
    const { $or } = Employee.countDocuments.mock.calls[0][0];
    expect($or).toContainEqual({ 'employeeInformation.employeeStatus': 'NEW_HIRE', 'offerLetter.status': { $ne: 'REJECTED' } });
  });

  it('never throws — a failure must not block hiring or a payroll run', async () => {
    ComplianceSettings.findOne.mockImplementation(() => {
      throw new Error('db down');
    });
    await expect(ensureEpfEnabledWhenMandatory('corp-1')).resolves.toBe(false);
  });

  it('refuses a manual switch-off at 20 or more active employees', async () => {
    ComplianceSettings.findOne.mockReturnValue(settingsDoc({ isApplicable: true }));
    Employee.countDocuments.mockResolvedValue(20);
    await expect(setEpfApplicability('corp-1', { isApplicable: false })).rejects.toThrow(/mandatory/);
  });
});
