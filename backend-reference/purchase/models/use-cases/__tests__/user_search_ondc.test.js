jest.mock('../../entities/user_search_ondc', () => ({
    create: jest.fn(),
    findOne: jest.fn(),
    findAll: jest.fn(),
}));

const { Op } = require('sequelize');
const userSearchOndc = require('../../entities/user_search_ondc');
const { hasRecentCityDomainFullSearch } = require('../user_search_ondc');

beforeEach(() => {
    jest.clearAllMocks();
    userSearchOndc.findOne.mockResolvedValue(null);
});

describe('hasRecentCityDomainFullSearch', () => {
    it('looks up a non-incremental city+domain search within 12h', async () => {
        const now = Date.parse('2026-09-01T10:00:00.000Z');
        jest.useFakeTimers({ now });
        userSearchOndc.findOne.mockResolvedValue({ id: 3 });

        await expect(hasRecentCityDomainFullSearch({
            city: 'std:044',
            domain: 'ONDC:RET14',
        })).resolves.toBe(true);

        const { where } = userSearchOndc.findOne.mock.calls[0][0];
        expect(where.city).toBe('std:044');
        expect(where.ondcDomain).toEqual({ [Op.in]: ['ONDC:RET14', 'RET14'] });
        expect(where.createdAt[Op.gte].toISOString()).toBe('2026-08-31T22:00:00.000Z');
        expect(where[Op.not]).toEqual({
            search: { [Op.in]: ['catalog_inc_start', 'catalog_inc_pull', 'catalog_inc_stop'] },
        });
        jest.useRealTimers();
    });

    it('is false for city * and when no row exists', async () => {
        await expect(hasRecentCityDomainFullSearch({ city: '*', domain: 'ONDC:RET14' }))
            .resolves.toBe(false);
        await expect(hasRecentCityDomainFullSearch({ city: 'std:044', domain: 'ONDC:RET14' }))
            .resolves.toBe(false);
        expect(userSearchOndc.findOne).toHaveBeenCalledTimes(1);
    });
});
