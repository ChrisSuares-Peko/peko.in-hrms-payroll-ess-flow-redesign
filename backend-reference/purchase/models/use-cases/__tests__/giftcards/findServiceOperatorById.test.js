const { findServiceOperatorById } = require('../../../use-cases/giftCards');
const serviceOperator = require('../../../entities/serviceOperator');
const vendor = require('../../../entities/vendor');

jest.mock('../../../entities/serviceOperator', () => ({
    findOne: jest.fn(),
}));
jest.mock('../../../entities/subCorporateUsers', () => ({
    belongsTo: jest.fn(),
}));
jest.mock("@logtail/node", () => ({
    Logtail: jest.fn().mockImplementation(() => ({
        log: jest.fn(),
        info: jest.fn(),
        warn: jest.fn(),
        error: jest.fn(),
    })),
}));
describe('findServiceOperatorById', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('should return a service operator including vendor details if found by ID', async () => {
        const mockServiceOperatorId = 1;
        const mockServiceOperator = {
            id: mockServiceOperatorId,
            name: 'Test Service Operator',
            vendor: { id: 10, name: 'Test Vendor' },
        };

        serviceOperator.findOne.mockResolvedValue(mockServiceOperator);

        const result = await findServiceOperatorById(mockServiceOperatorId);

        expect(serviceOperator.findOne).toHaveBeenCalledWith({
            include: [{ model: vendor, as: 'vendor' }],
            where: { id: mockServiceOperatorId },
        });
        expect(result).toEqual(mockServiceOperator);
    });

    it('should return null if no service operator is found', async () => {
        const mockServiceOperatorId = 999;
        serviceOperator.findOne.mockResolvedValue(null);

        const result = await findServiceOperatorById(mockServiceOperatorId);

        expect(result).toBeNull();
    });

    it('should handle errors if database query fails', async () => {
        const mockServiceOperatorId = 1;
        const mockError = new Error('Database error');

        serviceOperator.findOne.mockRejectedValue(mockError);

        await expect(findServiceOperatorById(mockServiceOperatorId)).rejects.toThrow('Database error');
    });
});