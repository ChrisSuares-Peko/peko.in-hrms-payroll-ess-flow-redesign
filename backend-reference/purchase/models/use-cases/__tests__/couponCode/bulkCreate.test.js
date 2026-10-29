const { Op } = require('sequelize');

jest.mock('../../../entities/couponCode', () => ({
    create: jest.fn(),
    findAll: jest.fn(),
}));

const sequelizeConfig = require('../../../../configs/database/index');
const couponCode = require('../../../entities/couponCode');
const { bulkCreateForServiceOperators, findConflictingServiceOperators } = require('../../../use-cases/couponCode');

const transaction = { id: 'tx' };

describe('bulkCreateForServiceOperators', () => {
    beforeEach(() => {
        jest.clearAllMocks();
        sequelizeConfig.transaction.mockImplementation(async (work) => work(transaction));
        couponCode.create.mockImplementation(async (row) => ({ id: Number(row.serviceOperatorId) * 10, ...row }));
    });

    it('creates one coupon row per service operator inside a single transaction', async () => {
        const baseData = { couponCode: 'BILLS50', partnerId: null, couponType: 'SERVICES' };

        const rows = await bulkCreateForServiceOperators({ baseData, serviceOperatorIds: ['3', '7'] });

        expect(couponCode.create).toHaveBeenNthCalledWith(1, { ...baseData, serviceOperatorId: '3' }, { transaction });
        expect(couponCode.create).toHaveBeenNthCalledWith(2, { ...baseData, serviceOperatorId: '7' }, { transaction });
        expect(rows.map(row => row.serviceOperatorId)).toEqual(['3', '7']);
    });

    it('fails the whole batch when one row cannot be created', async () => {
        couponCode.create
            .mockResolvedValueOnce({ id: 30 })
            .mockRejectedValueOnce(new Error('Database error'));

        await expect(bulkCreateForServiceOperators({
            baseData: { couponCode: 'BILLS50' },
            serviceOperatorIds: ['3', '7'],
        })).rejects.toThrow('Database error');
    });
});

describe('findConflictingServiceOperators', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('looks for the same code for the same partner on any of the selected operators', async () => {
        couponCode.findAll.mockResolvedValue([{ serviceOperatorId: 7 }]);

        const conflicts = await findConflictingServiceOperators({ couponCode: 'BILLS50', partnerId: '', serviceOperatorIds: ['3', '7'] });

        expect(couponCode.findAll).toHaveBeenCalledWith({
            where: { couponCode: 'BILLS50', partnerId: null, serviceOperatorId: { [Op.in]: ['3', '7'] } },
            attributes: ['serviceOperatorId'],
            raw: true,
        });
        expect(conflicts).toEqual([{ serviceOperatorId: 7 }]);
    });

    it('returns false when the lookup fails', async () => {
        couponCode.findAll.mockRejectedValue(new Error('Database error'));

        await expect(findConflictingServiceOperators({ couponCode: 'BILLS50', serviceOperatorIds: ['3'] })).resolves.toBe(false);
    });
});
