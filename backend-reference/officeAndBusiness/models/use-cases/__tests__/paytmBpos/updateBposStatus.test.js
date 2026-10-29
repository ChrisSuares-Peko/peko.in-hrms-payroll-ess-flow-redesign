const { updateBposStatus } = require('../../paytmBpos');
const PaytmBpos = require('../../../entities/paytmBpos');

jest.mock('../../../entities/paytmBpos');

describe('updateBposStatus', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('should update the BPOS status successfully', async () => {
        PaytmBpos.update.mockResolvedValue([1]); // Sequelize returns an array with number of affected rows

        const params = { id: 123 };
        const data = { status: 'Active' };

        const result = await updateBposStatus(params, data);

        expect(PaytmBpos.update).toHaveBeenCalledWith(data, { where: { id: params.id } });
        expect(result).toEqual([1]);
    });

    it('should return 0 if no record is updated', async () => {
        PaytmBpos.update.mockResolvedValue([0]);

        const params = { id: 999 }; // Non-existing ID
        const data = { status: 'Inactive' };

        const result = await updateBposStatus(params, data);

        expect(PaytmBpos.update).toHaveBeenCalledWith(data, { where: { id: params.id } });
        expect(result).toEqual([0]);
    });

    it('should throw an error if the update operation fails', async () => {
        PaytmBpos.update.mockRejectedValue(new Error('Database error'));

        const params = { id: 123 };
        const data = { status: 'Active' };

        await expect(updateBposStatus(params, data)).rejects.toThrow('Database error');
    });
});
