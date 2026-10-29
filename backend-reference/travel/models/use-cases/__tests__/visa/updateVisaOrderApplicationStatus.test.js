const { updateVisaOrderApplicationStatus } = require('../../../use-cases/visa');
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

describe('updateVisaOrderApplicationStatus', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('should update application status', async () => {
        visaOrders.update.mockResolvedValue([1]);

        await updateVisaOrderApplicationStatus({
            orderNumber: 'VISA-001',
            applicationStatus: 'APPROVED',
        });

        expect(visaOrders.update).toHaveBeenCalledWith(
            { applicationStatus: 'APPROVED' },
            { where: { orderNumber: 'VISA-001' } }
        );
    });

    it('should update application status to REJECTED', async () => {
        visaOrders.update.mockResolvedValue([1]);

        await updateVisaOrderApplicationStatus({
            orderNumber: 'VISA-002',
            applicationStatus: 'REJECTED',
        });

        expect(visaOrders.update).toHaveBeenCalledWith(
            { applicationStatus: 'REJECTED' },
            { where: { orderNumber: 'VISA-002' } }
        );
    });

    it('should throw an error if update fails', async () => {
        visaOrders.update.mockRejectedValue(new Error('Database error'));

        await expect(updateVisaOrderApplicationStatus({
            orderNumber: 'VISA-001',
            applicationStatus: 'APPROVED',
        })).rejects.toThrow('Database error');
    });
});
