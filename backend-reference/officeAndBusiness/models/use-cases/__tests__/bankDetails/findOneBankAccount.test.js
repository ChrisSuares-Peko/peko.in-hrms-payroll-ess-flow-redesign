const { findOneBankAccount } = require('../../../use-cases/bankDetails');
const bankDetails = require('../../../entities/bankDetails');


jest.mock('../../../entities/bankDetails', () => ({
    findOne: jest.fn(),
}));

describe('findOneBankAccount', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('should return a bank account when a matching record is found', async () => {
        const mockParams = { corporateId: 123 };
        const mockBankAccount = { id: 1, credentialId: 123, default: true, name: 'Corporate Bank' };

        bankDetails.findOne.mockResolvedValue(mockBankAccount);

        const result = await findOneBankAccount(mockParams);

        expect(bankDetails.findOne).toHaveBeenCalledWith({
            where: {
                credentialId: mockParams.corporateId,
                default: true,
            },
            nest: true,
            raw: true,
        });
        expect(result).toEqual(mockBankAccount);
    });

    it('should return null when no matching bank account is found', async () => {
        const mockParams = { corporateId: 456 };
        
        bankDetails.findOne.mockResolvedValue(null);

        const result = await findOneBankAccount(mockParams);

        expect(bankDetails.findOne).toHaveBeenCalledWith({
            where: {
                credentialId: mockParams.corporateId,
                default: true,
            },
            nest: true,
            raw: true,
        });
        expect(result).toBeNull();
    });

    it('should throw an error if findOne fails', async () => {
        const mockParams = { corporateId: 789 };
        const mockError = new Error('Database error');

        bankDetails.findOne.mockRejectedValue(mockError);

        await expect(findOneBankAccount(mockParams)).rejects.toThrow('Database error');
    });
});
