const { findServiceOperatorByAccessKey } = require('../../../use-cases/giftCards');
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
describe('findServiceOperatorByAccessKey', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('should return a service operator including vendor details if found by access key', async () => {
        const mockAccessKey = 'test-access-key';
        const mockServiceOperator = {
            id: 1,
            name: 'Test Service Operator',
            accessKey: mockAccessKey,
            vendor: { id: 10, name: 'Test Vendor' },
        };

        serviceOperator.findOne.mockResolvedValue(mockServiceOperator);

        const result = await findServiceOperatorByAccessKey(mockAccessKey);

        expect(serviceOperator.findOne).toHaveBeenCalledWith({
            include: [{ model: vendor, as: 'vendor' }],
            where: { accessKey: mockAccessKey },
        });
        expect(result).toEqual(mockServiceOperator);
    });

    it('should return null if no service operator is found', async () => {
        const mockAccessKey = 'invalid-key';
        serviceOperator.findOne.mockResolvedValue(null);

        const result = await findServiceOperatorByAccessKey(mockAccessKey);

        expect(result).toBeNull();
    });

    it('should handle errors if database query fails', async () => {
        const mockAccessKey = 'test-access-key';
        const mockError = new Error('Database error');

        serviceOperator.findOne.mockRejectedValue(mockError);

        await expect(findServiceOperatorByAccessKey(mockAccessKey)).rejects.toThrow('Database error');
    });
});
