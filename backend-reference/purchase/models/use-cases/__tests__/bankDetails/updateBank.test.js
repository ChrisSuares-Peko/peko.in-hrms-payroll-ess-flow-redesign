const { updateBank } = require('../../../use-cases/bankDetails');
const bankDetails = require('../../../entities/bankDetails');


jest.mock('../../../entities/bankDetails', () => ({
    update: jest.fn(),
}));

describe('updateBank', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('should update bank details when default is true', async () => {
        const mockData = { id: 1, credentialId: 123, default: true, name: 'Updated Bank' };
        bankDetails.update.mockResolvedValue([1]); // Assuming update returns affected row count

        const result = await updateBank(mockData);

        expect(bankDetails.update).toHaveBeenCalledWith(
            { default: false },
            {
                where: {
                    credentialId: mockData.credentialId,
                },
            }
        );
        expect(bankDetails.update).toHaveBeenCalledWith(mockData, {
            where: {
                id: mockData.id,
                credentialId: mockData.credentialId,
            },
        });
        expect(result).toEqual([1]);
    });

    it('should update bank details when default is false', async () => {
        const mockData = { id: 2, credentialId: 456, default: false, name: 'Non-Default Bank' };
        bankDetails.update.mockResolvedValue([1]);

        const result = await updateBank(mockData);

        expect(bankDetails.update).toHaveBeenCalledWith(mockData, {
            where: {
                id: mockData.id,
                credentialId: mockData.credentialId,
            },
        });
        expect(result).toEqual([1]);
    });

    it('should throw an error if update fails', async () => {
        const mockData = { id: 3, credentialId: 789, default: true, name: 'Error Bank' };
        const mockError = new Error('Database error');

        bankDetails.update.mockRejectedValue(mockError);

        await expect(updateBank(mockData)).rejects.toThrow('Database error');
    });
});
