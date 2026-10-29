const { findExistingHolidays } =require('../../../use-cases/holiyDay');
const Holiday = require('../../../entities/holiyDay'); // Adjust the path accordingly
const mongoose = require('mongoose'); // Import mongoose

jest.mock('../../../entities/holiyDay');
describe('findExistingHolidays', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('should find an existing holiday with a different ID and matching title or date range', async () => {
        const userId = 'corporateUserId1';
        const holidayId = 'holidayId1';
        const trimmedTitle = 'Holiday Title';
        const start = new Date('2024-08-01');
        const end = new Date('2024-08-01');

        const mockHoliday = {
            _id: new mongoose.Types.ObjectId(),
            title: trimmedTitle,
            start: start,
            end: end
        };

        Holiday.findOne.mockResolvedValue(mockHoliday);

        const result = await findExistingHolidays(userId, holidayId, trimmedTitle, start, end);

        expect(Holiday.findOne).toHaveBeenCalledWith({
            _id: { $ne: holidayId },
            corporateUser: userId,
            $or: [
                { title: trimmedTitle },
                { $and: [{ start }, { end }] }
            ]
        });
        expect(result).toEqual(mockHoliday);
    });

    it('should return null if no existing holiday is found', async () => {
        const userId = 'corporateUserId1';
        const holidayId = 'holidayId1';
        const trimmedTitle = 'Holiday Title';
        const start = new Date('2024-08-01');
        const end = new Date('2024-08-01');

        Holiday.findOne.mockResolvedValue(null);

        const result = await findExistingHolidays(userId, holidayId, trimmedTitle, start, end);

        expect(Holiday.findOne).toHaveBeenCalledWith({
            _id: { $ne: holidayId },
            corporateUser: userId,
            $or: [
                { title: trimmedTitle },
                { $and: [{ start }, { end }] }
            ]
        });
        expect(result).toBeNull();
    });

    it('should handle errors gracefully', async () => {
        const userId = 'corporateUserId1';
        const holidayId = 'holidayId1';
        const trimmedTitle = 'Holiday Title';
        const start = new Date('2024-08-01');
        const end = new Date('2024-08-01');
        const mockError = new Error('Database error');

        console.log = jest.fn();
        Holiday.findOne.mockRejectedValue(mockError);

        const result = await findExistingHolidays(userId, holidayId, trimmedTitle, start, end);

        expect(Holiday.findOne).toHaveBeenCalledWith({
            _id: { $ne: holidayId },
            corporateUser: userId,
            $or: [
                { title: trimmedTitle },
                { $and: [{ start }, { end }] }
            ]
        });
        expect(result).toEqual(mockError);
    });
});