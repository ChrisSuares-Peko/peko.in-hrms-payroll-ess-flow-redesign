const { findBankAccountByAccountNumber } = require('../../../use-cases/bankDetails');
const bankDetails = require('../../../entities/bankDetails');
const { Op } = require('sequelize');

jest.mock('../../../entities/bankDetails', () => ({
    findOne: jest.fn(),
}));

describe('findBankAccountByAccountNumber', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('should return a bank account when accountNumber matches and no filters are provided', async () => {
        const mockAccountNumber = '1234567890';
        const mockBankAccount = { id: 1, accountNumber: mockAccountNumber, name: 'Test Bank' };

        bankDetails.findOne.mockResolvedValue(mockBankAccount);

        const result = await findBankAccountByAccountNumber(mockAccountNumber);

        expect(bankDetails.findOne).toHaveBeenCalledWith(
            expect.objectContaining({
                where: expect.objectContaining({ accountNumber: mockAccountNumber }),
                nest: true,
                raw: true,
            })
        );
        expect(result).toEqual(mockBankAccount);
    });

    it('should exclude selectedId when provided', async () => {
        const mockAccountNumber = '1234567890';
        const mockSelectedId = 2;
        const mockBankAccount = { id: 3, accountNumber: mockAccountNumber, name: 'Another Bank' };

        bankDetails.findOne.mockResolvedValue(mockBankAccount);

        const result = await findBankAccountByAccountNumber(mockAccountNumber, mockSelectedId);

        expect(bankDetails.findOne).toHaveBeenCalledWith({
            where: {
                accountNumber: mockAccountNumber,
                id: { [Op.not]: mockSelectedId },
            },
            nest: true,
            raw: true,
        });
        expect(result).toEqual(mockBankAccount);
    });

    it('should scope to credentialId when provided', async () => {
        const mockAccountNumber = '1234567890';
        const mockCredentialId = 153;
        const mockBankAccount = { id: 1, accountNumber: mockAccountNumber, credentialId: mockCredentialId };

        bankDetails.findOne.mockResolvedValue(mockBankAccount);

        const result = await findBankAccountByAccountNumber(mockAccountNumber, null, mockCredentialId);

        expect(bankDetails.findOne).toHaveBeenCalledWith({
            where: {
                accountNumber: mockAccountNumber,
                credentialId: mockCredentialId,
            },
            nest: true,
            raw: true,
        });
        expect(result).toEqual(mockBankAccount);
    });

    it('should return null when no matching bank account is found', async () => {
        const mockAccountNumber = '1234567890';
        const mockSelectedId = 2;

        bankDetails.findOne.mockResolvedValue(null);

        const result = await findBankAccountByAccountNumber(mockAccountNumber, mockSelectedId);

        expect(result).toBeNull();
    });

    it('should throw an error if findOne fails', async () => {
        const mockAccountNumber = '1234567890';
        bankDetails.findOne.mockRejectedValue(new Error('Database error'));

        await expect(findBankAccountByAccountNumber(mockAccountNumber)).rejects.toThrow('Database error');
    });
});
