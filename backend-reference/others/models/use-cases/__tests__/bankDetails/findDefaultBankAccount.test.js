const { findDefaultBankAccount } = require('../../../use-cases/bankDetails');
const bankDetails = require('../../../entities/bankDetails');

jest.mock('../../../entities/bankDetails', () => ({
    findOne: jest.fn(),
}));

describe('findDefaultBankAccount', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('should return a default bank account for the given credentialId', async () => {
        const mockCredentialId = 'REDACTED';
        const mockBankAccount = {
            id: 'bankId123',
            credentialId: mockCredentialId,
            default: true,
            status: true,
        };

        bankDetails.findOne.mockResolvedValue(mockBankAccount);

        const result = await findDefaultBankAccount({ id: mockCredentialId });

        expect(bankDetails.findOne).toHaveBeenCalledWith({
            where: {
                credentialId: mockCredentialId,
                default: true,
                status: true
            },
            nest: true,
            raw: true
        });
        expect(result).toEqual(mockBankAccount);
    });

    it('should return null if no default bank account is found for the given credentialId', async () => {
        const mockCredentialId = 'REDACTED';

        bankDetails.findOne.mockResolvedValue(null);

        const result = await findDefaultBankAccount({ id: mockCredentialId });

        expect(bankDetails.findOne).toHaveBeenCalledWith({
            where: {
                credentialId: mockCredentialId,
                default: true,
                status: true
            },
            nest: true,
            raw: true
        });
        expect(result).toBeNull();
    });

    it('should handle and return errors properly', async () => {
        const mockCredentialId = 'REDACTED';
        const mockError = new Error('Database error');

        bankDetails.findOne.mockRejectedValue(mockError);

        await expect(findDefaultBankAccount({ id: mockCredentialId })).rejects.toThrow('Database error');
    });
});
