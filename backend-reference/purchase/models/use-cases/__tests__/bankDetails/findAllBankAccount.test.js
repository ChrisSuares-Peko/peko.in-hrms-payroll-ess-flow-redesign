const { findAllBankAccount } = require('../../../use-cases/bankDetails');
const bankDetails = require('../../../entities/bankDetails');

jest.mock('../../../entities/bankDetails', () => ({
    findAll: jest.fn(),
}));

describe('findAllBankAccount', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('should return a list of bank accounts when records are found', async () => {
        const mockParams = { id: 123 };
        const mockBankAccounts = [
            { id: 1, credentialId: 123, name: 'Bank A' },
            { id: 2, credentialId: 123, name: 'Bank B' },
        ];

        bankDetails.findAll.mockResolvedValue(mockBankAccounts);

        const result = await findAllBankAccount(mockParams);

        expect(bankDetails.findAll).toHaveBeenCalledWith({
            where: {
                credentialId: mockParams.id,
            },
            nest: true,
            raw: true,
        });
        expect(result).toEqual(mockBankAccounts);
    });

    it('should return an empty array when no records are found', async () => {
        const mockParams = { id: 456 };
        bankDetails.findAll.mockResolvedValue([]);

        const result = await findAllBankAccount(mockParams);

        expect(bankDetails.findAll).toHaveBeenCalledWith({
            where: {
                credentialId: mockParams.id,
            },
            nest: true,
            raw: true,
        });
        expect(result).toEqual([]);
    });

    it('should throw an error if findAll fails', async () => {
        const mockParams = { id: 789 };
        const mockError = new Error('Database error');

        bankDetails.findAll.mockRejectedValue(mockError);

        await expect(findAllBankAccount(mockParams)).rejects.toThrow('Database error');
    });
});
