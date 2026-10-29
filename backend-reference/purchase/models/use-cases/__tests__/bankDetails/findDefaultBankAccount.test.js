const { findDefaultBankAccount } = require('../../../use-cases/bankDetails');
const bankDetails = require('../../../entities/bankDetails');

jest.mock('../../../entities/bankDetails', () => ({
    findOne: jest.fn(),
}));

describe('findDefaultBankAccount', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('should return the default bank account when found', async () => {
        const mockParams = { id: 123 };
        const mockBankAccount = { id: 1, credentialId: 123, default: true, status: true, name: 'Default Bank' };

        bankDetails.findOne.mockResolvedValue(mockBankAccount);

        const result = await findDefaultBankAccount(mockParams);

        expect(bankDetails.findOne).toHaveBeenCalledWith({
            where: {
                credentialId: mockParams.id,
                default: true,
                status: true,
            },
            nest: true,
            raw: true,
        });
        expect(result).toEqual(mockBankAccount);
    });

    it('should return null when no default bank account is found', async () => {
        const mockParams = { id: 456 };
        bankDetails.findOne.mockResolvedValue(null);

        const result = await findDefaultBankAccount(mockParams);

        expect(bankDetails.findOne).toHaveBeenCalledWith({
            where: {
                credentialId: mockParams.id,
                default: true,
                status: true,
            },
            nest: true,
            raw: true,
        });
        expect(result).toBeNull();
    });

    it('should throw an error if findOne fails', async () => {
        const mockParams = { id: 789 };
        const mockError = new Error('Database error');

        bankDetails.findOne.mockRejectedValue(mockError);

        await expect(findDefaultBankAccount(mockParams)).rejects.toThrow('Database error');
    });
});
