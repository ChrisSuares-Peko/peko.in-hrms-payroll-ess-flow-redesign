const { Op } = require('sequelize');

jest.mock('../../../entities/ondc_order', () => ({
    findAndCountAll: jest.fn(),
}));

const ondcOrders = require('../../../entities/ondc_order');
const { findAllOndcOrdersForAdmin } = require('../../ondc_order');

/** The `where` handed to the entity on the most recent call. */
const lastWhere = () => ondcOrders.findAndCountAll.mock.calls.at(-1)[0].where;

const RETURNS_CLAUSE = {
    [Op.or]: [{ returnStatus: { [Op.ne]: null } }, { returnedAt: { [Op.ne]: null } }],
};

beforeEach(() => {
    jest.clearAllMocks();
    ondcOrders.findAndCountAll.mockResolvedValue({ count: 0, rows: [] });
});

describe('findAllOndcOrdersForAdmin — returnsOnly (admin Returns tab)', () => {
    // The reported bug: the tab filtered orderState = 'Returned', but that value is
    // only set once a return liquidates, so every live request was invisible.
    it('matches on return activity, never on orderState', async () => {
        await findAllOndcOrdersForAdmin({ returnsOnly: true });

        const where = lastWhere();
        expect(where.orderState).toBeUndefined();
        expect(where[Op.and]).toEqual([RETURNS_CLAUSE]);
    });

    // returnStatus alone would miss rows returned before that column existed.
    it('accepts either returnStatus or returnedAt', async () => {
        await findAllOndcOrdersForAdmin({ returnsOnly: true });

        const [clause] = lastWhere()[Op.and];
        expect(clause[Op.or]).toEqual([
            { returnStatus: { [Op.ne]: null } },
            { returnedAt: { [Op.ne]: null } },
        ]);
    });

    // The returns clause must live in Op.and — searchText owns Op.or, and writing
    // the returns filter there would silently drop the operator's search.
    it('coexists with searchText instead of clobbering it', async () => {
        await findAllOndcOrdersForAdmin({ returnsOnly: true, searchText: 'ABC' });

        const where = lastWhere();
        const like = { [Op.like]: '%ABC%' };
        expect(where[Op.or]).toEqual([
            { orderId: like },
            { transactionId: like },
            { vendorName: like },
        ]);
        expect(where[Op.and]).toEqual([RETURNS_CLAUSE]);
    });

    it('is appended to an existing Op.and rather than replacing it', async () => {
        await findAllOndcOrdersForAdmin({ returnsOnly: true, delayedOnly: true });

        // delayedOnly's own clause plus the returns clause, both retained.
        expect(lastWhere()[Op.and]).toHaveLength(2);
        expect(lastWhere()[Op.and]).toContainEqual(RETURNS_CLAUSE);
    });

    it('leaves the other tabs untouched when not set', async () => {
        await findAllOndcOrdersForAdmin({ status: 'Cancelled' });

        const where = lastWhere();
        expect(where.orderState).toBe('Cancelled');
        expect(where[Op.and]).toBeUndefined();
    });
});
