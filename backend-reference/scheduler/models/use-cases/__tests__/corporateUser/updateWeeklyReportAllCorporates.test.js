const { updateWeeklyReportAllCorporates } = require('../../corporateUser');
const systemUser = require('../../../entities/systemUser');
const sequelizeConfig = require('../../../../configs/database/index');
const { scheduleWeeklyReportOfCorporates } = require('../../../../services/scheduleReports');

jest.mock('@logtail/node', () => ({
    Logtail: jest.fn().mockImplementation(() => ({
        info: jest.fn(),
        error: jest.fn(),
    })),
}));

beforeEach(() => {
    jest.clearAllMocks();
});

describe('updateWeeklyReportAllCorporates', () => {
    it('should update admin weekly report and schedule report', async () => {
        const mockAdmin = {
            credentialId: 1,
            weeklyReport: { isActive: true, day: 'Monday' },
            email: 'admin@test.com'
        };
        const mockUpdatedAdmin = {
            credentialId: 1,
            weeklyReport: { isActive: true, day: 'Wednesday' }
        };
        systemUser.findOne
            .mockResolvedValueOnce(mockAdmin)
            .mockResolvedValueOnce(mockUpdatedAdmin);
        sequelizeConfig.query.mockResolvedValue(undefined);

        const result = await updateWeeklyReportAllCorporates(1, { day: 'Wednesday' });
        expect(result).toEqual(mockAdmin);
        expect(scheduleWeeklyReportOfCorporates).toHaveBeenCalled();
    });

    it('should log error when admin user not found', async () => {
        systemUser.findOne.mockResolvedValue(null);

        const result = await updateWeeklyReportAllCorporates(999, {});
        expect(result).toBeNull();
    });

    it('should throw error on failure', async () => {
        systemUser.findOne.mockRejectedValue(new Error('DB Error'));

        await expect(updateWeeklyReportAllCorporates(1, {})).rejects.toThrow();
    });
});
