const { updatePartnerPermissionById } = require('../../partnerPermission');
const partnerPermission = require('../../../entities/partnerPermission');
const ErrorResponse = require('../../../../utils/error-response');

jest.mock('../../../entities/partnerPermission', () => ({
    update: jest.fn(),
}));

describe('updatePartnerPermissionById', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('should successfully update the partner permission', async () => {
        const mockId = 1;
        const mockUpdatedData = { permission: 'new_permission' };
        const mockResult = [1]; // Sequelize's `update` method returns an array: [numberOfRowsUpdated]

        partnerPermission.update.mockResolvedValue(mockResult);

        const result = await updatePartnerPermissionById(mockId, mockUpdatedData);

        expect(partnerPermission.update).toHaveBeenCalledWith(mockUpdatedData, {
            where: { id: mockId },
        });
        expect(result).toEqual(mockResult);
    });


    it('should handle errors gracefully', async () => {
        const mockId = 1;
        const mockUpdatedData = { permission: 'new_permission' };
        const mockError = new Error('Database error');

        partnerPermission.update.mockRejectedValue(mockError);

        const result = await updatePartnerPermissionById(mockId, mockUpdatedData);

        expect(partnerPermission.update).toHaveBeenCalledWith(mockUpdatedData, {
            where: { id: mockId },
        });
        expect(result).toEqual(
            new ErrorResponse('Something went wrong, please try again later.', 500)
        );
    });
});
