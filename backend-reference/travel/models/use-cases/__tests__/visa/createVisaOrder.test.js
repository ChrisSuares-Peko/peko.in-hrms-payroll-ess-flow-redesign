const { createVisaOrder } = require('../../../use-cases/visa');
const visaOrders = require('../../../entities/visaOrder');

jest.mock('../../../entities/visaOrder', () => ({
    create: jest.fn(),
    belongsTo: jest.fn(),
}));
jest.mock('../../../entities/credential', () => ({
    belongsTo: jest.fn(),
}));
jest.mock('../../../entities/serviceOperator', () => ({
    belongsTo: jest.fn(),
}));
jest.mock('../../../entities/corporateUser', () => ({
    belongsTo: jest.fn(),
}));
jest.mock('../../../../configs/database/index', () => ({
    define: jest.fn(() => ({})),
    transaction: jest.fn(),
    query: jest.fn(),
    QueryTypes: { UPDATE: 'UPDATE' },
}));

describe('createVisaOrder', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    const mockParams = {
        credentialId: 1,
        serviceOperatorId: 10,
        orderNumber: 'VISA-001',
        productId: 81,
        productName: 'UAE 30 Days Single Entry eVisa',
        destination: 'United Arab Emirates',
        visaFormat: 'evisa',
        visaCategory: 'Tourist',
        amountInINR: 13240,
        baseCurrency: 'INR',
        adult: 1,
        child: 0,
        infant: 0,
        travelDate: '2025-06-01',
        applicants: [{ first_name: 'John', last_name: 'Doe', dob: '1990-01-01', passport_no: 'A1234567' }],
        orderResponse: { order_number: 'VISA-001' },
    };

    it('should successfully create a visa order', async () => {
        const mockOrder = { id: 1, ...mockParams, paymentStatus: 'PENDING', applicationStatus: 'NEW' };
        visaOrders.create.mockResolvedValue(mockOrder);

        const result = await createVisaOrder(mockParams);

        expect(visaOrders.create).toHaveBeenCalledWith(expect.objectContaining({
            credentialId: 1,
            orderNumber: 'VISA-001',
            productId: 81,
            destination: 'United Arab Emirates',
            visaFormat: 'evisa',
            visaCategory: 'Tourist',
            amountInINR: 13240,
            paymentStatus: 'PENDING',
            applicationStatus: 'NEW',
        }));
        expect(result).toEqual(mockOrder);
    });

    it('should default baseCurrency to INR when not provided', async () => {
        const params = { ...mockParams, baseCurrency: undefined };
        const mockOrder = { id: 2, ...params, baseCurrency: 'INR' };
        visaOrders.create.mockResolvedValue(mockOrder);

        await createVisaOrder(params);

        expect(visaOrders.create).toHaveBeenCalledWith(expect.objectContaining({
            baseCurrency: 'INR',
        }));
    });

    it('should default adult to 1 and child/infant to 0 when not provided', async () => {
        const params = { ...mockParams, adult: undefined, child: undefined, infant: undefined };
        visaOrders.create.mockResolvedValue({ id: 3 });

        await createVisaOrder(params);

        expect(visaOrders.create).toHaveBeenCalledWith(expect.objectContaining({
            adult: 1,
            child: 0,
            infant: 0,
        }));
    });

    it('should stringify orderResponse before saving', async () => {
        visaOrders.create.mockResolvedValue({ id: 4 });

        await createVisaOrder(mockParams);

        const callArg = visaOrders.create.mock.calls[0][0];
        expect(typeof callArg.orderResponse).toBe('string');
        expect(callArg.orderResponse).toBe(JSON.stringify(mockParams.orderResponse));
    });

    it('should throw an error if create fails', async () => {
        visaOrders.create.mockRejectedValue(new Error('Database error'));

        await expect(createVisaOrder(mockParams)).rejects.toThrow('Database error');
    });
});
