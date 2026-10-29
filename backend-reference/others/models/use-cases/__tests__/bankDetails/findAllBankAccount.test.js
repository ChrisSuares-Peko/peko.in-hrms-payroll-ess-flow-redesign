const { findAllBankAccount } = require('../../../use-cases/bankDetails');
const bankDetails = require('../../../entities/bankDetails');

jest.mock('../../../entities/bankDetails', () => ({
    findAll: jest.fn(),
}));

describe('findAllBankAccount', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('should return bank accounts for a given corporateId', async () => {
        const mockCorporateId = 'corp123';
        const mockBankAccounts = [
            { id: 1, accountNumber: '1234567890', bankName: 'Bank A' },
            { id: 2, accountNumber: '0987654321', bankName: 'Bank B' }
        ];

        bankDetails.findAll.mockResolvedValue(mockBankAccounts);

        const result = await findAllBankAccount({ corporateId: mockCorporateId });

        expect(bankDetails.findAll).toHaveBeenCalledWith({
            where: { credentialId: mockCorporateId },
            nest: true,
            raw: true
        });
        expect(result).toEqual(mockBankAccounts);
    });

    it('should return an empty array if no bank accounts are found', async () => {
        const mockCorporateId = 'corp123';
        bankDetails.findAll.mockResolvedValue([]);

        const result = await findAllBankAccount({ corporateId: mockCorporateId });

        expect(bankDetails.findAll).toHaveBeenCalledWith({
            where: { credentialId: mockCorporateId },
            nest: true,
            raw: true
        });
        expect(result).toEqual([]);
    });

    it('should propagate errors properly', async () => {
        const mockCorporateId = 'corp123';
        const mockError = new Error('Database error');

        bankDetails.findAll.mockRejectedValue(mockError);

        await expect(findAllBankAccount({ corporateId: mockCorporateId }))
            .rejects
            .toThrow('Database error');
    });
});
