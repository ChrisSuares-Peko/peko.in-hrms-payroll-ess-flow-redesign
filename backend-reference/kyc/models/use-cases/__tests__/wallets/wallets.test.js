const { findAllWallets } = require('../../wallets');
const wallet = require('../../../entities/wallet');

beforeEach(() => {
    jest.clearAllMocks();
});

describe('findAllWallets', () => {
    it('should find all wallets', async () => {
        const mockResult = [
            { id: 1, credentialId: 1, balance: 100 },
            { id: 2, credentialId: 2, balance: 200 }
        ];
        wallet.findAll.mockResolvedValue(mockResult);

        const result = await findAllWallets();
        expect(result).toEqual(mockResult);
        expect(wallet.findAll).toHaveBeenCalledWith({ raw: true });
    });

    it('should return undefined on error', async () => {
        wallet.findAll.mockRejectedValue(new Error('DB Error'));

        const result = await findAllWallets();
        expect(result).toBeUndefined();
    });
});
