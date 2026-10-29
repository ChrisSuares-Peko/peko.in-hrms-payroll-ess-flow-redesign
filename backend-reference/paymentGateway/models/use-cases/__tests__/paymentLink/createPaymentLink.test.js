const { createPaymentLink } = require('../../../use-cases/paymentLink');
const paymentLinks = require('../../../entities/paymentLink');

jest.mock('../../../entities/paymentLink', () => ({
    create: jest.fn(),
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

describe('createPaymentLink', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('should create a payment link and return the created object', async () => {
        const mockParams = { amount: 100, currency: 'USD', description: 'Test Payment' };
        const mockResponse = { id: 1, ...mockParams };

        paymentLinks.create.mockResolvedValue(mockResponse);

        const result = await createPaymentLink(mockParams);

        expect(paymentLinks.create).toHaveBeenCalledWith(mockParams);
        expect(result).toEqual(mockResponse);
    });

    it('should return false when an error occurs', async () => {
        const mockParams = { amount: 200, currency: 'EUR', description: 'Failed Payment' };
        const mockError = new Error('Database error');

        paymentLinks.create.mockRejectedValue(mockError);
        console.log = jest.fn();

        const result = await createPaymentLink(mockParams);

        expect(console.log).toHaveBeenCalledWith(mockError.message);
        expect(result).toBe(false);
    });

    it('should log the message when function is executed', async () => {
        const mockParams = { amount: 300, currency: 'GBP', description: 'Logged Payment' };
        const mockResponse = { id: 3, ...mockParams };

        console.log = jest.fn();
        paymentLinks.create.mockResolvedValue(mockResponse);

        await createPaymentLink(mockParams);

        expect(console.log).toHaveBeenCalledWith("PAYMENT LINKS CREATE ROUTE CALLED");
    });
});
