const HrSettings = require('../../../entities/hrSettings'); // Adjust the path to your actual HrSettings model
const { restrictPayrollSettings } = require('../../../use-cases/hrSettings');

jest.mock('../../../entities/hrSettings');

describe('restrictPayrollSettings Use-Case', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('should set payrollSettings.isEditable to false for a given corporate user', async () => {
        const corporateUserID = 'corporateUserID';
        const mockUpdatedSettings = {
            _id: 'hrSettingsId',
            corporateUser: corporateUserID,
            payrollSettings: {
                isEditable: false
            }
        };

        HrSettings.findOneAndUpdate.mockResolvedValue(mockUpdatedSettings);

        const result = await restrictPayrollSettings(corporateUserID);

        expect(HrSettings.findOneAndUpdate).toHaveBeenCalledWith(
            { corporateUser: corporateUserID },
            { 'payrollSettings.isEditable': false },
            { new: true }
        );
        expect(result).toEqual(mockUpdatedSettings);
    });

    it('should handle errors gracefully', async () => {
        const corporateUserID = 'corporateUserID';
        const errorMessage = 'Database error';

        HrSettings.findOneAndUpdate.mockRejectedValue(new Error(errorMessage));

        const result = await restrictPayrollSettings(corporateUserID);

        expect(result).toEqual(new Error(errorMessage));
    });
});
