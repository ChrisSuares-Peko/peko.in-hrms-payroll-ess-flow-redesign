const { changeReminderDay } = require('../../preReminders');
const Setting = require('../../../entities/setting');

beforeEach(() => {
    jest.clearAllMocks();
});

describe('changeReminderDay', () => {
    it('should change the reminder day and return updated details', async () => {
        const mockSetting = {
            details: [5, 10, 15],
            update: jest.fn().mockResolvedValue(true)
        };
        Setting.findOne.mockResolvedValue(mockSetting);

        const result = await changeReminderDay(10, 20);
        expect(result).toEqual([5, 20, 15]);
        expect(mockSetting.update).toHaveBeenCalledWith({ details: [5, 20, 15] });
    });

    it('should return null when setting not found', async () => {
        Setting.findOne.mockResolvedValue(null);

        const result = await changeReminderDay(10, 20);
        expect(result).toBeNull();
    });

    it('should not change anything if currentDay is not found in details', async () => {
        const mockSetting = {
            details: [5, 10, 15],
            update: jest.fn().mockResolvedValue(true)
        };
        Setting.findOne.mockResolvedValue(mockSetting);

        const result = await changeReminderDay(99, 20);
        expect(result).toEqual([5, 10, 15]);
    });
});
