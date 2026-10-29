const { updateDailyReportAndSendToAdmin } = require('../../corporateUser');
const systemUser = require('../../../entities/systemUser');
const sequelizeConfig = require('../../../../configs/database/index');
const { scheduleDailyReportOfCorporatesAdmin } = require('../../../../services/scheduleReports');

jest.mock('@logtail/node', () => ({
    Logtail: jest.fn().mockImplementation(() => ({
        info: jest.fn(),
        error: jest.fn(),
    })),
}));

beforeEach(() => {
    jest.clearAllMocks();
});

describe('updateDailyReportAndSendToAdmin', () => {
    it('should update admin daily report and schedule report', async () => {
        const mockAdmin = {
            credentialId: 1,
            dailyReport: { isActive: true, time: '09:00' },
            email: 'admin@test.com'
        };
        const mockUpdatedAdmin = {
            credentialId: 1,
            dailyReport: { isActive: true, time: '10:00' }
        };
        systemUser.findOne
            .mockResolvedValueOnce(mockAdmin)
            .mockResolvedValueOnce(mockUpdatedAdmin);
        sequelizeConfig.query.mockResolvedValue(undefined);

        const result = await updateDailyReportAndSendToAdmin(1, { time: '10:00' });
        expect(result).toEqual(mockAdmin);
        expect(scheduleDailyReportOfCorporatesAdmin).toHaveBeenCalled();
    });

    it('should log error when admin user not found', async () => {
        systemUser.findOne.mockResolvedValue(null);

        const result = await updateDailyReportAndSendToAdmin(999, { time: '10:00' });
        expect(result).toBeNull();
        expect(scheduleDailyReportOfCorporatesAdmin).not.toHaveBeenCalled();
    });

    it('should throw error on failure', async () => {
        systemUser.findOne.mockRejectedValue(new Error('DB Error'));

        await expect(updateDailyReportAndSendToAdmin(1, {})).rejects.toThrow();
    });
});
