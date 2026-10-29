const { getSchedulerInterval } = require('../../../use-cases/settings');
const settings = require('../../../entities/setting');

jest.mock('../../../entities/setting', () => ({
    findOne: jest.fn(),
}));

describe('getSchedulerInterval', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('should return the interval when a matching setting is found', async () => {
        const mockSettingName = 'schedulerInterval';
        const mockSetting = {
            name: 'schedulerInterval',
            details: JSON.stringify({ interval: 10 }),
        };

        settings.findOne.mockResolvedValue(mockSetting);

        const result = await getSchedulerInterval(mockSettingName);

        expect(settings.findOne).toHaveBeenCalledWith({
            where: { name: mockSettingName },
        });

        expect(result).toBe(10);
    });

    it('should return the default interval (6) when the setting is found but interval is not defined', async () => {
        const mockSettingName = 'schedulerInterval';
        const mockSetting = {
            name: 'schedulerInterval',
            details: JSON.stringify({}),
        };

        settings.findOne.mockResolvedValue(mockSetting);

        const result = await getSchedulerInterval(mockSettingName);

        expect(settings.findOne).toHaveBeenCalledWith({
            where: { name: mockSettingName },
        });

        expect(result).toBe(6);
    });

    it('should return the default interval (6) when no matching setting is found', async () => {
        const mockSettingName = 'schedulerNotFound';

        settings.findOne.mockResolvedValue(null);

        const result = await getSchedulerInterval(mockSettingName);

        expect(settings.findOne).toHaveBeenCalledWith({
            where: { name: mockSettingName },
        });

        expect(result).toBe(6);
    });

    it('should return the default interval (6) and log an error when an exception occurs', async () => {
        const mockSettingName = 'schedulerInterval';
        const mockError = new Error('Database error');

        settings.findOne.mockRejectedValue(mockError);
        console.error = jest.fn();

        const result = await getSchedulerInterval(mockSettingName);

        expect(console.error).toHaveBeenCalledWith('Error fetching scheduler interval:', 'Database error');
        expect(result).toBe(6);
    });
});
