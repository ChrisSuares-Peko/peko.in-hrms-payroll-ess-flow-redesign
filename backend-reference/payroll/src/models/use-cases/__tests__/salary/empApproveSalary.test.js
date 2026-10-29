const { empApproveSalary } = require('../../../use-cases/salary');
const Salary = require('../../../entities/salary');
const Incentives = require('../../../entities/incentives');
const Bonus = require('../../../entities/bonus');
const Reimbursement = require('../../../entities/reimbursement');
const Overtime = require('../../../entities/overTime');
const { markArrearsAsPaid } = require('../../../use-cases/reviseSalary');

jest.mock('../../../entities/salary');
jest.mock('../../../entities/incentives');
jest.mock('../../../entities/bonus');
jest.mock('../../../entities/reimbursement');
jest.mock('../../../entities/overTime');
jest.mock('../../../use-cases/reviseSalary');

describe('empApproveSalary', () => {
    beforeEach(() => {
        jest.clearAllMocks();
        Incentives.updateMany.mockResolvedValue({});
        Bonus.updateMany.mockResolvedValue({});
        Reimbursement.updateMany.mockResolvedValue({});
        Overtime.updateMany.mockResolvedValue({});
        markArrearsAsPaid.mockResolvedValue();
    });

    it('approves only the still-PENDING docs for a month that has 10 PAID employees alongside 1 late-added PENDING employee, without touching the PAID ones', async () => {
        // "Today" is well after the target month, matching a real HR user running payroll
        // for January from August — must not trip the isUpcomingMonth guard.
        jest.useFakeTimers().setSystemTime(new Date('2026-08-29'));

        const pendingDoc = { _id: 'pendingSalaryId', arrears: [] };
        Salary.find.mockImplementation((query) => {
            if (query.paymentStatus === 'PENDING') {
                return Promise.resolve([pendingDoc]);
            }
            if (query._id && query._id.$in) {
                return Promise.resolve([pendingDoc]);
            }
            return Promise.resolve([]);
        });
        Salary.updateMany.mockResolvedValue({});

        const result = await empApproveSalary({
            payingDate: '2026-08-29',
            paymentStatus: 'APPROVED',
            corporateUserID: 'corp1',
            month: 1,
            year: 2026,
        });

        expect(result).toEqual({ success: true, message: 'Salary & related payments approved successfully' });
        expect(Salary.find).toHaveBeenCalledWith({
            corporateUser: 'corp1', month: 1, year: 2026, paymentStatus: 'PENDING'
        });
        expect(Salary.updateMany).toHaveBeenCalledWith(
            { _id: { $in: ['pendingSalaryId'] } },
            { payingDate: '2026-08-29', paymentStatus: 'APPROVED' }
        );

        jest.useRealTimers();
    });

    it('reports alreadyPaid without calling updateMany when nothing is PENDING for the month', async () => {
        jest.useFakeTimers().setSystemTime(new Date('2026-08-29'));
        Salary.find.mockResolvedValue([]);

        const result = await empApproveSalary({
            payingDate: '2026-08-29',
            paymentStatus: 'APPROVED',
            corporateUserID: 'corp1',
            month: 1,
            year: 2026,
        });

        expect(result).toEqual({ success: true, alreadyPaid: true, message: 'Salaries for this month and year are already paid.' });
        expect(Salary.updateMany).not.toHaveBeenCalled();

        jest.useRealTimers();
    });

    it('refuses to approve a month that has not started yet', async () => {
        jest.useFakeTimers().setSystemTime(new Date('2026-01-01'));
        Salary.find.mockResolvedValue([{ _id: 'x' }]);

        const result = await empApproveSalary({
            payingDate: '2026-08-29',
            paymentStatus: 'APPROVED',
            corporateUserID: 'corp1',
            month: 8,
            year: 2026,
        });

        expect(result).toEqual({ success: false, message: 'You cannot approve upcoming months salaries.' });
        expect(Salary.updateMany).not.toHaveBeenCalled();

        jest.useRealTimers();
    });
});
