const { findOne } = require('../../../use-cases/serviceOperator');
const serviceOperator = require('../../../entities/serviceOperator');
const vendors = require('../../../entities/vendor');

jest.mock('../../../entities/serviceOperator', () => ({
    findOne: jest.fn(),
}));

describe('findOne', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('should return a service operator when a matching accessKey is found', async () => {
        const mockParams = { accessKey: 'ACCESS123', serviceType: 'MOBILE' };
        const mockServiceOperator = {
            id: 1,
            accessKey: 'ACCESS123',
            serviceType: 'MOBILE',
            vendors: {
                apiUrl: 'https://api.example.com',
                healthUrl: 'https://health.example.com',
                optional1: 'value1',
                optional2: 'value2',
            },
        };

        serviceOperator.findOne.mockResolvedValue(mockServiceOperator);

        const result = await findOne(mockParams);

        expect(serviceOperator.findOne).toHaveBeenCalledWith({
            include: [
                {
                    model: vendors,
                    attributes: [
                        'apiUrl', 'healthUrl', 'optional1', 'optional2', 'optional3',
                        'optional4', 'optional5', 'optional6','optionals'
                    ],
                },
            ],
            where: { accessKey: mockParams.accessKey, serviceType: mockParams.serviceType },
            raw: true,
            nest: true,
        });

        expect(result).toEqual(mockServiceOperator);
    });

    it('should return null when no matching service operator is found', async () => {
        const mockParams = { accessKey: 'ACCESS_NOT_FOUND' };

        serviceOperator.findOne.mockResolvedValue(null);

        const result = await findOne(mockParams);

        expect(serviceOperator.findOne).toHaveBeenCalledWith({
            include: expect.any(Array),
            where: { accessKey: mockParams.accessKey },
            raw: true,
            nest: true,
        });

        expect(result).toBeNull();
    });

    it('should log an error when database operation fails', async () => {
        const mockParams = { accessKey: 'ACCESS_ERROR' };
        const mockError = new Error('Database error');

        serviceOperator.findOne.mockRejectedValue(mockError);
        console.log = jest.fn();

        await expect(findOne(mockParams)).rejects.toThrow('Database error');

    });
});
