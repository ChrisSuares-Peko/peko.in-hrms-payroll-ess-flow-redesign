jest.mock('../../models/use-cases/ondc_product_with_transactionId', () => ({
    findMissingCatalogDomainsForCity: jest.fn().mockResolvedValue([]),
}));
jest.mock('../../models/use-cases/user_search_ondc', () => ({
    createUserSearch: jest.fn().mockResolvedValue({}),
    findLatestCatalogInc: jest.fn(),
    findDistinctCatalogIncDomains: jest.fn(),
    hasRecentCityDomainFullSearch: jest.fn(),
}));
jest.mock('../../models/use-cases/ondc_category', () => ({
    getDistinctOndcDomains: jest.fn(),
}));
jest.mock('../../models/use-cases/ondc_catalog_rules', () => ({
    findEnabledDomainCodes: jest.fn(),
}));
jest.mock('../ondc', () => ({
    getOndcConfig: jest.fn(),
    search: jest.fn(),
}));

const { findMissingCatalogDomainsForCity } = require('../../models/use-cases/ondc_product_with_transactionId');
const {
    findLatestCatalogInc,
    findDistinctCatalogIncDomains,
    createUserSearch,
    hasRecentCityDomainFullSearch,
} = require('../../models/use-cases/user_search_ondc');
const { getDistinctOndcDomains } = require('../../models/use-cases/ondc_category');
const { findEnabledDomainCodes } = require('../../models/use-cases/ondc_catalog_rules');
const ondc = require('../ondc');
const citySearchGate = require('../ondcCitySearchGate');
const {
    runOndcCityCatalogSearch,
    uniqueContextDomains,
} = require('../ondcCityCatalogSearch');

const callsWithMode = (mode) =>
    ondc.search.mock.calls.filter(([args]) => args.catalogMode === mode);

beforeEach(() => {
    jest.clearAllMocks();
    citySearchGate.resetForTests();
    hasRecentCityDomainFullSearch.mockResolvedValue(false);
    findMissingCatalogDomainsForCity.mockResolvedValue([]);
    findLatestCatalogInc.mockResolvedValue(null);
    findDistinctCatalogIncDomains.mockResolvedValue([]);
    getDistinctOndcDomains.mockResolvedValue(['RET10', 'RET16']);
    findEnabledDomainCodes.mockResolvedValue(null);
    ondc.getOndcConfig.mockResolvedValue({ domain: 'ONDC:RET14' });
    ondc.search.mockResolvedValue({ message: { ack: { status: 'ACK' } } });
});

describe('uniqueContextDomains', () => {
    it('normalizes RET16 to ONDC:RET16 and drops duplicates', () => {
        expect(uniqueContextDomains(['RET10', 'ONDC:RET16', 'ret16', 'ONDC:RET10']))
            .toEqual(['ONDC:RET10', 'ONDC:RET16']);
    });
});

describe('runOndcCityCatalogSearch', () => {
    it('skips the gateway when every domain is in-stock and had a catalog_full within 12h', async () => {
        hasRecentCityDomainFullSearch.mockResolvedValue(true);
        findMissingCatalogDomainsForCity.mockResolvedValue([]);

        const result = await runOndcCityCatalogSearch({ city: 'std:080' });

        expect(ondc.search).not.toHaveBeenCalled();
        expect(result.data).toEqual(expect.objectContaining({
            searched: false,
            reason: 'cached',
        }));
    });

    it('fires catalog_full for an empty city even if a full search was registered within 12h', async () => {
        hasRecentCityDomainFullSearch.mockResolvedValue(true);
        findMissingCatalogDomainsForCity.mockResolvedValue(['ONDC:RET10', 'ONDC:RET16']);

        const result = await runOndcCityCatalogSearch({ city: 'std:044' });

        expect(callsWithMode('full')).toHaveLength(2);
        expect(ondc.search).toHaveBeenCalledWith(expect.objectContaining({
            domain: 'ONDC:RET10',
            city: 'std:044',
            catalogMode: 'full',
        }));
        expect(ondc.search).toHaveBeenCalledWith(expect.objectContaining({
            domain: 'ONDC:RET16',
            city: 'std:044',
            catalogMode: 'full',
        }));
        expect(result.data).toEqual(expect.objectContaining({
            searched: true,
            reason: 'missing_domains',
        }));
    });

    it('does not search a domain switched off on the Rules tab', async () => {
        findEnabledDomainCodes.mockResolvedValue(new Set(['ONDC:RET16']));
        hasRecentCityDomainFullSearch.mockResolvedValue(true);
        findMissingCatalogDomainsForCity.mockResolvedValue(['ONDC:RET10', 'ONDC:RET16']);

        await runOndcCityCatalogSearch({ city: 'std:044' });

        expect(ondc.search).toHaveBeenCalledWith(expect.objectContaining({ domain: 'ONDC:RET16' }));
        expect(ondc.search).not.toHaveBeenCalledWith(expect.objectContaining({ domain: 'ONDC:RET10' }));
    });

    it('searches every category domain when the domain lookup fails', async () => {
        findEnabledDomainCodes.mockRejectedValue(new Error('db down'));
        hasRecentCityDomainFullSearch.mockResolvedValue(true);
        findMissingCatalogDomainsForCity.mockResolvedValue(['ONDC:RET10', 'ONDC:RET16']);

        await runOndcCityCatalogSearch({ city: 'std:044' });

        expect(callsWithMode('full')).toHaveLength(2);
    });

    it('gap-fills only the empty domain when a sibling still has stock', async () => {
        getDistinctOndcDomains.mockResolvedValue(['RET10', 'RET14']);
        hasRecentCityDomainFullSearch.mockResolvedValue(true);
        findMissingCatalogDomainsForCity.mockResolvedValue(['ONDC:RET14']);

        const result = await runOndcCityCatalogSearch({ city: 'std:044' });

        expect(callsWithMode('full')).toHaveLength(1);
        expect(ondc.search).toHaveBeenCalledWith(expect.objectContaining({
            domain: 'ONDC:RET14',
            city: 'std:044',
            catalogMode: 'full',
        }));
        expect(ondc.search).not.toHaveBeenCalledWith(expect.objectContaining({
            domain: 'ONDC:RET10',
            catalogMode: 'full',
        }));
        expect(result.data.reason).toBe('missing_domains');
    });

    it('seeds an empty city with catalog_full then arms incremental start per domain', async () => {
        const result = await runOndcCityCatalogSearch({ city: 'std:080' });

        expect(callsWithMode('full')).toHaveLength(2);
        expect(ondc.search).toHaveBeenCalledWith(expect.objectContaining({
            searchText: '',
            domain: 'ONDC:RET10',
            city: 'std:080',
            catalogMode: 'full',
        }));
        expect(ondc.search).toHaveBeenCalledWith(expect.objectContaining({
            searchText: '',
            domain: 'ONDC:RET16',
            city: 'std:080',
            catalogMode: 'full',
        }));
        expect(callsWithMode('inc_start')).toHaveLength(2);
        expect(ondc.search).toHaveBeenCalledWith(expect.objectContaining({
            catalogMode: 'inc_start',
            domain: 'ONDC:RET10',
            city: '*',
        }));
        expect(callsWithMode('inc_pull')).toHaveLength(0);
        expect(result.data).toEqual(expect.objectContaining({
            searched: true,
            reason: 'search_acked',
        }));
        expect(createUserSearch).toHaveBeenCalledWith(expect.objectContaining({
            search: 'catalog_inc_start',
            city: '*',
            ondcDomain: 'ONDC:RET10',
        }));
        expect(createUserSearch).toHaveBeenCalledWith(expect.objectContaining({
            city: 'std:080',
            ondcDomain: 'ONDC:RET10',
            catalogSweepId: expect.any(String),
        }));
    });

    it('fires catalog_full only for a domain with no recent search (RET14 gap-fill)', async () => {
        getDistinctOndcDomains.mockResolvedValue(['RET10', 'RET14']);
        hasRecentCityDomainFullSearch.mockImplementation(async ({ domain }) => (
            domain === 'ONDC:RET10'
        ));
        findMissingCatalogDomainsForCity.mockResolvedValue(['ONDC:RET14']);

        const result = await runOndcCityCatalogSearch({ city: 'std:044' });

        expect(callsWithMode('full')).toHaveLength(1);
        expect(ondc.search).toHaveBeenCalledWith(expect.objectContaining({
            domain: 'ONDC:RET14',
            city: 'std:044',
            catalogMode: 'full',
        }));
        expect(ondc.search).not.toHaveBeenCalledWith(expect.objectContaining({
            domain: 'ONDC:RET10',
            catalogMode: 'full',
        }));
        expect(result.data.reason).toBe('missing_domains');
    });

    it('re-full-searches a domain whose last catalog_full is older than 12h', async () => {
        getDistinctOndcDomains.mockResolvedValue(['RET10', 'RET16']);
        hasRecentCityDomainFullSearch.mockImplementation(async ({ domain }) => (
            domain === 'ONDC:RET10'
        ));

        await runOndcCityCatalogSearch({ city: 'std:080' });

        expect(callsWithMode('full')).toHaveLength(1);
        expect(ondc.search).toHaveBeenCalledWith(expect.objectContaining({
            domain: 'ONDC:RET16',
            catalogMode: 'full',
        }));
    });

    it('does not fall back to vendor optional5 when no category domains exist', async () => {
        getDistinctOndcDomains.mockResolvedValue([]);

        const result = await runOndcCityCatalogSearch({ city: 'std:080' });

        expect(ondc.search).not.toHaveBeenCalled();
        expect(result.data).toEqual(expect.objectContaining({
            searched: false,
            reason: 'no_domains',
        }));
    });

    it('does not re-arm start on a later visit', async () => {
        await runOndcCityCatalogSearch({ city: 'std:080' });
        expect(callsWithMode('inc_start')).toHaveLength(2);

        findLatestCatalogInc.mockImplementation(async ({ search }) => (
            search === 'catalog_inc_start'
                ? { id: 9, createdAt: new Date().toISOString() }
                : null
        ));
        citySearchGate.resetForTests();
        ondc.search.mockClear();

        await runOndcCityCatalogSearch({ city: 'std:080' });

        expect(callsWithMode('inc_start')).toHaveLength(0);
        expect(callsWithMode('full')).toHaveLength(2);
    });

    it('fires catalog_full when the last full search is stale even if rows already exist', async () => {
        findLatestCatalogInc.mockImplementation(async ({ search }) => (
            search === 'catalog_inc_start'
                ? { id: 3, createdAt: '2026-08-01T00:00:00.000Z' }
                : null
        ));

        const result = await runOndcCityCatalogSearch({ city: 'std:080' });

        expect(callsWithMode('full')).toHaveLength(2);
        expect(callsWithMode('inc_pull')).toHaveLength(0);
        expect(result.data).toEqual(expect.objectContaining({
            searched: true,
            reason: 'search_acked',
        }));
    });

    it('fires one pinned full search on Workbench and never incremental or sweep id', async () => {
        ondc.getOndcConfig.mockResolvedValue({
            domain: 'ONDC:RET14',
            forceTransactionId: 'wb-txn',
        });

        const result = await runOndcCityCatalogSearch({ city: 'std:080' });

        expect(ondc.search).toHaveBeenCalledTimes(1);
        expect(ondc.search).toHaveBeenCalledWith(expect.objectContaining({
            searchText: '',
            domain: 'ONDC:RET10',
            city: 'std:080',
            transactionId: 'wb-txn',
            catalogMode: 'full',
        }));
        expect(callsWithMode('inc_start')).toHaveLength(0);
        expect(callsWithMode('inc_pull')).toHaveLength(0);
        expect(result.data.transactionIds).toEqual(['wb-txn']);
        expect(createUserSearch).toHaveBeenCalledWith(expect.not.objectContaining({
            catalogSweepId: expect.anything(),
        }));
    });

    it('Workbench with no category domains uses the vendor domain', async () => {
        getDistinctOndcDomains.mockResolvedValue([]);
        ondc.getOndcConfig.mockResolvedValue({
            domain: 'ONDC:RET14',
            forceTransactionId: 'wb-txn',
        });

        await runOndcCityCatalogSearch({ city: 'std:080' });

        expect(ondc.search).toHaveBeenCalledTimes(1);
        expect(ondc.search).toHaveBeenCalledWith(expect.objectContaining({
            domain: 'ONDC:RET14',
            transactionId: 'wb-txn',
            catalogMode: 'full',
        }));
    });

    it('stops incremental push for a domain that left the Categories tab', async () => {
        hasRecentCityDomainFullSearch.mockResolvedValue(true);
        getDistinctOndcDomains.mockResolvedValue(['RET10']);
        findDistinctCatalogIncDomains.mockResolvedValue(['ONDC:RET10', 'ONDC:RET16']);
        findLatestCatalogInc.mockImplementation(async ({ domain, search }) => {
            if (search === 'catalog_inc_start') return { id: 10, ondcDomain: domain };
            return null;
        });

        await runOndcCityCatalogSearch({ city: 'std:080' });

        expect(callsWithMode('inc_stop')).toHaveLength(1);
        expect(ondc.search).toHaveBeenCalledWith(expect.objectContaining({
            catalogMode: 'inc_stop',
            domain: 'ONDC:RET16',
            city: '*',
        }));
        expect(callsWithMode('full')).toHaveLength(0);
    });
});
