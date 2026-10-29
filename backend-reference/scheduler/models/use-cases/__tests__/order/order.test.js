const { findOneOrder, updateOneOrder } = require('../../order');
const order = require('../../../entities/order');

beforeEach(() => {
    jest.clearAllMocks();
});

describe('findOneOrder', () => {
    it('should find one order by corporateTxnId', async () => {
        const mockResult = { id: 1, corporateTxnId: 'TXN1' };
        order.findOne.mockResolvedValue(mockResult);

        const result = await findOneOrder({ corporateTxnId: 'TXN1' });
        expect(result).toEqual(mockResult);
        expect(order.findOne).toHaveBeenCalledWith({
            where: { corporateTxnId: 'TXN1' }
        });
    });

    it('should return null when order not found', async () => {
        order.findOne.mockResolvedValue(null);

        const result = await findOneOrder({ corporateTxnId: 'NONE' });
        expect(result).toBeNull();
    });

    it('should handle errors gracefully', async () => {
        order.findOne.mockRejectedValue(new Error('DB Error'));

        const result = await findOneOrder({ corporateTxnId: 'TXN1' });
        expect(result).toBeUndefined();
    });
});

describe('updateOneOrder', () => {
    it('should update an order and return the updated record', async () => {
        const mockUpdated = { id: 1, corporateTxnId: 'TXN1', status: 'SUCCESS' };
        order.update.mockResolvedValue([1]);
        order.findByPk.mockResolvedValue(mockUpdated);

        const result = await updateOneOrder('TXN1', { status: 'SUCCESS' });
        expect(result).toEqual(mockUpdated);
        expect(order.update).toHaveBeenCalledWith(
            { status: 'SUCCESS' },
            { where: { corporateTxnId: 'TXN1' } }
        );
    });

    it('should return undefined when no rows updated', async () => {
        order.update.mockResolvedValue([0]);

        const result = await updateOneOrder('NONE', { status: 'SUCCESS' });
        expect(result).toBeUndefined();
    });

    it('should return false on error', async () => {
        order.update.mockRejectedValue(new Error('DB Error'));

        const result = await updateOneOrder('TXN1', { status: 'SUCCESS' });
        expect(result).toBe(false);
    });
});
