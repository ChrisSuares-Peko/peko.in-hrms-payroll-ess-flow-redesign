const { updateVisaOrderPaymentStatus } = require('../../../use-cases/visa');
const visaOrders = require('../../../entities/visaOrder');

jest.mock('../../../entities/visaOrder', () => ({
    update: jest.fn(),
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

describe('updateVisaOrderPaymentStatus', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('should update payment status and corporateTxnId', async () => {
        visaOrders.update.mockResolvedValue([1]);

        await updateVisaOrderPaymentStatus({
            orderNumber: 'VISA-001',
            paymentStatus: 'PAID',
            corporateTxnId: 'TXN-123',
        });

        expect(visaOrders.update).toHaveBeenCalledWith(
            { paymentStatus: 'PAID', corporateTxnId: 'TXN-123' },
            { where: { orderNumber: 'VISA-001' } }
        );
    });

    it('should update payment status to FAILED', async () => {
        visaOrders.update.mockResolvedValue([1]);

        await updateVisaOrderPaymentStatus({
            orderNumber: 'VISA-002',
            paymentStatus: 'FAILED',
            corporateTxnId: 'TXN-456',
        });

        expect(visaOrders.update).toHaveBeenCalledWith(
            { paymentStatus: 'FAILED', corporateTxnId: 'TXN-456' },
            { where: { orderNumber: 'VISA-002' } }
        );
    });

    it('should throw an error if update fails', async () => {
        visaOrders.update.mockRejectedValue(new Error('Database error'));

        await expect(updateVisaOrderPaymentStatus({
            orderNumber: 'VISA-001',
            paymentStatus: 'PAID',
            corporateTxnId: 'TXN-123',
        })).rejects.toThrow('Database error');
    });
});
