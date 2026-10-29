'use strict';

jest.mock('../cacheDataMethods', () => ({
    getValue: jest.fn(),
    setValue: jest.fn(),
}));

jest.mock('../checkAndFetchServiceDetails', () => ({
    findServiceOperatorByAccessKey: jest.fn(),
}));

jest.mock('axios');

jest.mock('../operatorsData.json', () => ({
    domainAndHosting: { accessKey: 'test-domain-key' },
}));

const { getPricingData } = require('../domainHostingPricingCache');
const { getValue, setValue } = require('../cacheDataMethods');
const { findServiceOperatorByAccessKey } = require('../checkAndFetchServiceDetails');
const axios = require('axios');

describe('getPricingData', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('should return cached data when cache hit', async () => {
        const mockPricing = { 'domain-product': { addnewdomain: { '1': '500' } } };
        getValue.mockResolvedValue(JSON.stringify(mockPricing));

        const result = await getPricingData();

        expect(getValue).toHaveBeenCalledWith('reseller_pricing');
        expect(findServiceOperatorByAccessKey).not.toHaveBeenCalled();
        expect(axios.get).not.toHaveBeenCalled();
        expect(result).toEqual(mockPricing);
    });

    it('should fetch from vendor and cache when cache is empty', async () => {
        getValue.mockResolvedValue(null);
        const mockServiceOperator = {
            vendor: { optional1: 'user-id', optional2: 'api-key', apiUrl: 'https://api.vendor.com' },
        };
        findServiceOperatorByAccessKey.mockResolvedValue(mockServiceOperator);
        const mockPricing = { 'linux-hosting': { '1': { add: { '12': '600' } } } };
        axios.get.mockResolvedValue({ data: mockPricing });
        setValue.mockResolvedValue(undefined);

        const result = await getPricingData('LOG-123');

        expect(findServiceOperatorByAccessKey).toHaveBeenCalledWith('test-domain-key');
        expect(axios.get).toHaveBeenCalledWith(
            expect.stringContaining('https://api.vendor.com')
        );
        expect(setValue).toHaveBeenCalledWith('reseller_pricing', 43200, JSON.stringify(mockPricing));
        expect(result).toEqual(mockPricing);
    });

    it('should return null when vendor config is not found', async () => {
        getValue.mockResolvedValue(null);
        findServiceOperatorByAccessKey.mockResolvedValue(null);

        const result = await getPricingData();

        expect(axios.get).not.toHaveBeenCalled();
        expect(result).toBeNull();
    });

    it('should return null when serviceOperator has an error', async () => {
        getValue.mockResolvedValue(null);
        findServiceOperatorByAccessKey.mockResolvedValue({ error: 'Not found' });

        const result = await getPricingData();

        expect(axios.get).not.toHaveBeenCalled();
        expect(result).toBeNull();
    });

    it('should build correct auth query string from vendor credentials', async () => {
        getValue.mockResolvedValue(null);
        findServiceOperatorByAccessKey.mockResolvedValue({
            vendor: { optional1: 'uid-123', optional2: 'key-abc', apiUrl: 'https://vendor.test' },
        });
        axios.get.mockResolvedValue({ data: {} });
        setValue.mockResolvedValue(undefined);

        await getPricingData();

        const calledUrl = axios.get.mock.calls[0][0];
        expect(calledUrl).toContain('auth-userid=uid-123');
        expect(calledUrl).toContain('api-key=key-abc');
    });
});
