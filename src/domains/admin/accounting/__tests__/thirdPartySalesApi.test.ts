import { beforeEach, describe, expect, it, vi } from 'vitest';

import { ApiClient } from '@src/services/config';

import { downloadThirdPartySales, getThirdPartySales } from '../api/thirdPartySales';

vi.mock('@src/services/config', () => ({ ApiClient: { get: vi.fn() } }));

const BASE = {
    userType: 'system_user',
    userId: 7,
    kind: 'payment-links' as const,
    page: 1,
    itemsPerPage: 10,
    searchText: '',
    from: '2026-09-01',
    to: '2026-09-16',
};

beforeEach(() => {
    vi.clearAllMocks();
    (ApiClient.get as any).mockResolvedValue({ data: { entries: [], recordsTotal: 0 } });
});

describe('third-party sales request', () => {
    it('asks the accounting service for the kind in the address, naming no status by default', async () => {
        await getThirdPartySales(BASE);

        const [url, config] = (ApiClient.get as any).mock.calls[0];
        expect(url).toBe('system_user/7/others/accounting/third-party-sales/payment-links');
        expect(config.params).toEqual({
            page: 1,
            itemsPerPage: 10,
            searchText: '',
            from: '2026-09-01',
            to: '2026-09-16',
        });
    });

    it('names the status when one was picked', async () => {
        await getThirdPartySales({ ...BASE, status: 'paid' });

        expect((ApiClient.get as any).mock.calls[0][1].params.status).toBe('paid');
    });

    it('downloads the export of the same kind as a file, with the same filters', async () => {
        await downloadThirdPartySales({
            userType: 'system_user',
            userId: 7,
            kind: 'payment-links',
            searchText: 'acme',
            from: '2026-09-01',
            to: '2026-09-16',
            status: 'expired',
            format: 'excel',
        });

        const [url, config] = (ApiClient.get as any).mock.calls[0];
        expect(url).toBe(
            'system_user/7/others/accounting/third-party-sales/payment-links/export/excel'
        );
        expect(config.responseType).toBe('blob');
        expect(config.params).toEqual({
            searchText: 'acme',
            from: '2026-09-01',
            to: '2026-09-16',
            status: 'expired',
        });
    });

    it('answers false when the request fails', async () => {
        (ApiClient.get as any).mockRejectedValue(new Error('down'));

        expect(await getThirdPartySales(BASE)).toBe(false);
        expect(await downloadThirdPartySales({ ...BASE, format: 'pdf' })).toBe(false);
    });
});
