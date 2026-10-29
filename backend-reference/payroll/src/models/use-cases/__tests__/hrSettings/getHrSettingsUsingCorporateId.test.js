const HrSettings = require('../../../entities/hrSettings'); // Adjust the path to your actual HrSettings model
const { getHrSettingsUsingCorporateId } = require('../../../use-cases/hrSettings');

jest.mock('../../../entities/hrSettings');

describe('getHrSettingsUsingCorporateId Use-Case', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('should return HR settings for a given corporate user with specific conditions', async () => {
        const corporateUser = 'corporateUserID';
        const mockSettings = [
            { 
                _id: '1', 
                corporateUser, 
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
            }
        ];

        HrSettings.find.mockResolvedValue(mockSettings);

        const result = await getHrSettingsUsingCorporateId(corporateUser);

        expect(HrSettings.find).toHaveBeenCalledWith({
            corporateUser,
            $and: [
                { "payrollSettings.organizationWorkingDays": { $exists: true, $ne: null } },
                { "payrollSettings.salaryCycleDay": { $exists: true, $ne: null } },
                { "payrollSettings.payrollStartsFrom": { $exists: true, $ne: null } },
                { "officialDocuments.hrManagerName": { $exists: true, $ne: null } },
                { "officialDocuments.hrManagerSignature": { $exists: true, $ne: null } },
                { "officialDocuments.companyOfficialStamp": { $exists: true, $ne: null } }
            ]
        });
        expect(result).toEqual(mockSettings);
    });

    it('should handle errors gracefully', async () => {
        const corporateUser = 'corporateUserID';
        const errorMessage = 'Database error';

        HrSettings.find.mockRejectedValue(new Error(errorMessage));

        const result = await getHrSettingsUsingCorporateId(corporateUser);

        expect(result).toEqual(new Error(errorMessage));
    });
});
