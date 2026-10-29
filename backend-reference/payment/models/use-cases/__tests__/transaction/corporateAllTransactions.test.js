const { Op } = require('sequelize');
const transaction = require('../../../entities/transaction'); // Adjust path
const serviceOperator = require('../../../entities/serviceOperator'); // Adjust path
const credential = require('../../../entities/credential'); // Adjust path
const orders = require('../../../entities/order'); // Adjust path
const {corporateAllTransactions} = require('../../transaction'); // Adjust path



jest.mock('../../../entities/transaction', () => ({
    findAndCountAll: jest.fn(),
}));

jest.mock('../../../entities/serviceOperator', () => jest.fn());
jest.mock('../../../entities/credential', () => jest.fn());
jest.mock('../../../entities/order', () => jest.fn());

describe('corporateAllTransactions', () => {
    const mockParams = {
        corporateId: 'corporate123',
        from: '2024-01-01',
        to: '2024-12-31',
    };

    const mockResult = {
        count: 2,
        rows: [
            {
                id: 1,
                corporateTxnId: 'TXN123',
                transactionDate: '2024-01-15',
                status: 'Completed',
                totalPrice: 5000,
                paymentMode: 'Credit Card',
            },
            {
                id: 2,
                corporateTxnId: 'TXN124',
                transactionDate: '2024-02-15',
                status: 'Pending',
                totalPrice: 7000,
                paymentMode: 'Net Banking',
            },
        ],
    };

    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('should return corporate transactions filtered by date range and corporateId', async () => {
        transaction.findAndCountAll.mockResolvedValue(mockResult);

        const result = await corporateAllTransactions(mockParams);

        expect(transaction.findAndCountAll).toHaveBeenCalledWith({
            include: [
                { model: serviceOperator },
                { model: credential },
                { model: orders },
            ],
            where: {
                transactionDate: {
                    [Op.between]: [mockParams.from, mockParams.to],
                },
                credentialId: mockParams.corporateId,
            },
            raw: true,
            nest: true,
        });

        expect(result).toEqual(mockResult);
    });

    it('should handle no results and return empty data', async () => {
        transaction.findAndCountAll.mockResolvedValue({ count: 0, rows: [] });

        const result = await corporateAllTransactions(mockParams);

        expect(result).toEqual({ count: 0, rows: [] });
    });

    it('should throw an error if findAndCountAll fails', async () => {
        const errorMessage = 'Database error';
        transaction.findAndCountAll.mockRejectedValue(new Error(errorMessage));

        await expect(corporateAllTransactions(mockParams)).rejects.toThrow(errorMessage);
    });

    it('should handle corporateId being omitted and still return transactions within the date range', async () => {
        const noCorporateIdParams = { from: mockParams.from, to: mockParams.to };

        transaction.findAndCountAll.mockResolvedValue(mockResult);

        const result = await corporateAllTransactions(noCorporateIdParams);

        expect(transaction.findAndCountAll).toHaveBeenCalledWith(
            expect.objectContaining({
                where: {
                    transactionDate: {
                        [Op.between]: [mockParams.from, mockParams.to],
                    },
                },
            })
        );

        expect(result).toEqual(mockResult);
    });

    it('should handle missing from/to date parameters gracefully', async () => {
        const missingDateParams = { corporateId: mockParams.corporateId };

        transaction.findAndCountAll.mockResolvedValue(mockResult);

        const result = await corporateAllTransactions(missingDateParams);

        expect(transaction.findAndCountAll).toHaveBeenCalledWith(
            expect.objectContaining({
                where: expect.objectContaining({}),
            })
        );

        expect(result).toEqual(mockResult);
    });
});
