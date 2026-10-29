const { findAllVisaOrders } = require('../../../use-cases/visa');
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

describe('findAllVisaOrders', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    const mockResponse = {
        count: 1,
        rows: [
            {
                id: 1,
                orderNumber: 'VISA-001',
                destination: 'United Arab Emirates',
                visaCategory: 'Tourist',
                visaFormat: 'evisa',
                paymentStatus: 'PAID',
                applicationStatus: 'APPROVED',
                travelDate: '2025-06-01',
            },
        ],
    };

    it('should return all visa orders with default params', async () => {
        visaOrders.findAndCountAll.mockResolvedValue(mockResponse);

        const result = await findAllVisaOrders({ credentialId: 1, limit: 10, page: 1 });

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

    it('should filter by paymentStatus', async () => {
        visaOrders.findAndCountAll.mockResolvedValue({ count: 1, rows: [] });

        await findAllVisaOrders({ credentialId: 1, paymentStatus: 'PAID', limit: 10, page: 1 });

        expect(visaOrders.findAndCountAll).toHaveBeenCalledWith(expect.objectContaining({
            where: expect.objectContaining({ paymentStatus: 'PAID' }),
        }));
    });

    it('should filter by applicationStatus', async () => {
        visaOrders.findAndCountAll.mockResolvedValue({ count: 0, rows: [] });

        await findAllVisaOrders({ credentialId: 1, applicationStatus: 'APPROVED', limit: 10, page: 1 });

        expect(visaOrders.findAndCountAll).toHaveBeenCalledWith(expect.objectContaining({
            where: expect.objectContaining({ applicationStatus: 'APPROVED' }),
        }));
    });

    it('should apply date range filter when both from and to are provided', async () => {
        visaOrders.findAndCountAll.mockResolvedValue({ count: 0, rows: [] });

        await findAllVisaOrders({
            credentialId: 1,
            from: '2025-01-01',
            to: '2025-01-31',
            limit: 10,
            page: 1,
        });

        const callArg = visaOrders.findAndCountAll.mock.calls[0][0];
        expect(callArg.where.transactionDate).toBeDefined();
    });

    it('should apply correct pagination offset on page 2', async () => {
        visaOrders.findAndCountAll.mockResolvedValue({ count: 0, rows: [] });

        await findAllVisaOrders({ credentialId: 1, limit: 10, page: 2 });

        expect(visaOrders.findAndCountAll).toHaveBeenCalledWith(expect.objectContaining({
            limit: 10,
            offset: 10,
        }));
    });

    it('should return empty result when no orders found', async () => {
        visaOrders.findAndCountAll.mockResolvedValue({ count: 0, rows: [] });

        const result = await findAllVisaOrders({ credentialId: 999, limit: 10, page: 1 });

        expect(result).toEqual({ count: 0, rows: [] });
    });

    it('should throw an error if database query fails', async () => {
        visaOrders.findAndCountAll.mockRejectedValue(new Error('Database error'));

        await expect(findAllVisaOrders({ credentialId: 1 })).rejects.toThrow('Database error');
    });
});
