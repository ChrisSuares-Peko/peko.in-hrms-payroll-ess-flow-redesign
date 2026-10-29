const { updateVisaOrderDocuments } = require('../../../use-cases/visa');
const visaOrders = require('../../../entities/visaOrder');
const sequelizeConfig = require('../../../../configs/database/index');

jest.mock('../../../entities/visaOrder', () => ({
    findOne: jest.fn(),
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

describe('updateVisaOrderDocuments', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    const mockInput = {
        orderNumber: 'VISA-001',
        applicationId: 101,
        documentCode: 'PASSPORT_FRONT',
        s3Key: 'visa-documents/VISA-001/passport_front.jpg',
        presignedUrl: 'https://cdn.example.com/visa-documents/VISA-001/passport_front.jpg',
    };

    it('should update applicant documents within the order', async () => {
        const mockOrder = {
            applicants: [
                { id: 101, first_name: 'John', documents: {} },
                { id: 102, first_name: 'Jane', documents: {} },
            ],
        };

        const mockTransaction = { LOCK: { UPDATE: 'UPDATE' } };
        sequelizeConfig.transaction.mockImplementation(async (cb) => cb(mockTransaction));
        visaOrders.findOne.mockResolvedValue(mockOrder);
        visaOrders.update.mockResolvedValue([1]);

        await updateVisaOrderDocuments(mockInput);

        expect(visaOrders.findOne).toHaveBeenCalledWith(expect.objectContaining({
            where: { orderNumber: 'VISA-001' },
        }));
        expect(visaOrders.update).toHaveBeenCalledWith(
            expect.objectContaining({
                applicants: expect.arrayContaining([
                    expect.objectContaining({
                        id: 101,
                        documents: expect.objectContaining({
                            PASSPORT_FRONT: expect.objectContaining({
                                key: mockInput.s3Key,
                                url: mockInput.presignedUrl,
                            }),
                        }),
                    }),
                ]),
            }),
            expect.objectContaining({ where: { orderNumber: 'VISA-001' } })
        );
    });

    it('should parse applicants when stored as JSON string', async () => {
        const mockOrder = {
            applicants: JSON.stringify([{ id: 101, first_name: 'John', documents: {} }]),
        };

        const mockTransaction = { LOCK: { UPDATE: 'UPDATE' } };
        sequelizeConfig.transaction.mockImplementation(async (cb) => cb(mockTransaction));
        visaOrders.findOne.mockResolvedValue(mockOrder);
        visaOrders.update.mockResolvedValue([1]);

        await updateVisaOrderDocuments(mockInput);

        expect(visaOrders.update).toHaveBeenCalled();
    });

    it('should do nothing if order is not found', async () => {
        const mockTransaction = { LOCK: { UPDATE: 'UPDATE' } };
        sequelizeConfig.transaction.mockImplementation(async (cb) => cb(mockTransaction));
        visaOrders.findOne.mockResolvedValue(null);

        await updateVisaOrderDocuments(mockInput);

        expect(visaOrders.update).not.toHaveBeenCalled();
    });

    it('should throw an error if transaction fails', async () => {
        sequelizeConfig.transaction.mockRejectedValue(new Error('Transaction error'));

        await expect(updateVisaOrderDocuments(mockInput)).rejects.toThrow('Transaction error');
    });
});
