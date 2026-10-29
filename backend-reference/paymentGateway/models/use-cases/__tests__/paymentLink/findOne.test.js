const { findOne } = require('../../../use-cases/paymentLink');
const paymentLinks = require('../../../entities/paymentLink');

jest.mock('../../../entities/paymentLink', () => ({
    findOne: jest.fn(),
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

describe('findOne', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('should return a payment link when found', async () => {
        const mockParams = { id: 1 };
        const mockPaymentLink = { id: 1, amount: 100, currency: 'USD' };

        paymentLinks.findOne.mockResolvedValue(mockPaymentLink);

        const result = await findOne(mockParams);

        expect(paymentLinks.findOne).toHaveBeenCalledWith({ where: mockParams });
        expect(result).toEqual(mockPaymentLink);
    });

    it('should return null when no payment link is found', async () => {
        const mockParams = { id: 999 };
        paymentLinks.findOne.mockResolvedValue(null);

        const result = await findOne(mockParams);

        expect(result).toBeNull();
    });

    it('should return false when findOne fails', async () => {
        const mockParams = { id: 1 };
        const mockError = new Error('Database error');

        paymentLinks.findOne.mockRejectedValue(mockError);

        const result = await findOne(mockParams);

        expect(paymentLinks.findOne).toHaveBeenCalledWith({ where: mockParams });
        expect(result).toBe(false);
    });
});
