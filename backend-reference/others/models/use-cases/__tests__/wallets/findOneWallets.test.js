// walletService.test.js
const { findOneWallets } = require('../../../use-cases/wallets');
const wallet = require('../../../entities/wallet');
const credential = require('../../../entities/credential');

jest.mock('../../../entities/wallet', () => ({
    findOne: jest.fn(),
}));

jest.mock('../../../entities/credential', () => ({})); // Mock credential model if needed

describe('findOneWallets', () => {
    beforeEach(() => {
        console.log = jest.fn(); // Mock console.log
    });

    afterEach(() => {
        jest.resetAllMocks(); // Clear mocks after each test
    });

    it('should return wallet data with credential when successful', async () => {
        const mockId = 'cred-123';
        const mockWalletData = { id: 1, balance: 100 };
        const mockCredentialData = { username: 'user123' };
        const mockResult = { ...mockWalletData, credential: mockCredentialData };

        wallet.findOne.mockResolvedValue(mockResult);

        const result = await findOneWallets(mockId, ['balance'], ['username']);

        expect(wallet.findOne).toHaveBeenCalledWith({
            where: { credentialId: mockId },
            attributes: ['balance'],
            include: [{ model: credential, attributes: ['username'] }],
            raw: true,
        });
        expect(result).toEqual(mockResult);
        expect(console.log).toHaveBeenCalledWith('WALLET FIND ALL ROUTE CALLED');
    });

    it('should handle errors and log them', async () => {
        const mockId = 'cred-123';
        const mockError = new Error('Database error');
        wallet.findOne.mockRejectedValue(mockError);

        const result = await findOneWallets(mockId);

        expect(wallet.findOne).toHaveBeenCalledWith({
            where: { credentialId: mockId },
            attributes: undefined,
            include: [{ model: credential, attributes: undefined }],
            raw: true,
        });
        expect(result).toBeUndefined();
        expect(console.log).toHaveBeenCalledWith(mockError);
        expect(console.log).toHaveBeenCalledWith('WALLET FIND ALL ROUTE CALLED');
    });

    it('should call the function with default attributes when none are provided', async () => {
        const mockId = 'cred-123';
        const mockWalletData = { id: 1, balance: 100 };

        wallet.findOne.mockResolvedValue(mockWalletData);

        const result = await findOneWallets(mockId);

        expect(wallet.findOne).toHaveBeenCalledWith({
            where: { credentialId: mockId },
            attributes: undefined,
            include: [{ model: credential, attributes: undefined }],
            raw: true,
        });
        expect(result).toEqual(mockWalletData);
        expect(console.log).toHaveBeenCalledWith('WALLET FIND ALL ROUTE CALLED');
    });
});
