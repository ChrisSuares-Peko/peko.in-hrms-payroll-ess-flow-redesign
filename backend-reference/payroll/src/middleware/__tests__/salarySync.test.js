const Employee = require('../../models/entities/employee');
const Bonus = require('../../models/entities/bonus');
const { markSalaryStale } = require('../../services/salaryStaleMarker');
const { ensureCurrentMonthSalaryRecords } = require('../../services/salarySync');
const { syncSalaryForCorporateWrites, syncSalaryForEmployeeWrites } = require('../salarySync');

jest.mock('../../models/entities/employee');
jest.mock('../../models/entities/bonus');
jest.mock('../../models/entities/incentives');
jest.mock('../../models/entities/overTime');
jest.mock('../../models/entities/reimbursement');
jest.mock('../../models/entities/deductions');
jest.mock('../../models/entities/leaveApplication');
jest.mock('../../models/entities/increment');
jest.mock('../../models/entities/attendanceDispute');
jest.mock('../../services/salaryStaleMarker', () => ({ markSalaryStale: jest.fn().mockResolvedValue(1) }));
jest.mock('../../services/salarySync', () => ({ ensureCurrentMonthSalaryRecords: jest.fn() }));

const EMPLOYEE_ID = 'a'.repeat(24);
const BONUS_ID = 'b'.repeat(24);
const lean = (value) => ({ select: () => ({ lean: () => Promise.resolve(value) }) });

const request = (method, path, body = {}) => ({ method, path, baseUrl: '/api/v1/corporate/x/payroll', body, user: { _id: 'corp-1' } });

// Runs the middleware, then a handler that responds with `status`/`body`; resolves once
// the response has actually been sent, reporting whether marking happened first.
const runWrite = (middleware, req, { status = 200, body = { status: true } } = {}) => new Promise((resolve) => {
  const events = [];
  markSalaryStale.mockImplementation(async (args) => { events.push(['mark', args]); return 1; });
  const res = {
    statusCode: status,
    json: (payload) => { events.push(['sent', payload]); resolve(events); return res; },
  };
  middleware(req, res, () => res.json(body));
});

describe('salary sync write guard', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    Employee.exists.mockResolvedValue(null);
  });

  it('marks the employee from the URL on a bonus create — before the response is sent', async () => {
    Employee.exists.mockImplementation(async ({ _id }) => (_id === EMPLOYEE_ID ? { _id } : null));
    const events = await runWrite(syncSalaryForCorporateWrites, request('POST', `/bonus/${EMPLOYEE_ID}`));
    expect(events.map(e => e[0])).toEqual(['mark', 'sent']);
    expect(events[0][1]).toMatchObject({ corporateUserID: 'corp-1', employeeIds: [EMPLOYEE_ID] });
  });

  it('resolves the employee from the bonus document on edit/delete', async () => {
    Bonus.findOne.mockReturnValue(lean({ employee: EMPLOYEE_ID }));
    const events = await runWrite(syncSalaryForCorporateWrites, request('DELETE', `/bonus/${BONUS_ID}`));
    expect(Bonus.findOne).toHaveBeenCalledWith({ _id: BONUS_ID, corporateUser: 'corp-1' });
    expect(events[0][1]).toMatchObject({ employeeIds: [EMPLOYEE_ID] });
  });

  it('falls back to the whole payroll when the employee cannot be identified', async () => {
    Bonus.findOne.mockReturnValue(lean(null));
    const events = await runWrite(syncSalaryForCorporateWrites, request('PUT', `/bonus/${BONUS_ID}`));
    expect(events[0][1]).not.toHaveProperty('employeeIds');
  });

  it('marks everyone for payroll-wide settings', async () => {
    const events = await runWrite(syncSalaryForCorporateWrites, request('POST', '/compliance-settings/tds'));
    expect(events[0][1]).toMatchObject({ corporateUserID: 'corp-1' });
    expect(events[0][1]).not.toHaveProperty('employeeIds');
  });

  it('still marks when the handler saved the input but answered with an error', async () => {
    // e.g. reimbursement persisted, then the notification email failed → 201 + error body
    Employee.exists.mockImplementation(async ({ _id }) => (_id === EMPLOYEE_ID ? { _id } : null));
    const events = await runWrite(syncSalaryForCorporateWrites, request('POST', `/reimbursement/${EMPLOYEE_ID}`), { status: 201, body: { status: false, message: 'connect ECONNREFUSED' } });
    expect(events.map(e => e[0])).toEqual(['mark', 'sent']);
    expect(events[0][1]).toMatchObject({ employeeIds: [EMPLOYEE_ID] });
  });

  it('does not mark for read-only POSTs', async () => {
    await runWrite(syncSalaryForCorporateWrites, request('POST', '/salary/check-salary-details'));
    expect(markSalaryStale).not.toHaveBeenCalled();
  });

  it('ignores GETs and resources that are not salary inputs', async () => {
    const next = jest.fn();
    await syncSalaryForCorporateWrites(request('GET', '/bonus'), {}, next);
    await syncSalaryForCorporateWrites(request('POST', '/announcement'), {}, next);
    expect(next).toHaveBeenCalledTimes(2);
    expect(markSalaryStale).not.toHaveBeenCalled();
  });

  it('generates the current month for a newly created employee', async () => {
    await runWrite(syncSalaryForCorporateWrites, request('POST', '/employee/new-hire', { fullName: 'x' }));
    expect(ensureCurrentMonthSalaryRecords).toHaveBeenCalledWith('corp-1');
    expect(markSalaryStale).not.toHaveBeenCalled();
  });

  it('marks the signed-in employee on ESS leave / overtime / reimbursement writes', async () => {
    Employee.findById.mockReturnValue(lean({ _id: EMPLOYEE_ID, corporateUser: 'corp-1' }));
    const req = { method: 'POST', path: '/leave-applications', baseUrl: '/api/v1/user/x/payroll', body: {}, user: { _id: EMPLOYEE_ID } };
    const events = await runWrite(syncSalaryForEmployeeWrites, req);
    expect(events[0][1]).toMatchObject({ corporateUserID: 'corp-1', employeeIds: [EMPLOYEE_ID] });
  });
});
