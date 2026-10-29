const { updateBank } = require('../../../use-cases/bankDetails');
const bankDetails = require('../../../entities/bankDetails');

jest.mock('../../../entities/bankDetails', () => ({
    update: jest.fn(),
}));

describe('updateBank', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('should update the default field to false for other records if data.default is true', async () => {
        const mockData = {
            id: 'bankId123',
            credentialId: 'credentialId123',
            default: true,
            bankName: 'Bank A',
        };

        bankDetails.update.mockResolvedValue([1]); // Mocking the result of update

        const result = await updateBank(mockData);

        // Check if the default field was updated to false for other records
        expect(bankDetails.update).toHaveBeenCalledWith(
            { default: false },
            { where: { credentialId: mockData.credentialId } }
        );
        // Check if the specific bank account was updated
        expect(bankDetails.update).toHaveBeenCalledWith(
            mockData,
            { where: { id: mockData.id, credentialId: mockData.credentialId } }
        );
        expect(result).toEqual([1]); // Assuming update returns an array with number of affected rows
    });

    it('should only update the bank account if data.default is false', async () => {
        const mockData = {
            id: 'bankId123',
            credentialId: 'credentialId123',
            default: false,
            bankName: 'Bank A',
        };

        bankDetails.update.mockResolvedValue([1]); // Mocking the result of update

        const result = await updateBank(mockData);

        // Check if the update was called only once for the specific bank account
        expect(bankDetails.update).toHaveBeenCalledWith(
            mockData,
            { where: { id: mockData.id, credentialId: mockData.credentialId } }
        );
        expect(result).toEqual([1]); // Assuming update returns an array with number of affected rows
    });

    it('should handle errors during the update operation', async () => {
        const mockData = {
            id: 'bankId123',
            credentialId: 'credentialId123',
            default: true,
            bankName: 'Bank A',
        };

        const mockError = new Error('Update error');
        bankDetails.update.mockRejectedValue(mockError);

        await expect(updateBank(mockData)).rejects.toThrow('Update error');
    });
});
