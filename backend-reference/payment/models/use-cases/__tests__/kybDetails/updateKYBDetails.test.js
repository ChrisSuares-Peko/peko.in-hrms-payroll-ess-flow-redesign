const { updateKYBDetails } = require('../../../use-cases/vendorPayout/kybDetails'); // Adjust path
const kybDetails = require('../../../entities/vendorPayout/kybDetails'); // Adjust path

jest.mock('../../../entities/vendorPayout/kybDetails', () => ({
    findOne: jest.fn(),
    update: jest.fn(),
}));

describe('updateKYBDetails', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('should update KYB details successfully', async () => {
        const mockId = 1;
        const mockNewData = { companyName: 'Updated Company Name' };

        kybDetails.findOne.mockResolvedValue({ id: mockId }); // KYB details exists
        kybDetails.update.mockResolvedValue([1]); // One row updated

        const result = await updateKYBDetails(mockId, mockNewData);

        expect(kybDetails.findOne).toHaveBeenCalledWith({ where: { id: mockId } });
        expect(kybDetails.update).toHaveBeenCalledWith(mockNewData, { where: { id: mockId } });
        expect(result).toEqual({ success: true, data: {} });
    });

    it('should return an error if KYB details does not exist', async () => {
        const mockId = 1;
        const mockNewData = { companyName: 'Updated Company Name' };

        kybDetails.findOne.mockResolvedValue(null); // KYB details does not exist

        const result = await updateKYBDetails(mockId, mockNewData);

        expect(kybDetails.findOne).toHaveBeenCalledWith({ where: { id: mockId } });
        expect(kybDetails.update).not.toHaveBeenCalled();
        expect(result).toEqual({
            success: false,
            message: "KYB details is not existing with the given details",
        });
    });

    it('should return an error if no rows are updated', async () => {
        const mockId = 1;
        const mockNewData = { companyName: 'Updated Company Name' };

        kybDetails.findOne.mockResolvedValue({ id: mockId }); // KYB details exists
        kybDetails.update.mockResolvedValue([0]); // No rows updated

        const result = await updateKYBDetails(mockId, mockNewData);

        expect(kybDetails.findOne).toHaveBeenCalledWith({ where: { id: mockId } });
        expect(kybDetails.update).toHaveBeenCalledWith(mockNewData, { where: { id: mockId } });
        expect(result).toEqual({
            success: false,
            message: "Something went wrong while updating kyb details",
        });
    });

    it('should handle errors during database operations (findOne)', async () => {
        const mockId = 1;
        const mockNewData = { /* ... */ };
        const mockError = new Error('Database error');

        kybDetails.findOne.mockRejectedValue(mockError);

        await expect(updateKYBDetails(mockId, mockNewData)).rejects.toThrow(mockError);

        expect(kybDetails.findOne).toHaveBeenCalledWith({ where: { id: mockId } });
    });

    it('should handle errors during database operations (update)', async () => {
        const mockId = 1;
        const mockNewData = { /* ... */ };
        const mockError = new Error('Database error');

        kybDetails.findOne.mockResolvedValue({ id: mockId });
        kybDetails.update.mockRejectedValue(mockError);

        await expect(updateKYBDetails(mockId, mockNewData)).rejects.toThrow(mockError);

        expect(kybDetails.findOne).toHaveBeenCalledWith({ where: { id: mockId } });
        expect(kybDetails.update).toHaveBeenCalledWith(mockNewData, { where: { id: mockId } });
    });
});