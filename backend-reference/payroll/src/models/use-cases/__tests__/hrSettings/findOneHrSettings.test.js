const OrganizationSettings = require('../../../entities/organizationSettings');
const { findOneHrSettings } = require('../../../use-cases/hrSettings');

jest.mock('../../../entities/organizationSettings');

describe('findOneHrSettings Use-Case', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('should return the HR settings for a given corporate user', async () => {
        const corporateUserId = 'corporateUserId';
        const mockHrSettings = {
            _id: 'hrSettingsId',
            corporateUser: corporateUserId,
            setting: 'exampleSetting',
        };

        const populateMock = jest.fn().mockResolvedValue(mockHrSettings);
        OrganizationSettings.findOne.mockReturnValue({ populate: populateMock });

        const result = await findOneHrSettings(corporateUserId);

        expect(OrganizationSettings.findOne).toHaveBeenCalledWith({ corporateUser: corporateUserId });
        expect(populateMock).toHaveBeenCalledWith('corporateUser');
        expect(result).toEqual(mockHrSettings);
    });

    it('should handle errors gracefully', async () => {
        const corporateUserId = 'corporateUserId';
        const errorMessage = 'Database error';

        OrganizationSettings.findOne.mockReturnValue({
            populate: jest.fn().mockRejectedValue(new Error(errorMessage)),
        });

        const result = await findOneHrSettings(corporateUserId);

        expect(result).toEqual(new Error(errorMessage));
    });
});
