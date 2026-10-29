const { deleteOverTime } = require('../../../use-cases/overTime'); 
const Overtime = require('../../../entities/overTime'); 

jest.mock('../../../entities/overTime');

describe('deleteOverTime', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('should delete an overtime entry successfully', async () => {
        const params = {
            corporateUserID: 'validCorporateUserId',
            overTimeId: 'validOverTimeId'
        };

        const mockDeletedOvertimeData = {
            _id: params.overTimeId,
            corporateUser: params.corporateUserID,
            paymentStatus: 'APPROVED',
            overTimeDate: new Date('2024-08-15T00:00:00.000Z')
        };

        Overtime.findOneAndDelete.mockResolvedValue(mockDeletedOvertimeData);

        const result = await deleteOverTime(params);

        expect(Overtime.findOneAndDelete).toHaveBeenCalledWith({
            _id: params.overTimeId,
            corporateUser: params.corporateUserID
        });

        expect(result).toEqual(mockDeletedOvertimeData);
    });

    it('should return null if no overtime entry is found to delete', async () => {
        const params = {
            corporateUserID: 'validCorporateUserId',
            overTimeId: 'nonexistentOverTimeId'
        };

        Overtime.findOneAndDelete.mockResolvedValue(null);

        const result = await deleteOverTime(params);

        expect(Overtime.findOneAndDelete).toHaveBeenCalledWith({
            _id: params.overTimeId,
            corporateUser: params.corporateUserID
        });

        expect(result).toBeNull();
    });

    it('should handle errors gracefully', async () => {
        const params = {
            corporateUserID: 'validCorporateUserId',
            overTimeId: 'validOverTimeId'
        };

        const mockError = new Error('Database error');

        Overtime.findOneAndDelete.mockRejectedValue(mockError);

        const result = await deleteOverTime(params);

        expect(Overtime.findOneAndDelete).toHaveBeenCalledWith({
            _id: params.overTimeId,
            corporateUser: params.corporateUserID
        });

        expect(result).toEqual(mockError);
    });
});
