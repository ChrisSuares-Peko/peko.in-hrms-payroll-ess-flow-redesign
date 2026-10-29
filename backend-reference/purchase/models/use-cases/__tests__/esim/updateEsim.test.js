const { updateEsim } = require('../../../use-cases/esim');
const esim = require('../../../entities/esim');

jest.mock('../../../entities/esim', () => ({
    update: jest.fn(),
}));

describe('updateEsim', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('should update an eSIM plan successfully', async () => {
        const mockId = 1;
        const mockUpdateData = { name: 'Updated Plan', price: 20 };
        const mockUpdatedEsim = [{ id: mockId, ...mockUpdateData }];

        esim.update.mockResolvedValue([1, mockUpdatedEsim]);

        const result = await updateEsim(mockId, mockUpdateData);

        expect(esim.update).toHaveBeenCalledWith(mockUpdateData, {
            where: { id: mockId },
            returning: true,
        });
        expect(result).toEqual({
            success: true,
            message: "Esim Plans updated successfully",
            data: mockUpdatedEsim[0],
        });
    });

    it('should return a message if no eSIM plan is updated', async () => {
        const mockId = 2;
        const mockUpdateData = { name: 'No Change Plan', price: 30 };

        esim.update.mockResolvedValue([0, []]);

        const result = await updateEsim(mockId, mockUpdateData);

        expect(result).toEqual({
            success: false,
            message: "Esim Plans not found or no changes were made",
        });
    });

    it('should return an error message if the database query fails', async () => {
        const mockId = 3;
        const mockUpdateData = { name: 'Error Plan', price: 50 };
        const mockError = new Error('Database error');

        esim.update.mockRejectedValue(mockError);

        const result = await updateEsim(mockId, mockUpdateData);

        expect(result).toEqual({
            success: false,
            message: "An error occurred while updating the Esim Plans",
        });
    });
});
