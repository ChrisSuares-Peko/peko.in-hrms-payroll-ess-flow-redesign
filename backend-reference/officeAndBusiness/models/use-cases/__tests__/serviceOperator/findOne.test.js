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

    it('should return a service operator with vendor details when found', async () => {
        const mockParams = { accessKey: 'abc123', serviceType: 'internet' };
        const mockResponse = {
            id: 1,
            accessKey: 'abc123',
            serviceType: 'internet',
            vendor: {
                apiUrl: 'https://api.vendor.com',
                optional1: 'option1',
                optional2: 'option2',
                optional3: 'option3',
                optional4: 'option4',
                optional5: 'option5',
                optional6: 'option6',
                vendorEmail: 'vendor@example.com',
                vendorName: 'VendorName',
                type: 'premium',
            },
        };

        serviceOperator.findOne.mockResolvedValue(mockResponse);

        const result = await findOne(mockParams);

        expect(serviceOperator.findOne).toHaveBeenCalledWith({
            include: [
                {
                    model: vendors,
                    attributes: [
                        'apiUrl', 'optional1', 'optional2', 'optional3', 'optional4', 'optional5', 'optional6',
                        'vendorEmail', 'vendorName', 'type', 'healthUrl',
                    ],
                },
            ],
            where: expect.objectContaining({
                accessKey: mockParams.accessKey,
                serviceType: mockParams.serviceType,
            }),
            raw: true,
            nest: true,
        });
        expect(result).toEqual(mockResponse);
    });

    it('should return null when no service operator is found', async () => {
        const mockParams = { accessKey: 'invalidKey' };
        serviceOperator.findOne.mockResolvedValue(null);

        const result = await findOne(mockParams);

        expect(result).toBeNull();
    });

    it('should throw an error when findOne fails', async () => {
        const mockParams = { accessKey: 'errorKey' };
        const mockError = new Error('Database error');

        serviceOperator.findOne.mockRejectedValue(mockError);

        await expect(findOne(mockParams)).rejects.toThrow('Database error');
    });
});
