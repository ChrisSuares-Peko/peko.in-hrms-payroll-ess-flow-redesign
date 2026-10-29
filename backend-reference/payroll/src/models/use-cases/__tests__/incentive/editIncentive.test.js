const { editIncentive } = require('../../../use-cases/incentives'); 
const Incentives = require('../../../entities/incentives'); 

jest.mock('../../../entities/incentives');

describe('editIncentive', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('should edit an incentive and return the updated data', async () => {
        const params = {
            corporateUserID: 'validCorporateUserId',
            incentiveId: 'validIncentiveId',
            editData: { paymentStatus: 'Updated' },
        };

        const mockEditIncentiveData = { n: 1, nModified: 1, ok: 1 };

        Incentives.updateOne.mockResolvedValue(mockEditIncentiveData);

        const result = await editIncentive(params);

        expect(Incentives.updateOne).toHaveBeenCalledWith(
            {
                _id: params.incentiveId,
                corporateUser: params.corporateUserID,
            },
            params.editData
        );

        expect(result).toEqual(mockEditIncentiveData);
    });

    it('should return an error if updating the incentive fails', async () => {
        const params = {
            corporateUserID: 'validCorporateUserId',
            incentiveId: 'validIncentiveId',
            editData: { paymentStatus: 'Updated' },
        };

        const mockError = new Error('Something went wrong while updating the incetive data');

        Incentives.updateOne.mockRejectedValue(mockError);

        const result = await editIncentive(params);

        expect(Incentives.updateOne).toHaveBeenCalledWith(
            {
                _id: params.incentiveId,
                corporateUser: params.corporateUserID,
            },
            params.editData
        );

        expect(result).toEqual(mockError);
    });
});
