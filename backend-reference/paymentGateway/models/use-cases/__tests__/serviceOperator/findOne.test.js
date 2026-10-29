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

    it('should return the service operator with included models when found', async () => {
        const mockParams = { accessKey: 'testKey', serviceType: 'TYPE_A' };
        const mockServiceOperator = {
            id: 1,
            accessKey: 'testKey',
            serviceType: 'TYPE_A',
            // ... other service operator data
            vendors: {
                apiUrl: 'http://example.com/api',
                optional1: 'value1',
                // ... other vendor data
                healthUrl: 'http://example.com/health',
                vendorEmail: 'test@example.com',
                type: 'REST',
            },
        };

        serviceOperator.findOne.mockResolvedValue(mockServiceOperator);

        const result = await findOne(mockParams);

        expect(serviceOperator.findOne).toHaveBeenCalledWith({
            include: [
                {
                    model: vendors,
                    attributes: ['apiUrl', 'optional1', 'optional2', 'optional3', 'optional4', 'optional5', 'healthUrl','vendorEmail','type','optionals']
                },
            ],
            where: { accessKey: mockParams.accessKey, serviceType: mockParams.serviceType },
            raw: true,
            nest: true,
        });
        expect(result).toEqual(mockServiceOperator);
    });

    it('should return the service operator without serviceType filter when not provided', async () => {
        const mockParams = { accessKey: 'testKey' };
        const mockServiceOperator = {
            id: 1,
            accessKey: 'testKey',
            serviceType: 'TYPE_A',
            // ... other service operator data
            vendors: {
                apiUrl: 'http://example.com/api',
                optional1: 'value1',
                // ... other vendor data
                healthUrl: 'http://example.com/health',
                vendorEmail: 'test@example.com',
                type: 'REST',
            },
        };

        serviceOperator.findOne.mockResolvedValue(mockServiceOperator);

        const result = await findOne(mockParams);

        expect(serviceOperator.findOne).toHaveBeenCalledWith({
            include: [
                {
                    model: vendors,
                    attributes: ['apiUrl', 'optional1', 'optional2', 'optional3', 'optional4', 'optional5', 'healthUrl','vendorEmail','type','optionals']
                },
            ],
            where: { accessKey: mockParams.accessKey },
            raw: true,
            nest: true,
        });
        expect(result).toEqual(mockServiceOperator);
    });

    it('should return null when service operator is not found', async () => {
        const mockParams = { accessKey: 'testKey', serviceType: 'TYPE_A' };

        serviceOperator.findOne.mockResolvedValue(null);

        const result = await findOne(mockParams);

        expect(serviceOperator.findOne).toHaveBeenCalledWith({
            include: [
                {
                    model: vendors,
                    attributes: ['apiUrl', 'optional1', 'optional2', 'optional3', 'optional4', 'optional5', 'healthUrl','vendorEmail','type','optionals']
                },
            ],
            where: { accessKey: mockParams.accessKey, serviceType: mockParams.serviceType },
            raw: true,
            nest: true,
        });
        expect(result).toBeNull();
    });

    it('should handle errors during database operations', async () => {
        const mockParams = { accessKey: 'testKey', serviceType: 'TYPE_A' };
        const mockError = new Error('Database error');

        serviceOperator.findOne.mockRejectedValue(mockError);

        await expect(findOne(mockParams)).rejects.toThrow(mockError); // Or handle as you prefer

        expect(serviceOperator.findOne).toHaveBeenCalledWith({
            include: [
                {
                    model: vendors,
                    attributes: ['apiUrl', 'optional1', 'optional2', 'optional3', 'optional4', 'optional5', 'healthUrl','vendorEmail','type','optionals']
                },
            ],
            where: { accessKey: mockParams.accessKey, serviceType: mockParams.serviceType },
            raw: true,
            nest: true,
        });
    });

    it('should handle missing accessKey parameter', async () => {
        const mockParams = { serviceType: 'TYPE_A' }; // Missing accessKey

        await expect(findOne(mockParams)).rejects.toThrow(); // Or handle as you prefer

        // If you *don't* throw an error but handle it gracefully (e.g., return null),
        // then you would change the test to:
        // const result = await findOne(mockParams);
        // expect(result).toBeNull();
    });
});