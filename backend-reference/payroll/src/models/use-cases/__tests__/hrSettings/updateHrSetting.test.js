const HrSettings = require('../../../entities/hrSettings'); // Adjust the path to your actual HrSettings model
const { updateHrSetting } = require('../../../use-cases/hrSettings');

jest.mock('../../../entities/hrSettings');

describe('updateHrSetting Use-Case', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('should update and return the HR setting for a given corporate user', async () => {
        const corporateUserID = 'corporateUserID';
        const hrSettingsData = {
            payrollSettings: {
                organizationWorkingDays: 5,
                salaryCycleDay: 25,
                payrollStartsFrom: '2023-01-01'
            },
            officialDocuments: {
                hrManagerName: 'John Doe',
                hrManagerSignature: 'Signature',
                companyOfficialStamp: 'Stamp'
            }
        };
        const mockUpdatedSetting = {
            _id: '1',
            corporateUser: corporateUserID,
            ...hrSettingsData
        };

        HrSettings.findOneAndUpdate.mockResolvedValue(mockUpdatedSetting);

        const result = await updateHrSetting(corporateUserID, hrSettingsData);

        expect(HrSettings.findOneAndUpdate).toHaveBeenCalledWith(
            { corporateUser: corporateUserID },
            hrSettingsData,
            { new: true }
        );
        expect(result).toEqual(mockUpdatedSetting);
    });

    it('should handle errors gracefully', async () => {
        const corporateUserID = 'corporateUserID';
        const hrSettingsData = {
            payrollSettings: {
                organizationWorkingDays: 5,
                salaryCycleDay: 25,
                payrollStartsFrom: '2023-01-01'
            },
            officialDocuments: {
                hrManagerName: 'John Doe',
                hrManagerSignature: 'Signature',
                companyOfficialStamp: 'Stamp'
            }
        };
        const errorMessage = 'Database error';

        console.log = jest.fn();
        HrSettings.findOneAndUpdate.mockRejectedValue(new Error(errorMessage));

        const result = await updateHrSetting(corporateUserID, hrSettingsData);

        expect(HrSettings.findOneAndUpdate).toHaveBeenCalledWith(
            { corporateUser: corporateUserID },
            hrSettingsData,
            { new: true }
        );
        expect(result).toEqual(new Error(errorMessage));
    });
});
