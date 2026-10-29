const { update } = require('../../../use-cases/paymentLink');
const paymentLinks = require('../../../entities/paymentLink');

jest.mock('../../../entities/paymentLink', () => ({
    update: jest.fn(),
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

describe('update', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('should update a payment link and return the affected row count', async () => {
        const mockPaymentLinkId = 1;
        const mockData = { status: 'COMPLETED' };
        const mockResponse = [1]; // 1 row affected

        paymentLinks.update.mockResolvedValue(mockResponse);

        const result = await update(mockPaymentLinkId, mockData);

        expect(paymentLinks.update).toHaveBeenCalledWith(mockData, { where: { id: mockPaymentLinkId } });
        expect(result).toEqual(mockResponse);
    });

    it('should return [0] when no records are updated', async () => {
        const mockPaymentLinkId = 2;
        const mockData = { status: 'FAILED' };
        paymentLinks.update.mockResolvedValue([0]); // 0 rows affected

        const result = await update(mockPaymentLinkId, mockData);

        expect(result).toEqual([0]);
    });

    it('should log an error when an exception occurs', async () => {
        const mockPaymentLinkId = 3;
        const mockData = { status: 'PENDING' };
        const mockError = new Error('Database error');

        paymentLinks.update.mockRejectedValue(mockError);
        console.log = jest.fn();

        await update(mockPaymentLinkId, mockData);

        expect(console.log).toHaveBeenCalledWith(mockError);
        expect(console.log).toHaveBeenCalledWith("PAYOUT FIND ONE ROUTE CALLED");
    });

    it('should log the message when function is executed', async () => {
        const mockPaymentLinkId = 4;
        const mockData = { status: 'PROCESSING' };
        const mockResponse = [1];

        console.log = jest.fn();
        paymentLinks.update.mockResolvedValue(mockResponse);

        await update(mockPaymentLinkId, mockData);

        expect(console.log).toHaveBeenCalledWith("PAYOUT FIND ONE ROUTE CALLED");
    });
});
