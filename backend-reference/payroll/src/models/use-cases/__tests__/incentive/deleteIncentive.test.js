const { deleteIncentive } = require('../../../use-cases/incentives'); 
const Incentives = require('../../../entities/incentives'); 

jest.mock('../../../entities/incentives');

describe('deleteIncentive', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('should delete an incentive and return the deleted data', async () => {
        const params = {
            corporateUserID: 'validCorporateUserId',
            incentiveId: 'validIncentiveId',
        };

        const mockDeletedIncentiveData = {
            _id: 'validIncentiveId',
            corporateUser: 'validCorporateUserId',
            paymentStatus: 'Paid',
        };

        Incentives.findOneAndDelete.mockResolvedValue(mockDeletedIncentiveData);

        const result = await deleteIncentive(params);

        expect(Incentives.findOneAndDelete).toHaveBeenCalledWith({
            _id: params.incentiveId,
            corporateUser: params.corporateUserID,
        });

        expect(result).toEqual(mockDeletedIncentiveData);
    });

    it('should return null if no incentive is found', async () => {
        const params = {
            corporateUserID: 'validCorporateUserId',
            incentiveId: 'nonExistentIncentiveId',
        };

        Incentives.findOneAndDelete.mockResolvedValue(null);

        const result = await deleteIncentive(params);

        expect(Incentives.findOneAndDelete).toHaveBeenCalledWith({
            _id: params.incentiveId,
            corporateUser: params.corporateUserID,
        });

        expect(result).toBeNull();
    });

    it('should handle errors gracefully', async () => {
        const params = {
            corporateUserID: 'validCorporateUserId',
            incentiveId: 'validIncentiveId',
        };

        const mockError = new Error('Database error');

        Incentives.findOneAndDelete.mockRejectedValue(mockError);

        const result = await deleteIncentive(params);

        expect(Incentives.findOneAndDelete).toHaveBeenCalledWith({
            _id: params.incentiveId,
            corporateUser: params.corporateUserID,
        });

        expect(result).toEqual(mockError);
    });
});
