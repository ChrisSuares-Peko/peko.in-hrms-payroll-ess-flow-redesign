import { beforeEach, describe, expect, it, vi } from 'vitest';

import { ApiClient } from '@src/services/config';

import { downloadPartnerLedgerTab } from '../api/partnerLedger';

vi.mock('@src/services/config', () => ({ ApiClient: { get: vi.fn() } }));

const BASE = {
    userType: 'system_user',
    userId: 7,
    partnerId: '3126',
    from: '2026-09-06',
    to: '2026-10-06',
};

beforeEach(() => {
    vi.clearAllMocks();
    (ApiClient.get as any).mockResolvedValue(new Blob(['x']));
});

describe('partner ledger export request', () => {
    it.each([
        ['transactions', 'excel'],
        ['own-subscriptions', 'pdf'],
        ['payments', 'excel'],
        ['debit-notes', 'pdf'],
    ] as const)('asks for the %s file as %s, as a download', async (tab, format) => {
        await downloadPartnerLedgerTab({ ...BASE, tab, format });

        const [url, config] = (ApiClient.get as any).mock.calls[0];
        expect(url).toBe(`system_user/7/others/accounting/partners/3126/${tab}/export/${format}`);
        expect(config.responseType).toBe('blob');
    });

    it('sends the date range and the search the table is showing', async () => {
        await downloadPartnerLedgerTab({
            ...BASE,
            tab: 'transactions',
            format: 'pdf',
            searchText: 'imtd',
        });

        expect((ApiClient.get as any).mock.calls[0][1].params).toEqual({
            from: '2026-09-06',
            to: '2026-10-06',
            searchText: 'imtd',
        });
    });

    it('reports a failed download as false', async () => {
        (ApiClient.get as any).mockRejectedValue(new Error('422'));

        expect(await downloadPartnerLedgerTab({ ...BASE, tab: 'payments', format: 'excel' })).toBe(
            false
        );
    });
});
