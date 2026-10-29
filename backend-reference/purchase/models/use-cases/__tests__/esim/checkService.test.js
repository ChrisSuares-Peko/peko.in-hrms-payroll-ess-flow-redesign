const { checkService } = require('../../../use-cases/esim');
const serviceOperator = require('../../../entities/serviceOperator');
const vendors = require('../../../entities/vendor');

jest.mock('../../../entities/serviceOperator', () => ({
    findOne: jest.fn(),
}));

describe('checkService', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('should return service operator data when accessKey is found', async () => {
        const mockAccessKey = 'test-access-key';
        const mockServiceData = {
            id: 1,
            accessKey: mockAccessKey,
            vendors: {
                apiUrl: 'https://api.example.com',
                optional1: 'value1',
                optional2: 'value2',
                optional3: 'value3',
                optional4: 'value4',
                optional5: 'value5',
            },
        };

        serviceOperator.findOne.mockResolvedValue(mockServiceData);

        const result = await checkService(mockAccessKey);

        expect(serviceOperator.findOne).toHaveBeenCalledWith({
            include: [{
                model: vendors,
                attributes: ['apiUrl', 'optional1', 'optional2', 'optional3', 'optional4', 'optional5'],
            }],
            where: { accessKey: mockAccessKey },
            raw: true,
            nest: true,
        });
        expect(result).toEqual(mockServiceData);
    });

    it('should return false if no service operator data is found', async () => {
        const mockAccessKey = 'invalid-access-key';
        serviceOperator.findOne.mockResolvedValue(null);

        const result = await checkService(mockAccessKey);

        expect(result).toBe(false);
    });

    it('should return false if an error occurs during query execution', async () => {
        const mockAccessKey = 'test-access-key';
        const mockError = new Error('Database error');

        serviceOperator.findOne.mockRejectedValue(mockError);

        const result = await checkService(mockAccessKey);

        expect(result).toBe(false);
    });
});
