const { getGstDetails } = require('../../setting');
const setting = require('../../../entities/setting');

jest.mock('../../../entities/setting');

describe('getGstDetails', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('should return GST details from settings', async () => {
        const mockResult = { id: 1, name: 'taxRate', details: { rate: 5 } };
        setting.findOne.mockResolvedValue(mockResult);

        const result = await getGstDetails();

        expect(setting.findOne).toHaveBeenCalledWith({
            where: { name: 'taxRate' },
        });
        expect(result).toEqual(mockResult);
    });

    it('should return null when no GST details found', async () => {
        setting.findOne.mockResolvedValue(null);

        const result = await getGstDetails();
        expect(result).toBeNull();
    });
});
