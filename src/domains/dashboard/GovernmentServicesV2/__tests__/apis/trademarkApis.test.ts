import { beforeEach, describe, expect, it, Mock, vi } from 'vitest';

import { ApiClient } from '@src/services/config';

import {
    getTrademarkClassApi,
    getTrademarkLanguagesApi,
    locationLookupApi,
    searchSimilarTrademarksApi,
    submitTrademarkFilingApi,
    uploadTrademarkLogoApi,
} from '../../apis';

vi.mock('@src/services/config', () => ({
    ApiClient: { get: vi.fn(), post: vi.fn() },
}));

const BASE = 'corporate/1/purchase/govt-services/v2';

describe('trademark registration APIs', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    describe('getTrademarkClassApi', () => {
        it('posts the goods/service query and returns data', async () => {
            const data = { classesIdentified: ['9'], descriptions: [{ class: 9, description: 'Software' }], classResult: null };
            (ApiClient.post as Mock).mockResolvedValue({ data });

            await expect(getTrademarkClassApi(1, 'corporate', 'software')).resolves.toEqual(data);
            expect(ApiClient.post).toHaveBeenCalledWith(`${BASE}/trademark-description`, { goods_or_services: 'software' });
        });

        it('returns null on failure', async () => {
            (ApiClient.post as Mock).mockRejectedValue(new Error('fail'));
            await expect(getTrademarkClassApi(1, 'corporate', 'software')).resolves.toBeNull();
        });
    });

    describe('getTrademarkLanguagesApi', () => {
        it('returns the languages list', async () => {
            (ApiClient.get as Mock).mockResolvedValue({ data: { languages: ['English', 'Hindi'] } });

            await expect(getTrademarkLanguagesApi(1, 'corporate')).resolves.toEqual(['English', 'Hindi']);
            expect(ApiClient.get).toHaveBeenCalledWith(`${BASE}/languages`);
        });

        it('returns an empty array when data is missing or the call fails', async () => {
            (ApiClient.get as Mock).mockResolvedValueOnce({});
            await expect(getTrademarkLanguagesApi(1, 'corporate')).resolves.toEqual([]);

            (ApiClient.get as Mock).mockRejectedValueOnce(new Error('fail'));
            await expect(getTrademarkLanguagesApi(1, 'corporate')).resolves.toEqual([]);
        });
    });

    describe('locationLookupApi', () => {
        it('posts the pincode and returns the location', async () => {
            const loc = { state: 'Karnataka', district: 'Bengaluru', country: 'India', city: 'Bengaluru', pincode: '560001' };
            (ApiClient.post as Mock).mockResolvedValue({ data: loc });

            await expect(locationLookupApi(1, 'corporate', '560001')).resolves.toEqual(loc);
            expect(ApiClient.post).toHaveBeenCalledWith(`${BASE}/location`, { pincode: '560001' });
        });

        it('returns null on failure', async () => {
            (ApiClient.post as Mock).mockRejectedValue(new Error('fail'));
            await expect(locationLookupApi(1, 'corporate', '560001')).resolves.toBeNull();
        });
    });

    describe('searchSimilarTrademarksApi', () => {
        it('queries by search term and returns similar marks', async () => {
            const similar = [{ tm_applied_for: 'PEKO', application_no: '1' }];
            (ApiClient.get as Mock).mockResolvedValue({ data: { similar } });

            await expect(searchSimilarTrademarksApi(1, 'corporate', 'Peko')).resolves.toEqual(similar);
            expect(ApiClient.get).toHaveBeenCalledWith(`${BASE}/trademark-search`, { params: { search_term: 'Peko' } });
        });

        it('returns an empty array on failure', async () => {
            (ApiClient.get as Mock).mockRejectedValue(new Error('fail'));
            await expect(searchSimilarTrademarksApi(1, 'corporate', 'Peko')).resolves.toEqual([]);
        });
    });

    describe('uploadTrademarkLogoApi', () => {
        it('includes applicationRowId only when provided', async () => {
            (ApiClient.post as Mock).mockResolvedValue({ data: { logoUrl: 'https://cdn/logo.png' } });

            await expect(uploadTrademarkLogoApi(1, 'corporate', 'govt_tm', 'b64', 'logo.png', 7)).resolves.toEqual({
                logoUrl: 'https://cdn/logo.png',
            });
            expect(ApiClient.post).toHaveBeenLastCalledWith(`${BASE}/trademark-logo`, {
                vendorCatalogId: 'govt_tm',
                fileBase64: 'b64',
                fileName: 'logo.png',
                applicationRowId: 7,
            });

            await uploadTrademarkLogoApi(1, 'corporate', 'govt_tm', 'b64', 'logo.png', null);
            expect(ApiClient.post).toHaveBeenLastCalledWith(`${BASE}/trademark-logo`, {
                vendorCatalogId: 'govt_tm',
                fileBase64: 'b64',
                fileName: 'logo.png',
            });
        });

        it('returns null on failure', async () => {
            (ApiClient.post as Mock).mockRejectedValue(new Error('fail'));
            await expect(uploadTrademarkLogoApi(1, 'corporate', 'govt_tm', 'b64', 'logo.png')).resolves.toBeNull();
        });
    });

    describe('submitTrademarkFilingApi', () => {
        it('posts the form data with applicationRowId and returns the application id', async () => {
            (ApiClient.post as Mock).mockResolvedValue({ data: { applicationId: 42 } });

            await expect(submitTrademarkFilingApi(1, 'corporate', 'govt_tm', { brand: 'Peko' }, 7)).resolves.toEqual({
                applicationId: 42,
            });
            expect(ApiClient.post).toHaveBeenCalledWith(`${BASE}/trademark-filing`, {
                vendorCatalogId: 'govt_tm',
                formData: { brand: 'Peko' },
                applicationRowId: 7,
            });
        });

        it('returns null on failure', async () => {
            (ApiClient.post as Mock).mockRejectedValue(new Error('fail'));
            await expect(submitTrademarkFilingApi(1, 'corporate', 'govt_tm', {})).resolves.toBeNull();
        });
    });
});
