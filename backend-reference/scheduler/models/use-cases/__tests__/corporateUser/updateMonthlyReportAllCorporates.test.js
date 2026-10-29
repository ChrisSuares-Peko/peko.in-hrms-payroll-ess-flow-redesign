const { updateMonthlyReportAllCorporates } = require('../../corporateUser');
const systemUser = require('../../../entities/systemUser');
const sequelizeConfig = require('../../../../configs/database/index');
const { scheduleMonthlyReportOfCorporates } = require('../../../../services/scheduleReports');

jest.mock('@logtail/node', () => ({
    Logtail: jest.fn().mockImplementation(() => ({
        info: jest.fn(),
        error: jest.fn(),
    })),
}));

beforeEach(() => {
    jest.clearAllMocks();
});

describe('updateMonthlyReportAllCorporates', () => {
    it('should update admin monthly report and schedule report', async () => {
        const mockAdmin = {
            credentialId: 1,
            monthlyReport: { isActive: true, day: 1 },
            email: 'admin@test.com'
        };
        const mockUpdatedAdmin = {
            credentialId: 1,
            monthlyReport: { isActive: true, day: 15 }
        };
        systemUser.findOne
            .mockResolvedValueOnce(mockAdmin)
            .mockResolvedValueOnce(mockUpdatedAdmin);
        sequelizeConfig.query.mockResolvedValue(undefined);

        const result = await updateMonthlyReportAllCorporates(1, { day: 15 });
        expect(result).toEqual(mockAdmin);
        expect(scheduleMonthlyReportOfCorporates).toHaveBeenCalled();
    });

    it('should log error when admin user not found', async () => {
        systemUser.findOne.mockResolvedValue(null);

        const result = await updateMonthlyReportAllCorporates(999, {});
        expect(result).toBeNull();
    });

    it('should throw error on failure', async () => {
        systemUser.findOne.mockRejectedValue(new Error('DB Error'));

        await expect(updateMonthlyReportAllCorporates(1, {})).rejects.toThrow();
    });
});
