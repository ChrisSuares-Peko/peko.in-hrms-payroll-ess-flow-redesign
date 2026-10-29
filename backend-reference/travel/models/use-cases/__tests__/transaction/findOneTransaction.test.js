const { findOneTransaction } = require('../../../use-cases/transaction');
const transaction = require('../../../entities/transaction');
const credential = require('../../../entities/credential');
const orders = require('../../../entities/order');

jest.mock('../../../entities/transaction', () => ({
    findOne: jest.fn(),
}));
jest.mock('../../../entities/corporateUser', () => ({
    belongsTo: jest.fn(),
}));

describe('findOneTransaction', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('should return a transaction when a matching corporateTxnId is found', async () => {
        const mockCorporateTxnId = 'TXN123';
        const mockTransaction = {
            id: 1,
            corporateTxnId: 'TXN123',
            amount: 5000,
            status: 'COMPLETED',
            credential: {
                id: 10,
                name: 'Corporate User',
            },
            orders: {
                id: 20,
                orderStatus: 'PAID',
            },
        };

        transaction.findOne.mockResolvedValue(mockTransaction);

        const result = await findOneTransaction(mockCorporateTxnId);

        expect(transaction.findOne).toHaveBeenCalledWith({
            where: { corporateTxnId: undefined },
            include: expect.arrayContaining([
                expect.objectContaining({ model: credential, required: false }),
                expect.objectContaining({ model: orders, required: false }),
            ]),
        });

        expect(result).toEqual(mockTransaction);
    });

    it('should return null when no matching transaction is found', async () => {
        const mockCorporateTxnId = 'TXN_NOT_FOUND';

        transaction.findOne.mockResolvedValue(null);

        const result = await findOneTransaction(mockCorporateTxnId);

        expect(transaction.findOne).toHaveBeenCalledWith({
            where: { corporateTxnId: undefined },
            include: expect.any(Array),
        });

        expect(result).toBeNull();
    });

    it('should log an error when database operation fails', async () => {
        const mockCorporateTxnId = 'TXN_ERROR';
        const mockError = new Error('Database error');

        transaction.findOne.mockRejectedValue(mockError);
        console.log = jest.fn();

        await expect(findOneTransaction(mockCorporateTxnId)).resolves.toBeUndefined();

        expect(console.log).toHaveBeenCalledWith(mockError);
    });

    it('should log "TRANSACTION FIND ONE ROUTE CALLED" in the finally block', async () => {
        const mockCorporateTxnId = 'TXN123';

        transaction.findOne.mockResolvedValue({ id: 1 });

        console.log = jest.fn();

        await findOneTransaction(mockCorporateTxnId);

        expect(console.log).toHaveBeenCalledWith('TRANSACTION FIND ONE ROUTE CALLED');
    });
});
