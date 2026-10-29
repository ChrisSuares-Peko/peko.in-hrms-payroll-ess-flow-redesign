import { beforeEach, describe, expect, it, Mock, vi } from 'vitest';

import { ApiClient } from '@src/services/config';

import {
    createVendorBusinessApi,
    getAllGovernmentServiceApplicationsApi,
    getAllGovernmentServiceApplicationsV2Api,
    getEngagementStatusApi,
    getGovernmentServiceApplicationApi,
    getGovtServicesListApi,
    getVendorBusinessDetailApi,
    getVendorBusinessesApi,
    getVendorServiceDetailsApi,
    getVendorServiceDocumentsApi,
    requestExpertCallbackApi,
    submitGovernmentServiceApplicationApi,
    verifyVendorPanApi,
} from '../../apis';

vi.mock('@src/services/config', () => ({
    ApiClient: { get: vi.fn(), post: vi.fn() },
}));

const BASE = 'corporate/1/purchase/govt-services/v2';

describe('government services APIs', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    describe('submitGovernmentServiceApplicationApi', () => {
        it('posts accessKey/formData only when optional fields are absent', async () => {
            const data = { applicationId: 'APP-1', status: 'DRAFT' };
            (ApiClient.post as Mock).mockResolvedValue({ data });

            await expect(
                submitGovernmentServiceApplicationApi({
                    userId: 1,
                    userType: 'corporate',
                    accessKey: 'govt_trademark_registration',
                    formData: { brand: 'Peko' },
                })
            ).resolves.toEqual(data);
            expect(ApiClient.post).toHaveBeenCalledWith(`${BASE}/applications`, {
                accessKey: 'govt_trademark_registration',
                formData: { brand: 'Peko' },
            });
        });

        it('includes applicationId and status when provided', async () => {
            (ApiClient.post as Mock).mockResolvedValue({ data: { applicationId: 'APP-1', status: 'SUBMITTED' } });

            await submitGovernmentServiceApplicationApi({
                userId: 1,
                userType: 'corporate',
                accessKey: 'k',
                formData: {},
                applicationId: 7,
                status: 'SUBMITTED',
            });
            expect(ApiClient.post).toHaveBeenCalledWith(`${BASE}/applications`, {
                accessKey: 'k',
                formData: {},
                applicationId: 7,
                status: 'SUBMITTED',
            });
        });

        it('omits a null/0 applicationId and empty status', async () => {
            (ApiClient.post as Mock).mockResolvedValue({ data: {} });

            await submitGovernmentServiceApplicationApi({
                userId: 1,
                userType: 'corporate',
                accessKey: 'k',
                formData: {},
                applicationId: null,
                status: '',
            });
            expect(ApiClient.post).toHaveBeenCalledWith(`${BASE}/applications`, { accessKey: 'k', formData: {} });
        });

        it('returns false on failure', async () => {
            (ApiClient.post as Mock).mockRejectedValue(new Error('fail'));
            await expect(
                submitGovernmentServiceApplicationApi({
                    userId: 1,
                    userType: 'corporate',
                    accessKey: 'k',
                    formData: {},
                })
            ).resolves.toBe(false);
        });
    });

    describe('getAllGovernmentServiceApplicationsApi', () => {
        it('hits the V1 applications endpoint and returns data', async () => {
            const rows = [{ id: 1 }];
            (ApiClient.get as Mock).mockResolvedValue({ data: rows });

            await expect(getAllGovernmentServiceApplicationsApi(1, 'corporate')).resolves.toEqual(rows);
            expect(ApiClient.get).toHaveBeenCalledWith('corporate/1/purchase/govt-services/applications');
        });

        it('returns [] on missing data or failure', async () => {
            (ApiClient.get as Mock).mockResolvedValueOnce({});
            await expect(getAllGovernmentServiceApplicationsApi(1, 'corporate')).resolves.toEqual([]);

            (ApiClient.get as Mock).mockRejectedValueOnce(new Error('fail'));
            await expect(getAllGovernmentServiceApplicationsApi(1, 'corporate')).resolves.toEqual([]);
        });
    });

    describe('getGovtServicesListApi', () => {
        it('passes params and returns the nested data list', async () => {
            const rows = [{ id: 'abc' }];
            (ApiClient.get as Mock).mockResolvedValue({ data: { total: 1, data: rows } });

            await expect(getGovtServicesListApi(1, 'corporate', { service_id: 100 })).resolves.toEqual(rows);
            expect(ApiClient.get).toHaveBeenCalledWith(`${BASE}/services`, { params: { service_id: 100 } });
        });

        it('sends undefined params when none are given', async () => {
            (ApiClient.get as Mock).mockResolvedValue({ data: { total: 0, data: [] } });

            await getGovtServicesListApi(1, 'corporate');
            expect(ApiClient.get).toHaveBeenCalledWith(`${BASE}/services`, { params: undefined });
        });

        it('returns [] on missing data or failure', async () => {
            (ApiClient.get as Mock).mockResolvedValueOnce({ data: null });
            await expect(getGovtServicesListApi(1, 'corporate')).resolves.toEqual([]);

            (ApiClient.get as Mock).mockRejectedValueOnce(new Error('fail'));
            await expect(getGovtServicesListApi(1, 'corporate')).resolves.toEqual([]);
        });
    });

    describe('requestExpertCallbackApi', () => {
        const payload = { name: 'Jane', email: 'j@x.com', mobile: '9999999999', catalogId: 'abc' };

        it('posts the payload and returns true when data is present', async () => {
            (ApiClient.post as Mock).mockResolvedValue({ data: { ok: 1 } });

            await expect(requestExpertCallbackApi(1, 'corporate', payload)).resolves.toBe(true);
            expect(ApiClient.post).toHaveBeenCalledWith(`${BASE}/request-callback`, payload);
        });

        it('falls back to resp.status when data is missing', async () => {
            (ApiClient.post as Mock).mockResolvedValueOnce({ status: true });
            await expect(requestExpertCallbackApi(1, 'corporate', payload)).resolves.toBe(true);

            (ApiClient.post as Mock).mockResolvedValueOnce({ status: false });
            await expect(requestExpertCallbackApi(1, 'corporate', payload)).resolves.toBe(false);
        });

        it('returns false on failure', async () => {
            (ApiClient.post as Mock).mockRejectedValue(new Error('fail'));
            await expect(requestExpertCallbackApi(1, 'corporate', payload)).resolves.toBe(false);
        });
    });

    describe('getVendorServiceDetailsApi', () => {
        it('queries by service_id and returns variants', async () => {
            const variants = [{ id: 11 }, { id: 12 }];
            (ApiClient.get as Mock).mockResolvedValue({ data: { total: 2, variants } });

            await expect(getVendorServiceDetailsApi(1, 'corporate', 100)).resolves.toEqual(variants);
            expect(ApiClient.get).toHaveBeenCalledWith(`${BASE}/service-details`, { params: { service_id: 100 } });
        });

        it('returns [] on missing variants or failure', async () => {
            (ApiClient.get as Mock).mockResolvedValueOnce({ data: {} });
            await expect(getVendorServiceDetailsApi(1, 'corporate', 100)).resolves.toEqual([]);

            (ApiClient.get as Mock).mockRejectedValueOnce(new Error('fail'));
            await expect(getVendorServiceDetailsApi(1, 'corporate', 100)).resolves.toEqual([]);
        });
    });

    describe('getVendorServiceDocumentsApi', () => {
        it('queries by service_id and returns documents', async () => {
            const documents = [{ id: 1, doc_name: 'PAN' }];
            (ApiClient.get as Mock).mockResolvedValue({ data: { total: 1, documents } });

            await expect(getVendorServiceDocumentsApi(1, 'corporate', '100')).resolves.toEqual(documents);
            expect(ApiClient.get).toHaveBeenCalledWith(`${BASE}/service-documents`, {
                params: { service_id: '100' },
            });
        });

        it('returns [] on missing documents or failure', async () => {
            (ApiClient.get as Mock).mockResolvedValueOnce({});
            await expect(getVendorServiceDocumentsApi(1, 'corporate', 100)).resolves.toEqual([]);

            (ApiClient.get as Mock).mockRejectedValueOnce(new Error('fail'));
            await expect(getVendorServiceDocumentsApi(1, 'corporate', 100)).resolves.toEqual([]);
        });
    });

    describe('getVendorBusinessesApi', () => {
        it('scopes by gid when provided', async () => {
            const businesses = [{ application_id: 555 }];
            (ApiClient.get as Mock).mockResolvedValue({ data: { total: 1, businesses } });

            await expect(getVendorBusinessesApi(1, 'corporate', 'G-1')).resolves.toEqual(businesses);
            expect(ApiClient.get).toHaveBeenCalledWith(`${BASE}/vendor-businesses`, { params: { gid: 'G-1' } });
        });

        it('sends no params when gid is null or omitted', async () => {
            (ApiClient.get as Mock).mockResolvedValue({ data: { total: 0, businesses: [] } });

            await getVendorBusinessesApi(1, 'corporate', null);
            await getVendorBusinessesApi(1, 'corporate');
            expect(ApiClient.get).toHaveBeenNthCalledWith(1, `${BASE}/vendor-businesses`, { params: undefined });
            expect(ApiClient.get).toHaveBeenNthCalledWith(2, `${BASE}/vendor-businesses`, { params: undefined });
        });

        it('returns [] on missing data or failure', async () => {
            (ApiClient.get as Mock).mockResolvedValueOnce({});
            await expect(getVendorBusinessesApi(1, 'corporate')).resolves.toEqual([]);

            (ApiClient.get as Mock).mockRejectedValueOnce(new Error('fail'));
            await expect(getVendorBusinessesApi(1, 'corporate')).resolves.toEqual([]);
        });
    });

    describe('getVendorBusinessDetailApi', () => {
        it('queries by application_id and returns the detail result', async () => {
            const data = { business: { application_id: 555 }, directors: [], shareholding: [] };
            (ApiClient.get as Mock).mockResolvedValue({ data });

            await expect(getVendorBusinessDetailApi(1, 'corporate', 555)).resolves.toEqual(data);
            expect(ApiClient.get).toHaveBeenCalledWith(`${BASE}/vendor-business-detail`, {
                params: { application_id: 555 },
            });
        });

        it('returns null on missing data or failure', async () => {
            (ApiClient.get as Mock).mockResolvedValueOnce({});
            await expect(getVendorBusinessDetailApi(1, 'corporate', 555)).resolves.toBeNull();

            (ApiClient.get as Mock).mockRejectedValueOnce(new Error('fail'));
            await expect(getVendorBusinessDetailApi(1, 'corporate', 555)).resolves.toBeNull();
        });
    });

    describe('createVendorBusinessApi', () => {
        const call = () =>
            createVendorBusinessApi(
                1,
                'corporate',
                'ABCDE1234F',
                'Private Limited',
                'Peko Pvt Ltd',
                'Karnataka',
                'Jane',
                'j@x.com',
                '9999999999',
                'catalog-1'
            );

        it('posts the full body and merges the top-level message into data', async () => {
            const data = { applicationId: 555, created: true, gid: 'G-1', leadCreated: true };
            (ApiClient.post as Mock).mockResolvedValue({ data, message: 'Business created' });

            await expect(call()).resolves.toEqual({ ...data, message: 'Business created' });
            expect(ApiClient.post).toHaveBeenCalledWith(`${BASE}/vendor-businesses`, {
                pan: 'ABCDE1234F',
                entityType: 'Private Limited',
                proposedName: 'Peko Pvt Ltd',
                state: 'Karnataka',
                name: 'Jane',
                email: 'j@x.com',
                mobile: '9999999999',
                vendorCatalogId: 'catalog-1',
            });
        });

        it('returns null when data is missing', async () => {
            (ApiClient.post as Mock).mockResolvedValue({ message: 'nothing' });
            await expect(call()).resolves.toBeNull();
        });

        it('returns null on failure', async () => {
            (ApiClient.post as Mock).mockRejectedValue(new Error('fail'));
            await expect(call()).resolves.toBeNull();
        });
    });

    describe('verifyVendorPanApi', () => {
        it('posts the PAN and returns data', async () => {
            const data = { panStatus: 'VALID' };
            (ApiClient.post as Mock).mockResolvedValue({ data });

            await expect(verifyVendorPanApi(1, 'corporate', 'ABCDE1234F')).resolves.toEqual(data);
            expect(ApiClient.post).toHaveBeenCalledWith(`${BASE}/verify-pan`, { pan: 'ABCDE1234F' });
        });

        it('returns null on missing data or failure', async () => {
            (ApiClient.post as Mock).mockResolvedValueOnce({});
            await expect(verifyVendorPanApi(1, 'corporate', 'X')).resolves.toBeNull();

            (ApiClient.post as Mock).mockRejectedValueOnce(new Error('fail'));
            await expect(verifyVendorPanApi(1, 'corporate', 'X')).resolves.toBeNull();
        });
    });

    describe('getGovernmentServiceApplicationApi', () => {
        it('queries drafts by accessKey and row id', async () => {
            const draft = { id: 7, applicationNumber: 'APP-7' };
            (ApiClient.get as Mock).mockResolvedValue({ data: draft });

            await expect(getGovernmentServiceApplicationApi(1, 'corporate', 'k', 7)).resolves.toEqual(draft);
            expect(ApiClient.get).toHaveBeenCalledWith(`${BASE}/applications/drafts`, {
                params: { accessKey: 'k', id: 7 },
            });
        });

        it('omits id when applicationRowId is null/undefined', async () => {
            (ApiClient.get as Mock).mockResolvedValue({ data: null });

            await getGovernmentServiceApplicationApi(1, 'corporate', 'k', null);
            await getGovernmentServiceApplicationApi(1, 'corporate', 'k');
            expect(ApiClient.get).toHaveBeenNthCalledWith(1, `${BASE}/applications/drafts`, {
                params: { accessKey: 'k' },
            });
            expect(ApiClient.get).toHaveBeenNthCalledWith(2, `${BASE}/applications/drafts`, {
                params: { accessKey: 'k' },
            });
        });

        it('returns null on missing data or failure', async () => {
            (ApiClient.get as Mock).mockResolvedValueOnce({ data: null });
            await expect(getGovernmentServiceApplicationApi(1, 'corporate', 'k')).resolves.toBeNull();

            (ApiClient.get as Mock).mockRejectedValueOnce(new Error('fail'));
            await expect(getGovernmentServiceApplicationApi(1, 'corporate', 'k')).resolves.toBeNull();
        });
    });

    describe('getEngagementStatusApi', () => {
        it('queries by engagement_id and returns the engagement', async () => {
            const engagement = { eid: 1, rm: 'Ravi' };
            (ApiClient.get as Mock).mockResolvedValue({ data: { engagement } });

            await expect(getEngagementStatusApi(1, 'corporate', 'ENG-1')).resolves.toEqual(engagement);
            expect(ApiClient.get).toHaveBeenCalledWith(`${BASE}/engagement-status`, {
                params: { engagement_id: 'ENG-1' },
            });
        });

        it('returns null on missing engagement or failure', async () => {
            (ApiClient.get as Mock).mockResolvedValueOnce({ data: { engagement: null } });
            await expect(getEngagementStatusApi(1, 'corporate', 'ENG-1')).resolves.toBeNull();

            (ApiClient.get as Mock).mockResolvedValueOnce({});
            await expect(getEngagementStatusApi(1, 'corporate', 'ENG-1')).resolves.toBeNull();

            (ApiClient.get as Mock).mockRejectedValueOnce(new Error('fail'));
            await expect(getEngagementStatusApi(1, 'corporate', 'ENG-1')).resolves.toBeNull();
        });
    });

    describe('getAllGovernmentServiceApplicationsV2Api', () => {
        it('passes params and returns the data', async () => {
            const data = { total: 1, applications: [{ id: 1 }] };
            (ApiClient.get as Mock).mockResolvedValue({ data });

            await expect(
                getAllGovernmentServiceApplicationsV2Api(1, 'corporate', { page: 2, limit: 10, status: 'DRAFT' })
            ).resolves.toEqual(data);
            expect(ApiClient.get).toHaveBeenCalledWith(`${BASE}/applications`, {
                params: { page: 2, limit: 10, status: 'DRAFT' },
            });
        });

        it('returns an empty result on missing data or failure', async () => {
            (ApiClient.get as Mock).mockResolvedValueOnce({});
            await expect(getAllGovernmentServiceApplicationsV2Api(1, 'corporate')).resolves.toEqual({
                total: 0,
                applications: [],
            });

            (ApiClient.get as Mock).mockRejectedValueOnce(new Error('fail'));
            await expect(getAllGovernmentServiceApplicationsV2Api(1, 'corporate')).resolves.toEqual({
                total: 0,
                applications: [],
            });
        });
    });
});
