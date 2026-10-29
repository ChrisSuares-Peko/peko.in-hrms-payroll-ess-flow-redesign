const { updateEWaybill } = require('../../eWaybill');
const eWaybill = require('../../../entities/eWaybill');

jest.mock('../../../entities/eWaybill');

describe('updateEWaybill', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('should update and return result for given id', async () => {
        eWaybill.update.mockResolvedValue([1]);

        const result = await updateEWaybill(3, { status: 'CANCELLED' });

        expect(eWaybill.update).toHaveBeenCalledWith({ status: 'CANCELLED' }, { where: { id: 3 } });
        expect(result).toEqual([1]);
    });

    it('should return [0] if no record matched', async () => {
        eWaybill.update.mockResolvedValue([0]);

        const result = await updateEWaybill(999, { status: 'CANCELLED' });

        expect(result).toEqual([0]);
    });

    it('should throw if update fails', async () => {
        eWaybill.update.mockRejectedValue(new Error('DB error'));

        await expect(updateEWaybill(1, {})).rejects.toThrow('DB error');
    });
});
