const { findOne } = require('../../serviceOperator');
const serviceOperator = require('../../../entities/serviceOperator');
const vendors = require('../../../entities/vendor');

beforeEach(() => {
    jest.clearAllMocks();
});

describe('findOne', () => {
    it('should find a service operator by accessKey with vendor include', async () => {
        const mockResult = { id: 1, accessKey: 'KEY1', vendor: { apiUrl: 'http://api.test' } };
        serviceOperator.findOne.mockResolvedValue(mockResult);

        const result = await findOne({ accessKey: 'KEY1' });
        expect(result).toEqual(mockResult);
        expect(serviceOperator.findOne).toHaveBeenCalledWith(expect.objectContaining({
            include: [{
                model: vendors,
                attributes: ['apiUrl', 'optional1', 'optional2', 'optional3', 'optional4', 'optional5', 'optional6', 'healthUrl', 'optionals', 'vendorEmail']
            }],
            where: { accessKey: 'KEY1' },
            raw: true,
            nest: true,
        }));
    });

    it('should include serviceType in where clause when provided', async () => {
        serviceOperator.findOne.mockResolvedValue(null);

        await findOne({ accessKey: 'KEY1', serviceType: '1' });
        expect(serviceOperator.findOne).toHaveBeenCalledWith(expect.objectContaining({
            where: { accessKey: 'KEY1', serviceType: '1' }
        }));
    });

    it('should return null when no service operator found', async () => {
        serviceOperator.findOne.mockResolvedValue(null);

        const result = await findOne({ accessKey: 'NONE' });
        expect(result).toBeNull();
    });
});
