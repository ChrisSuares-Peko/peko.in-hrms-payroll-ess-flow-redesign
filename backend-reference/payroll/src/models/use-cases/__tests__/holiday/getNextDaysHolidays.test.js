const { getNextDaysHolidays } = require('../../../use-cases/holiyDay'); 
const Holiday = require('../../../entities/holiyDay'); // Adjust the path accordingly

jest.mock('../../../entities/holiyDay');

describe('getNextDaysHolidays', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('should return holidays for the next day for valid inputs', async () => {
        const corporateUserID = 'corporateUserID1';
        const mockHolidays = [
            { _id: 'holidayId1', start: new Date('2024-08-10T10:00:00.000Z'), sendPriorEmail: true, isEmailSent: false },
            { _id: 'holidayId2', start: new Date('2024-08-10T15:00:00.000Z'), sendPriorEmail: true, isEmailSent: false },
        ];

        Holiday.find.mockResolvedValue(mockHolidays);

        const result = await getNextDaysHolidays(corporateUserID);

        expect(Holiday.find).toHaveBeenCalledWith({
            corporateUser: corporateUserID,
            $and: [
                { start: { $gte: expect.any(Date) } },
                { start: { $lte: expect.any(Date) } }
            ],
            isEmailSent: false
        });
        expect(result).toEqual(mockHolidays);
    });

    it('should handle no holidays found', async () => {
        const corporateUserID = 'corporateUserID1';

        Holiday.find.mockResolvedValue([]);

        const result = await getNextDaysHolidays(corporateUserID);

        expect(Holiday.find).toHaveBeenCalledWith({
            corporateUser: corporateUserID,
            $and: [
                { start: { $gte: expect.any(Date) } },
                { start: { $lte: expect.any(Date) } }
            ],
            isEmailSent: false
        });
        expect(result).toEqual([]);
    });

    it('should handle errors gracefully', async () => {
        const corporateUserID = 'corporateUserID1';
        const mockError = new Error('Database error');

        Holiday.find.mockRejectedValue(mockError);

        const result = await getNextDaysHolidays(corporateUserID);

        expect(result).toEqual(mockError);
    });
});
