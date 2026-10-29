// walletService.test.js
const { findAllWallets } = require('../../../use-cases/wallets');
const  wallet = require('../../../entities/wallet');

jest.mock('../../../entities/wallet', () => ({
        findAll: jest.fn(),
   
}));

describe('findAllWallets', () => {
    beforeEach(() => {
        console.log = jest.fn(); // Mock console.log
    });

    it('should return all wallets when findAll is successful', async () => {
        const mockWallets = [{ id: 1, balance: 100 }, { id: 2, balance: 200 }];
        wallet.findAll.mockResolvedValue(mockWallets);

        const result = await findAllWallets();

        expect(wallet.findAll).toHaveBeenCalledWith({ raw: true });
        expect(result).toEqual(mockWallets);
        expect(console.log).toHaveBeenCalledWith('WALLET FIND ALL ROUTE CALLED');
    });

    it('should log an error if findAll fails', async () => {
        const mockError = new Error('Database error');
        wallet.findAll.mockRejectedValue(mockError);

        const result = await findAllWallets();

        expect(wallet.findAll).toHaveBeenCalledWith({ raw: true });
        expect(result).toBeUndefined();
        expect(console.log).toHaveBeenCalledWith(mockError);
        expect(console.log).toHaveBeenCalledWith('WALLET FIND ALL ROUTE CALLED');
    });
});
