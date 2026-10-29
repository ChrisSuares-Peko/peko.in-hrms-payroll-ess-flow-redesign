import { beforeEach, describe, expect, it, vi } from 'vitest';

import { ApiClient } from '@src/services/config';

import { downloadVendorLedgerTab } from '../api/vendorLedger';

vi.mock('@src/services/config', () => ({ ApiClient: { get: vi.fn() } }));

const BASE = {
    userType: 'system_user',
    userId: 7,
    vendorId: '5001',
    from: '2026-09-06',
    to: '2026-10-06',
};

beforeEach(() => {
    vi.clearAllMocks();
    (ApiClient.get as any).mockResolvedValue(new Blob(['x']));
});

describe('vendor ledger export request', () => {
    it.each([
        ['transactions', 'excel'],
        ['commissions', 'pdf'],
        ['deposits', 'excel'],
        ['credit-notes', 'pdf'],
        ['cost-of-sales', 'excel'],
        ['debit-notes', 'pdf'],
    ] as const)('asks for the %s file as %s, as a download', async (tab, format) => {
        await downloadVendorLedgerTab({ ...BASE, tab, format });

        const [url, config] = (ApiClient.get as any).mock.calls[0];
        expect(url).toBe(`system_user/7/others/accounting/vendors/5001/${tab}/export/${format}`);
        expect(config.responseType).toBe('blob');
    });

    it('sends the date range and the search the table is showing', async () => {
        await downloadVendorLedgerTab({
            ...BASE,
            tab: 'transactions',
            format: 'pdf',
            searchText: 'acme',
        });

        expect((ApiClient.get as any).mock.calls[0][1].params).toEqual({
            from: '2026-09-06',
            to: '2026-10-06',
            searchText: 'acme',
        });
    });

    it('sends the status the table is filtered to', async () => {
        await downloadVendorLedgerTab({
            ...BASE,
            tab: 'transactions',
            format: 'excel',
            status: 'refunded',
        });

        expect((ApiClient.get as any).mock.calls[0][1].params).toEqual({
            from: '2026-09-06',
            to: '2026-10-06',
            status: 'refunded',
        });
    });

    it('sends the mode the deposits table is filtered to', async () => {
        await downloadVendorLedgerTab({ ...BASE, tab: 'deposits', format: 'pdf', mode: 'UPI' });

        expect((ApiClient.get as any).mock.calls[0][1].params).toEqual({
            from: '2026-09-06',
            to: '2026-10-06',
            mode: 'UPI',
        });
    });

    it('reports a failed download as false', async () => {
        (ApiClient.get as any).mockRejectedValue(new Error('422'));

        expect(
            await downloadVendorLedgerTab({ ...BASE, tab: 'commissions', format: 'excel' })
        ).toBe(false);
    });
});
