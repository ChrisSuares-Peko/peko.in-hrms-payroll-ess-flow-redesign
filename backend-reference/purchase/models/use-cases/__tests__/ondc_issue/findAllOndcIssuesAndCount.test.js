const { Op } = require('sequelize');

jest.mock('../../../entities/ondc_issue', () => ({
    findAndCountAll: jest.fn(),
}));
jest.mock('../../ondc_issue_event', () => ({
    recordOndcIssueEvent: jest.fn(),
    findEventsByIssueId: jest.fn(),
}));
jest.mock('../../../../configs/database/index', () => ({
    transaction: jest.fn(),
}));

const ondcIssues = require('../../../entities/ondc_issue');
const { findAllOndcIssuesAndCount } = require('../../ondc_issue');

/** The `where` handed to the entity on the most recent call. */
const lastWhere = () => ondcIssues.findAndCountAll.mock.calls.at(-1)[0].where;

describe('findAllOndcIssuesAndCount — createdAt window', () => {
    beforeEach(() => {
        jest.clearAllMocks();
        ondcIssues.findAndCountAll.mockResolvedValue({ count: 0, rows: [] });
    });

    // The admin Issues tab sends `to` as a bare date defaulting to today. A
    // plain `new Date(to)` is that day's midnight, which silently hid every
    // issue raised later the same day — the reported "issues raised aren't
    // showing in the admin panel" bug.
    it('end-caps `to` to the last instant of the day, not midnight', async () => {
        await findAllOndcIssuesAndCount({ to: '2026-08-10' });

        const upperBound = lastWhere().createdAt[Op.lte];
        expect(upperBound.getFullYear()).toBe(2026);
        expect(upperBound.getMonth()).toBe(7); // August
        expect(upperBound.getDate()).toBe(10);
        expect(upperBound.getHours()).toBe(23);
        expect(upperBound.getMinutes()).toBe(59);
        expect(upperBound.getSeconds()).toBe(59);
        expect(upperBound.getMilliseconds()).toBe(999);
    });

    it('includes an issue created later on the `to` day', async () => {
        await findAllOndcIssuesAndCount({ to: '2026-08-10' });

        const raisedThisAfternoon = new Date('2026-08-10T14:30:00');
        expect(lastWhere().createdAt[Op.lte].getTime()).toBeGreaterThan(
            raisedThisAfternoon.getTime()
        );
    });

    it('applies `from` as the lower bound', async () => {
        await findAllOndcIssuesAndCount({ from: '2026-08-01', to: '2026-08-10' });

        const where = lastWhere();
        expect(where.createdAt[Op.gte]).toEqual(new Date('2026-08-01'));
        expect(where.createdAt[Op.lte]).toBeInstanceOf(Date);
    });

    it('applies no window when from/to are absent', async () => {
        await findAllOndcIssuesAndCount({});

        expect(lastWhere().createdAt).toBeUndefined();
    });

    // The Issues tab now ships no default range, so the api layer sends
    // `from=&to=` — empty strings must mean "no window", not an empty result.
    it('applies no window when from/to are empty strings', async () => {
        await findAllOndcIssuesAndCount({ from: '', to: '' });

        expect(lastWhere().createdAt).toBeUndefined();
    });

    it('still applies the other filters alongside the window', async () => {
        await findAllOndcIssuesAndCount({
            status: 'OPEN',
            category: 'ITEM',
            to: '2026-08-10',
        });

        const where = lastWhere();
        expect(where.status).toBe('OPEN');
        expect(where.category).toBe('ITEM');
        expect(where.createdAt[Op.lte]).toBeInstanceOf(Date);
    });
});
