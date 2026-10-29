const { salaryHistoryList } = require('../../../use-cases/salary');
const Salary = require('../../../entities/salary');

jest.mock('../../../entities/salary');
jest.mock('../../../entities/oneTimePayment');

describe('salaryHistoryList Use-case', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('should return paginated rows and count', async () => {
        Salary.aggregate.mockResolvedValueOnce([{
            count: [{ total: 2 }],
            rows: [
                {
                    _id: { year: 2026, month: 5 },
                    totalEmployees: 1,
                    salariesProcessed: 1,
                    totalPayroll: 13800,
                    processedOn: new Date('2026-05-10'),
                    paidCount: 1,
                    failedCount: 0,
                },
                {
                    _id: { year: 2026, month: 4 },
                    totalEmployees: 2,
                    salariesProcessed: 0,
                    totalPayroll: 27600,
                    processedOn: null,
                    paidCount: 0,
                    failedCount: 0,
                },
            ],
        }]);

        const result = await salaryHistoryList({ corporateUserID: 'corp1', year: '2026', page: 1, limit: 10 });

        expect(result.count).toBe(2);
        expect(result.rows).toHaveLength(2);
        expect(result.rows[0]).toMatchObject({
            month: 5,
            year: 2026,
            totalEmployees: 1,
            salariesProcessed: 1,
            totalPayroll: 13800,
            salaryStatus: 'PAID',
        });
        expect(result.rows[1]).toMatchObject({
            month: 4,
            year: 2026,
            salaryStatus: 'PENDING',
        });
    });

    it('should return PARTIAL status when some employees are paid', async () => {
        Salary.aggregate.mockResolvedValueOnce([{
            count: [{ total: 1 }],
            rows: [
                {
                    _id: { year: 2026, month: 3 },
                    totalEmployees: 3,
                    salariesProcessed: 1,
                    totalPayroll: 41400,
                    processedOn: new Date('2026-03-10'),
                    paidCount: 1,
                    failedCount: 0,
                },
            ],
        }]);

        const result = await salaryHistoryList({ corporateUserID: 'corp1', page: 1, limit: 10 });

        expect(result.rows[0].salaryStatus).toBe('PARTIAL');
    });

    it('should return FAILD status when all employees failed', async () => {
        Salary.aggregate.mockResolvedValueOnce([{
            count: [{ total: 1 }],
            rows: [
                {
                    _id: { year: 2026, month: 2 },
                    totalEmployees: 2,
                    salariesProcessed: 0,
                    totalPayroll: 27600,
                    processedOn: null,
                    paidCount: 0,
                    failedCount: 2,
                },
            ],
        }]);

        const result = await salaryHistoryList({ corporateUserID: 'corp1', page: 1, limit: 10 });

        expect(result.rows[0].salaryStatus).toBe('FAILD');
    });

    it('should return empty rows and count 0 when no salary records exist', async () => {
        Salary.aggregate.mockResolvedValueOnce([{
            count: [],
            rows: [],
        }]);

        const result = await salaryHistoryList({ corporateUserID: 'corp1', page: 1, limit: 10 });

        expect(result.count).toBe(0);
        expect(result.rows).toHaveLength(0);
    });

    it('should apply correct skip for page 2', async () => {
        Salary.aggregate.mockResolvedValueOnce([{ count: [{ total: 15 }], rows: [] }]);

        await salaryHistoryList({ corporateUserID: 'corp1', page: 2, limit: 10 });

        const pipeline = Salary.aggregate.mock.calls[0][0];
        const facet = pipeline.find(s => s.$facet);
        const skipStage = facet.$facet.rows.find(s => s.$skip);
        expect(skipStage.$skip).toBe(10);
    });

    it('should throw when aggregate fails', async () => {
        Salary.aggregate.mockRejectedValueOnce(new Error('DB error'));

        await expect(salaryHistoryList({ corporateUserID: 'corp1', page: 1, limit: 10 })).rejects.toThrow('DB error');
    });
});
