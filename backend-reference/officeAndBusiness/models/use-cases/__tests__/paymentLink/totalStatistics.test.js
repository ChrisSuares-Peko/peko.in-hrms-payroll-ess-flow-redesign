const { totalStatistics } = require('../../../use-cases/paymentLink');
const paymentLinks = require('../../../entities/paymentLink');
const { fn, col, literal } = require('sequelize');

jest.mock('../../../entities/paymentLink', () => ({
    findAll: jest.fn(),
}));
jest.mock("@logtail/node", () => ({
    Logtail: jest.fn().mockImplementation(() => ({
        log: jest.fn(),
        info: jest.fn(),
        warn: jest.fn(),
        error: jest.fn(),
    })),
}));

jest.mock('../../../entities/corporateUser', () => ({
    belongsTo: jest.fn(),
}));

describe('totalStatistics', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('should return total statistics for a corporate user', async () => {
        const mockCorporateId = 123;
        const mockResult = [{
            totalPaymentRequests: 10,
            totalAmountRequested: 5000,
            totalPaidRequests: 5,
            totalPendingRequests: 5,
            totalPaidAmount: 3000,
            totalPendingAmount: 2000,
        }];

        paymentLinks.findAll.mockResolvedValue(mockResult);

        const result = await totalStatistics(mockCorporateId);

        expect(paymentLinks.findAll).toHaveBeenCalledWith({
            attributes: [
                [fn("COUNT", col("id")), "totalPaymentRequests"],
                [fn("SUM", col("amount")), "totalAmountRequested"],
                [fn("COUNT", literal(`CASE WHEN status = 'paid' THEN 1 END`)), "totalPaidRequests"],
                [fn("COUNT", literal(`CASE WHEN status = 'pending' THEN 1 END`)), "totalPendingRequests"],
                [fn("SUM", literal(`CASE WHEN status = 'paid' THEN amount END`)), "totalPaidAmount"],
                [fn("SUM", literal(`CASE WHEN status = 'pending' THEN amount END`)), "totalPendingAmount"],
            ],
            where: { credentialId: mockCorporateId },
            raw: true,
        });
        expect(result).toEqual(mockResult[0]);
    });

    it('should return null when no statistics are found', async () => {
        const mockCorporateId = 456;
        paymentLinks.findAll.mockResolvedValue([]);

        const result = await totalStatistics(mockCorporateId);

        expect(result).toBeUndefined();
    });

    it('should throw an error when findAll fails', async () => {
        const mockCorporateId = 789;
        const mockError = new Error('Database error');

        paymentLinks.findAll.mockRejectedValue(mockError);

        await expect(totalStatistics(mockCorporateId)).rejects.toThrow('Database error');
    });
});
