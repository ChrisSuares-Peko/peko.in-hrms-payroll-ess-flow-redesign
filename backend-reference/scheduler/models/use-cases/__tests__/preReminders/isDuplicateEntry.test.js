const { isDuplicateEntry } = require('../../preReminders');
const Setting = require('../../../entities/setting');

beforeEach(() => {
    jest.clearAllMocks();
});

describe('isDuplicateEntry', () => {
    it('should return false when no duplicate is found', async () => {
        Setting.findOne.mockResolvedValue({ details: [5, 10, 15] });

        const result = await isDuplicateEntry(5, 20);
        expect(result).toBe(false);
    });

    it('should return duplicate message when day already exists', async () => {
        Setting.findOne.mockResolvedValue({ details: [5, 10, 15] });

        const result = await isDuplicateEntry(5, 10);
        expect(result).toEqual({ message: 'Reminder day already exists' });
    });

    it('should return false when newDay matches currentDay (editing same entry)', async () => {
        Setting.findOne.mockResolvedValue({ details: [5, 10, 15] });

        const result = await isDuplicateEntry(10, 10);
        expect(result).toBe(false);
    });
});
