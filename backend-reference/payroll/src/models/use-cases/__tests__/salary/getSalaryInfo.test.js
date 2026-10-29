const { getSalaryInfo } = require('../../../use-cases/salary'); // Adjust the path accordingly
const HrSettings = require('../../../entities/hrSettings'); // Adjust the path accordingly
const Salary = require('../../../entities/salary'); // Adjust the path accordingly

jest.mock('../../../entities/hrSettings');
jest.mock('../../../entities/salary');

describe('getSalaryInfo', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('should return salary info for valid inputs', async () => {
        const corporateUserID = 'validCorporateUserId';
        const month = 1;
        const year = 2023;
        const cycleStart = new Date('2023-01-01');
        const cycleEnd = new Date('2023-01-31');

        const mockPayrollDetails = {
            payrollSettings: {
                organizationWorkingDays: 20,
                payrollStartsFrom: '01',
                salaryCycleDay: 1
            }
        };

        const mockSalaryCount = 10;
        const mockExistingSalary = {
            paymentStatus: 'PAID',
            payingDate: '2023-01-25'
        };

        const mockSalaryAggregate = [
            {
                totalOtherDeduction: 1000,
                totalPayable: 50000
            }
        ];

        HrSettings.findOne.mockReturnValue({
            select: jest.fn().mockResolvedValue(mockPayrollDetails)
        });
        Salary.countDocuments.mockResolvedValue(mockSalaryCount);
        Salary.find.mockReturnValue({
            select: jest.fn().mockReturnValue({
                lean: jest.fn().mockResolvedValue([mockExistingSalary])
            })
        });
        Salary.aggregate.mockResolvedValue(mockSalaryAggregate);

        const result = await getSalaryInfo(corporateUserID, month, year, cycleStart, cycleEnd);

        expect(HrSettings.findOne).toHaveBeenCalledWith({ corporateUser: corporateUserID });
        expect(Salary.countDocuments).toHaveBeenCalledWith({ corporateUser: corporateUserID, salaryCycleStart: cycleStart, salaryCycleEnd: cycleEnd });
        expect(Salary.find).toHaveBeenCalledWith({ corporateUser: corporateUserID, month: month, year: year });
        expect(Salary.aggregate).toHaveBeenCalledWith([
            {
                $match: {
                    year: year,
                    month: month,
                    corporateUser: corporateUserID
                }
            },
            {
                $group: {
                    _id: null,
                    totalOtherDeduction: {
                        $sum: { $add: ["$totalOtherDeduction", "$leaveDeduction"] }
                    },
                    totalPayable: {
                        $sum: "$totalPayable"
                    }
                }
            }
        ]);

        expect(result).toEqual({
            organizationWorkingDays: 20,
            payrollStartsFrom: '01',
            month: 1,
            noOfEmployees: 10,
            totalEmployeesInMonth: 1,
            totalDeduction: 1000,
            totalPayable: 50000,
            paymentStatus: 'PAID',
            payingDate: '2023-01-25',
            outstandingStatus: null
        });
    });

    it('should return default values if no payroll details found', async () => {
        const corporateUserID = 'validCorporateUserId';
        const month = 1;
        const year = 2023;
        const cycleStart = new Date('2023-01-01');
        const cycleEnd = new Date('2023-01-31');

        const mockSalaryCount = 10;
        const mockExistingSalary = {
            paymentStatus: 'PAID',
            payingDate: '2023-01-25'
        };

        const mockSalaryAggregate = [
            {
                totalOtherDeduction: 1000,
                totalPayable: 50000
            }
        ];

        HrSettings.findOne.mockReturnValue({
            select: jest.fn().mockResolvedValue(null)
        });
        Salary.countDocuments.mockResolvedValue(mockSalaryCount);
        Salary.find.mockReturnValue({
            select: jest.fn().mockReturnValue({
                lean: jest.fn().mockResolvedValue([mockExistingSalary])
            })
        });
        Salary.aggregate.mockResolvedValue(mockSalaryAggregate);

        const result = await getSalaryInfo(corporateUserID, month, year, cycleStart, cycleEnd);

        expect(result).toEqual({
            organizationWorkingDays: 0,
            payrollStartsFrom: '',
            month: 1,
            noOfEmployees: 10,
            totalEmployeesInMonth: 1,
            totalDeduction: 1000,
            totalPayable: 50000,
            paymentStatus: 'PAID',
            payingDate: '2023-01-25',
            outstandingStatus: null
        });
    });

    it('should report plain PENDING (not PARTIALLY_PAID) for a brand-new month where every salary is still pending', async () => {
        const corporateUserID = 'validCorporateUserId';
        const month = 1;
        const year = 2023;
        const cycleStart = new Date('2023-01-01');
        const cycleEnd = new Date('2023-01-31');

        const allPendingDocs = [
            { paymentStatus: 'PENDING', payingDate: null },
            { paymentStatus: 'PENDING', payingDate: null },
        ];

        HrSettings.findOne.mockReturnValue({
            select: jest.fn().mockResolvedValue({
                payrollSettings: { organizationWorkingDays: 20, payrollStartsFrom: '01', salaryCycleDay: 1 }
            })
        });
        Salary.find.mockReturnValue({
            select: jest.fn().mockReturnValue({
                lean: jest.fn().mockResolvedValue(allPendingDocs)
            })
        });
        Salary.aggregate.mockResolvedValue([{ totalOtherDeduction: 0, totalPayable: 0 }]);

        const result = await getSalaryInfo(corporateUserID, month, year, cycleStart, cycleEnd);

        expect(result.paymentStatus).toBe('PENDING');
        expect(result.outstandingStatus).toBe('PENDING');
        expect(result.noOfEmployees).toBe(2);
        expect(result.totalEmployeesInMonth).toBe(2);
        expect(Salary.countDocuments).not.toHaveBeenCalled();
    });

    it('should report PENDING and sum only the pending employees when the month has a mix of PAID and PENDING salaries (late-added employee back-filled into an already-paid month)', async () => {
        const corporateUserID = 'validCorporateUserId';
        const month = 1;
        const year = 2023;
        const cycleStart = new Date('2023-01-01');
        const cycleEnd = new Date('2023-01-31');

        const mixedSalaryDocs = [
            { paymentStatus: 'PAID', payingDate: '2023-01-25' },
            { paymentStatus: 'PENDING', payingDate: null },
        ];
        const mockSalaryAggregate = [
            { totalOtherDeduction: 100, totalPayable: 40000 }
        ];

        HrSettings.findOne.mockReturnValue({
            select: jest.fn().mockResolvedValue({
                payrollSettings: { organizationWorkingDays: 20, payrollStartsFrom: '01', salaryCycleDay: 1 }
            })
        });
        Salary.find.mockReturnValue({
            select: jest.fn().mockReturnValue({
                lean: jest.fn().mockResolvedValue(mixedSalaryDocs)
            })
        });
        Salary.aggregate.mockResolvedValue(mockSalaryAggregate);

        const result = await getSalaryInfo(corporateUserID, month, year, cycleStart, cycleEnd);

        // The one still-PENDING employee, not the org-wide count/total for the month.
        expect(result.noOfEmployees).toBe(1);
        expect(result.totalEmployeesInMonth).toBe(2);
        expect(result.paymentStatus).toBe('PARTIALLY_PAID');
        expect(result.outstandingStatus).toBe('PENDING');
        expect(result.totalPayable).toBe(40000);
        expect(result.totalDeduction).toBe(100);
        expect(Salary.countDocuments).not.toHaveBeenCalled();
        expect(Salary.aggregate).toHaveBeenCalledWith([
            {
                $match: {
                    year,
                    month,
                    corporateUser: corporateUserID,
                    paymentStatus: 'PENDING'
                }
            },
            {
                $group: {
                    _id: null,
                    totalOtherDeduction: {
                        $sum: { $add: ["$totalOtherDeduction", "$leaveDeduction"] }
                    },
                    totalPayable: {
                        $sum: "$totalPayable"
                    }
                }
            }
        ]);
    });

    it('should report plain PENDING (not PARTIALLY_PAID) when some salaries are Approved and some are Pending but none are Paid yet', async () => {
        const corporateUserID = 'validCorporateUserId';
        const month = 1;
        const year = 2023;
        const cycleStart = new Date('2023-01-01');
        const cycleEnd = new Date('2023-01-31');

        const approvedPlusPendingDocs = [
            { paymentStatus: 'APPROVED', payingDate: null },
            { paymentStatus: 'APPROVED', payingDate: null },
            { paymentStatus: 'PENDING', payingDate: null },
        ];
        const mockSalaryAggregate = [
            { totalOtherDeduction: 50, totalPayable: 25000 }
        ];

        HrSettings.findOne.mockReturnValue({
            select: jest.fn().mockResolvedValue({
                payrollSettings: { organizationWorkingDays: 20, payrollStartsFrom: '01', salaryCycleDay: 1 }
            })
        });
        Salary.find.mockReturnValue({
            select: jest.fn().mockReturnValue({
                lean: jest.fn().mockResolvedValue(approvedPlusPendingDocs)
            })
        });
        Salary.aggregate.mockResolvedValue(mockSalaryAggregate);

        const result = await getSalaryInfo(corporateUserID, month, year, cycleStart, cycleEnd);

        // No money has moved yet for anyone this month — safe to treat as an ordinary
        // PENDING month, so "Run Payroll" can just approve the straggler(s) directly
        // instead of requiring the explicit Mark-as-Paid review PARTIALLY_PAID demands.
        expect(result.paymentStatus).toBe('PENDING');
        expect(result.outstandingStatus).toBe('PENDING');
        expect(result.noOfEmployees).toBe(1);
        expect(result.totalEmployeesInMonth).toBe(3);
        expect(result.totalPayable).toBe(25000);
        expect(Salary.countDocuments).not.toHaveBeenCalled();
    });

    it('should report PARTIALLY_PAID scoped to the APPROVED docs once a late-added employee has been approved (no longer PENDING) alongside others already PAID', async () => {
        const corporateUserID = 'validCorporateUserId';
        const month = 1;
        const year = 2023;
        const cycleStart = new Date('2023-01-01');
        const cycleEnd = new Date('2023-01-31');

        const paidPlusApprovedDocs = [
            { paymentStatus: 'PAID', payingDate: '2023-01-25' },
            { paymentStatus: 'PAID', payingDate: '2023-01-25' },
            { paymentStatus: 'APPROVED', payingDate: null },
        ];
        const mockSalaryAggregate = [
            { totalOtherDeduction: 10, totalPayable: 96250 }
        ];

        HrSettings.findOne.mockReturnValue({
            select: jest.fn().mockResolvedValue({
                payrollSettings: { organizationWorkingDays: 20, payrollStartsFrom: '01', salaryCycleDay: 1 }
            })
        });
        Salary.find.mockReturnValue({
            select: jest.fn().mockReturnValue({
                lean: jest.fn().mockResolvedValue(paidPlusApprovedDocs)
            })
        });
        Salary.aggregate.mockResolvedValue(mockSalaryAggregate);

        const result = await getSalaryInfo(corporateUserID, month, year, cycleStart, cycleEnd);

        // The one still-APPROVED (not yet paid) employee, not the already-PAID ones.
        expect(result.paymentStatus).toBe('PARTIALLY_PAID');
        expect(result.outstandingStatus).toBe('APPROVED');
        expect(result.noOfEmployees).toBe(1);
        expect(result.totalEmployeesInMonth).toBe(3);
        expect(result.totalPayable).toBe(96250);
        expect(Salary.countDocuments).not.toHaveBeenCalled();
        expect(Salary.aggregate).toHaveBeenCalledWith([
            {
                $match: {
                    year,
                    month,
                    corporateUser: corporateUserID,
                    paymentStatus: 'APPROVED'
                }
            },
            {
                $group: {
                    _id: null,
                    totalOtherDeduction: {
                        $sum: { $add: ["$totalOtherDeduction", "$leaveDeduction"] }
                    },
                    totalPayable: {
                        $sum: "$totalPayable"
                    }
                }
            }
        ]);
    });

    it('should handle errors gracefully', async () => {
        const corporateUserID = 'validCorporateUserId';
        const month = 1;
        const year = 2023;
        const cycleStart = new Date('2023-01-01');
        const cycleEnd = new Date('2023-01-31');

        const mockError = new Error('Database error');

        console.log = jest.fn();
        HrSettings.findOne.mockReturnValue({
            select: jest.fn().mockRejectedValue(mockError)
        });

        const result = await getSalaryInfo(corporateUserID, month, year, cycleStart, cycleEnd);

        expect(HrSettings.findOne).toHaveBeenCalledWith({ corporateUser: corporateUserID });
        expect(result).toEqual(mockError);
    });
});
