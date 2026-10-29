const { findVisaOrderByOrderNumber } = require('../../../use-cases/visa');
const visaOrders = require('../../../entities/visaOrder');
const credential = require('../../../entities/credential');

jest.mock('../../../entities/visaOrder', () => ({
    findOne: jest.fn(),
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

describe('findVisaOrderByOrderNumber', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('should return a visa order by order number', async () => {
        const mockOrder = {
            id: 1,
            orderNumber: 'VISA-001',
            destination: 'United Arab Emirates',
            paymentStatus: 'PAID',
            credential: { id: 1, username: 'john', email: 'john@example.com' },
        };
        visaOrders.findOne.mockResolvedValue(mockOrder);

        const result = await findVisaOrderByOrderNumber('VISA-001');

        expect(visaOrders.findOne).toHaveBeenCalledWith(expect.objectContaining({
            where: { orderNumber: 'VISA-001' },
            include: expect.arrayContaining([
                expect.objectContaining({ model: credential }),
            ]),
        }));
        expect(result).toEqual(mockOrder);
    });

    it('should return null when order number does not exist', async () => {
        visaOrders.findOne.mockResolvedValue(null);

        const result = await findVisaOrderByOrderNumber('NONEXISTENT');

        expect(result).toBeNull();
    });

    it('should throw an error if database query fails', async () => {
        visaOrders.findOne.mockRejectedValue(new Error('Database error'));

        await expect(findVisaOrderByOrderNumber('VISA-001')).rejects.toThrow('Database error');
    });
});
