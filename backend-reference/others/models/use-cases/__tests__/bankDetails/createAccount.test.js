const { createAccount } = require('../../../use-cases/bankDetails');
const bankDetails = require('../../../entities/bankDetails');

jest.mock('../../../entities/bankDetails', () => ({
    update: jest.fn(),
    create: jest.fn(),
}));

describe('createAccount', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('should update the default account to false and create a new account if params.default is true', async () => {
        const mockId = 'credentialId123';
        const mockParams = {
            credentialId: mockId,
            accountNumber: '1234567890',
            bankName: 'Bank A',
            default: true,
        };

        bankDetails.update.mockResolvedValue([1]); // Mocking the result of update
        bankDetails.create.mockResolvedValue(mockParams);

        const result = await createAccount(mockParams, mockId);

        expect(bankDetails.update).toHaveBeenCalledWith(
            { default: false },
            { where: { credentialId: mockId } }
        );
        expect(bankDetails.create).toHaveBeenCalledWith(mockParams);
        expect(result).toEqual(mockParams);
    });

    it('should create a new account without updating if params.default is false', async () => {
        const mockId = 'credentialId123';
        const mockParams = {
            credentialId: mockId,
            accountNumber: '1234567890',
            bankName: 'Bank A',
            default: false,
        };

        bankDetails.update.mockResolvedValue([0]); // Should not be called
        bankDetails.create.mockResolvedValue(mockParams);

        const result = await createAccount(mockParams, mockId);

        expect(bankDetails.update).not.toHaveBeenCalled();
        expect(bankDetails.create).toHaveBeenCalledWith(mockParams);
        expect(result).toEqual(mockParams);
    });

    it('should handle errors in update operation', async () => {
        const mockId = 'credentialId123';
        const mockParams = {
            credentialId: mockId,
            accountNumber: '1234567890',
            bankName: 'Bank A',
            default: true,
        };

        const mockError = new Error('Update error');
        bankDetails.update.mockRejectedValue(mockError);

        await expect(createAccount(mockParams, mockId))
            .rejects
            .toThrow('Update error');
    });

    it('should handle errors in create operation', async () => {
        const mockId = 'credentialId123';
        const mockParams = {
            credentialId: mockId,
            accountNumber: '1234567890',
            bankName: 'Bank A',
            default: true,
        };

        bankDetails.update.mockResolvedValue([1]); // Simulating successful update
        const mockError = new Error('Create error');
        bankDetails.create.mockRejectedValue(mockError);

        await expect(createAccount(mockParams, mockId))
            .rejects
            .toThrow('Create error');
    });
});
