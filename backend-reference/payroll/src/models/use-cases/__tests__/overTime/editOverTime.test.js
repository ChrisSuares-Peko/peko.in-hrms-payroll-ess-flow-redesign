const { editOverTime } = require('../../../use-cases/overTime'); 
const Overtime = require('../../../entities/overTime'); 

jest.mock('../../../entities/overTime');

describe('editOverTime', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('should edit an overtime entry successfully', async () => {
        const params = {
            corporateUserID: 'validCorporateUserId',
            overTimeId: 'validOverTimeId',
            editData: {
                paymentStatus: 'PAID',
                overTimeHours: 5
            }
        };

        const mockEditedOvertimeData = {
            n: 1,
            nModified: 1,
            ok: 1
        };

        Overtime.updateOne.mockResolvedValue(mockEditedOvertimeData);

        const result = await editOverTime(params);

        expect(Overtime.updateOne).toHaveBeenCalledWith({
            _id: params.overTimeId,
            corporateUser: params.corporateUserID
        }, params.editData);

        expect(result).toEqual(mockEditedOvertimeData);
    });

    it('should return no modifications if overtime entry is not found', async () => {
        const params = {
            corporateUserID: 'validCorporateUserId',
            overTimeId: 'nonexistentOverTimeId',
            editData: {
                paymentStatus: 'PAID',
                overTimeHours: 5
            }
        };

        const mockNoEditOvertimeData = {
            n: 0,
            nModified: 0,
            ok: 1
        };

        Overtime.updateOne.mockResolvedValue(mockNoEditOvertimeData);

        const result = await editOverTime(params);

        expect(Overtime.updateOne).toHaveBeenCalledWith({
            _id: params.overTimeId,
            corporateUser: params.corporateUserID
        }, params.editData);

        expect(result).toEqual(mockNoEditOvertimeData);
    });

    it('should handle errors gracefully', async () => {
        const params = {
            corporateUserID: 'validCorporateUserId',
            overTimeId: 'validOverTimeId',
            editData: {
                paymentStatus: 'PAID',
                overTimeHours: 5
            }
        };

        const mockError = new Error('Database error');

        Overtime.updateOne.mockRejectedValue(mockError);

        const result = await editOverTime(params);

        expect(Overtime.updateOne).toHaveBeenCalledWith({
            _id: params.overTimeId,
            corporateUser: params.corporateUserID
        }, params.editData);

        expect(result).toEqual(mockError);
    });
});
