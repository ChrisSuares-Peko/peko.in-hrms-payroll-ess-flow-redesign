const { salaryHistoryDetail } = require('../../../use-cases/salary');
const Salary = require('../../../entities/salary');
const OneTimePayment = require('../../../entities/oneTimePayment');
const { ObjectId } = require('mongoose').Types;

jest.mock('../../../entities/salary');
jest.mock('../../../entities/employee');
jest.mock('../../../entities/bankDetails');
jest.mock('../../../entities/oneTimePayment');

const employeeId = new ObjectId();
const corporateUserID = new ObjectId().toString();

const mockSalaryRow = {
    _id: new ObjectId(),
    corporateUser: corporateUserID,
    month: 5,
    year: 2026,
    employee: employeeId,
    employeeObjId: employeeId,
    paymentStatus: 'PAID',
    message: 'Salary processed',
    totalPayable: 13800,
    salaryInformation: {
        basicPay: 10000,
        hraAmount: 3000,
        daAmount: 500,
        other: 500,
        deductionAmount: 1200,
    },
    employeeData: {
        personalInformation: { fullName: 'John Doe', email: 'john@peko.one' },
        employeeInformation: { employeeId: '0212' },
    },
    bankData: {
        accountNumber: '123456781191',
        bankName: 'Yes Bank',
        transactionType: 'NEFT',
        isDefaultAccount: true,
    },
};

const mockOneTimePayment = {
    _id: new ObjectId(),
    employee: employeeId,
    amount: 5000,
    paymentStatus: 'SUCCESS',
    referenceId: 'OTP_REF_001',
    decentroTxnId: 'DCT123',
    remark: 'Festival bonus',
    initiatedAt: new Date('2026-05-01'),
    completedAt: new Date('2026-05-01'),
    failedAt: null,
};

describe('salaryHistoryDetail Use-case', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('should return summary, count, rows with grossSalary and oneTimePayments', async () => {
        Salary.aggregate
            .mockResolvedValueOnce([{ _id: null, totalProcessed: 13800, totalEmployees: 1, totalPaid: 1 }])
            .mockResolvedValueOnce([{ count: 1 }])
            .mockResolvedValueOnce([mockSalaryRow]);

        OneTimePayment.find.mockReturnValue({
            select: jest.fn().mockReturnValue({
                lean: jest.fn().mockResolvedValue([mockOneTimePayment]),
            }),
        });

        const result = await salaryHistoryDetail({
            corporateUserID,
            month: 5,
            year: 2026,
            page: 1,
            limit: 10,
        });

        expect(result.summary).toEqual({ totalProcessed: 13800, totalEmployees: 1, totalPaid: 1 });
        expect(result.count).toBe(1);
        expect(result.rows).toHaveLength(1);

        const row = result.rows[0];
        expect(row.empId).toBe('0212');
        expect(row.name).toBe('John Doe');
        expect(row.email).toBe('john@peko.one');
        expect(row.accountDetail).toBe('Yes Bank - XXXX1191');
        expect(row.transType).toBe('NEFT');
        expect(row.grossSalary).toBe(14000); // 10000+3000+500+500
        expect(row.deduction).toBe(1200);
        expect(row.netPayable).toBe(13800);
        expect(row.paymentStatus).toBe('PAID');
        expect(row.oneTimePayments).toHaveLength(1);
        expect(row.oneTimePayments[0]).toMatchObject({
            amount: 5000,
            paymentStatus: 'SUCCESS',
            referenceId: 'OTP_REF_001',
        });
    });

    it('should return empty oneTimePayments array when none exist for employee', async () => {
        Salary.aggregate
            .mockResolvedValueOnce([{ _id: null, totalProcessed: 13800, totalEmployees: 1, totalPaid: 0 }])
            .mockResolvedValueOnce([{ count: 1 }])
            .mockResolvedValueOnce([mockSalaryRow]);

        OneTimePayment.find.mockReturnValue({
            select: jest.fn().mockReturnValue({
                lean: jest.fn().mockResolvedValue([]),
            }),
        });

        const result = await salaryHistoryDetail({ corporateUserID, month: 5, year: 2026, page: 1, limit: 10 });

        expect(result.rows[0].oneTimePayments).toEqual([]);
    });

    it('should return empty rows and zero summary when no salary records exist', async () => {
        Salary.aggregate
            .mockResolvedValueOnce([])
            .mockResolvedValueOnce([])
            .mockResolvedValueOnce([]);

        OneTimePayment.find.mockReturnValue({
            select: jest.fn().mockReturnValue({
                lean: jest.fn().mockResolvedValue([]),
            }),
        });

        const result = await salaryHistoryDetail({ corporateUserID, month: 1, year: 2026, page: 1, limit: 10 });

        expect(result.summary).toEqual({ totalProcessed: 0, totalEmployees: 0, totalPaid: 0 });
        expect(result.count).toBe(0);
        expect(result.rows).toHaveLength(0);
    });

    it('should compute grossSalary correctly from salary components', async () => {
        const rowWithComponents = {
            ...mockSalaryRow,
            salaryInformation: {
                basicPay: 20000,
                hraAmount: 4000,
                daAmount: 1000,
                other: 2000,
                deductionAmount: 500,
            },
        };

        Salary.aggregate
            .mockResolvedValueOnce([{ _id: null, totalProcessed: 27000, totalEmployees: 1, totalPaid: 1 }])
            .mockResolvedValueOnce([{ count: 1 }])
            .mockResolvedValueOnce([rowWithComponents]);

        OneTimePayment.find.mockReturnValue({
            select: jest.fn().mockReturnValue({ lean: jest.fn().mockResolvedValue([]) }),
        });

        const result = await salaryHistoryDetail({ corporateUserID, month: 5, year: 2026, page: 1, limit: 10 });

        expect(result.rows[0].grossSalary).toBe(27000); // 20000+4000+1000+2000
    });

    it('should use N/A for missing employee or bank data', async () => {
        const rowMissingData = {
            ...mockSalaryRow,
            employeeData: null,
            bankData: null,
        };

        Salary.aggregate
            .mockResolvedValueOnce([{ _id: null, totalProcessed: 0, totalEmployees: 1, totalPaid: 0 }])
            .mockResolvedValueOnce([{ count: 1 }])
            .mockResolvedValueOnce([rowMissingData]);

        OneTimePayment.find.mockReturnValue({
            select: jest.fn().mockReturnValue({ lean: jest.fn().mockResolvedValue([]) }),
        });

        const result = await salaryHistoryDetail({ corporateUserID, month: 5, year: 2026, page: 1, limit: 10 });

        expect(result.rows[0].empId).toBe('N/A');
        expect(result.rows[0].name).toBe('N/A');
        expect(result.rows[0].accountDetail).toBe('N/A');
        expect(result.rows[0].transType).toBe('N/A');
    });

    it('should throw when aggregate fails', async () => {
        Salary.aggregate.mockRejectedValueOnce(new Error('DB connection error'));

        OneTimePayment.find.mockReturnValue({
            select: jest.fn().mockReturnValue({ lean: jest.fn().mockResolvedValue([]) }),
        });

        await expect(
            salaryHistoryDetail({ corporateUserID, month: 5, year: 2026, page: 1, limit: 10 })
        ).rejects.toThrow('DB connection error');
    });
});
