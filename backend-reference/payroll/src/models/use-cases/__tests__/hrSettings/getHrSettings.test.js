const HrSettings = require('../../../entities/hrSettings'); // Adjust the path to your actual HrSettings model
const { getHrsettings } = require('../../../use-cases/hrSettings');

jest.mock('../../../entities/hrSettings');

describe('getHrsettings Use-Case', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('should return HR settings for a given corporate user', async () => {
        const corporateUser = 'corporateUserID';
        const mockSettings = [
            { _id: '1', corporateUser, settingName: 'setting1' },
            { _id: '2', corporateUser, settingName: 'setting2' }
        ];

        HrSettings.find.mockResolvedValue(mockSettings);

        const result = await getHrsettings(corporateUser);

        expect(HrSettings.find).toHaveBeenCalledWith({ corporateUser });
        expect(result).toEqual(mockSettings);
    });

    it('should handle errors gracefully', async () => {
        const corporateUser = 'corporateUserID';
        const errorMessage = 'Database error';

        HrSettings.find.mockRejectedValue(new Error(errorMessage));

        const result = await getHrsettings(corporateUser);

        expect(result).toEqual(new Error(errorMessage));
    });
});
