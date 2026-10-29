const { findVisaOrders } = require('../../../use-cases/visa');
const visaOrders = require('../../../entities/visaOrder');
const credential = require('../../../entities/credential');
const serviceOperator = require('../../../entities/serviceOperator');

jest.mock('../../../entities/visaOrder', () => ({
    findAndCountAll: jest.fn(),
    belongsTo: jest.fn(),
}));
jest.mock('../../../entities/credential', () => ({ belongsTo: jest.fn() }));
jest.mock('../../../entities/serviceOperator', () => ({ belongsTo: jest.fn() }));
jest.mock('../../../entities/corporateUser', () => ({ belongsTo: jest.fn() }));
jest.mock('../../../../configs/database/index', () => ({
    define: jest.fn(() => ({})),
    transaction: jest.fn(),
    QueryTypes: { UPDATE: 'UPDATE' },
}));

describe('findVisaOrders', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    const mockResponse = {
        count: 2,
        rows: [
            {
                id: 1,
                credentialId: 1,
                orderNumber: 'VISA-001',
                destination: 'United Arab Emirates',
                paymentStatus: 'PAID',
                applicationStatus: 'APPROVED',
            },
            {
                id: 2,
                credentialId: 1,
                orderNumber: 'VISA-002',
                destination: 'Singapore',
                paymentStatus: 'PENDING',
                applicationStatus: 'NEW',
            },
        ],
    };

    it('should return visa orders for a credential', async () => {
        visaOrders.findAndCountAll.mockResolvedValue(mockResponse);

        const result = await findVisaOrders({ credentialId: 1, limit: 10, page: 1 });

        expect(visaOrders.findAndCountAll).toHaveBeenCalledWith(expect.objectContaining({
            where: { credentialId: 1 },
            limit: 10,
            offset: 0,
            order: [['transactionDate', 'DESC']],
            include: expect.arrayContaining([
                expect.objectContaining({ model: credential }),
                expect.objectContaining({ model: serviceOperator }),
            ]),
        }));
        expect(result).toEqual(mockResponse);
    });

    it('should filter by serviceOperatorId when provided', async () => {
        visaOrders.findAndCountAll.mockResolvedValue({ count: 1, rows: [] });

        await findVisaOrders({ credentialId: 1, serviceOperatorId: 10, limit: 10, page: 1 });

        expect(visaOrders.findAndCountAll).toHaveBeenCalledWith(expect.objectContaining({
            where: { credentialId: 1, serviceOperatorId: 10 },
        }));
    });

    it('should apply correct pagination offset', async () => {
        visaOrders.findAndCountAll.mockResolvedValue({ count: 0, rows: [] });

        await findVisaOrders({ credentialId: 1, limit: 5, page: 3 });

        expect(visaOrders.findAndCountAll).toHaveBeenCalledWith(expect.objectContaining({
            limit: 5,
            offset: 10,
        }));
    });

    it('should return empty result when no orders found', async () => {
        visaOrders.findAndCountAll.mockResolvedValue({ count: 0, rows: [] });

        const result = await findVisaOrders({ credentialId: 999, limit: 10, page: 1 });

        expect(result).toEqual({ count: 0, rows: [] });
    });

    it('should throw an error if database query fails', async () => {
        visaOrders.findAndCountAll.mockRejectedValue(new Error('Database error'));

        await expect(findVisaOrders({ credentialId: 1 })).rejects.toThrow('Database error');
    });
});
