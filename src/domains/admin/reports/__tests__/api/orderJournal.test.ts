import { beforeEach, describe, expect, it, vi } from 'vitest';

import { ApiClient } from '@src/services/config';

import { downloadOrderJournals, getAllData, retryJournal } from '../../api/orderJournal';

vi.mock('@src/services/config', () => ({
    ApiClient: {
        get: vi.fn(),
        post: vi.fn(),
        put: vi.fn(),
    },
}));

const BASE = {
    userType: 'system_user',
    userId: 7,
    sort: 'DESC',
    sortField: 'transactionDate',
    page: 1,
    itemsPerPage: 10,
    searchText: '',
    from: '2026-09-01',
    to: '2026-09-29',
    status: '',
};

const sentParams = () => (ApiClient.get as any).mock.calls[0][1].params;

describe('order journals list request', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        (ApiClient.get as any).mockResolvedValue({ data: { result: [], totalData: 0 } });
    });

    it('sends the chosen partner', async () => {
        await getAllData({ ...BASE, partnerId: '55' } as any);

        expect(sentParams().partnerId).toBe('55');
    });

    it('sends Default as it is, so the server can pick out Peko customers', async () => {
        await getAllData({ ...BASE, partnerId: 'default' } as any);

        expect(sentParams().partnerId).toBe('default');
    });

    it('leaves the partner out when none is chosen', async () => {
        await getAllData({ ...BASE, partnerId: '' } as any);

        expect(sentParams().partnerId).toBeUndefined();
    });
});

describe('order journals export request', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        (ApiClient.get as any).mockResolvedValue(new Blob(['x']));
    });

    it('asks for the file in the chosen format, as a download', async () => {
        await downloadOrderJournals({ ...BASE, format: 'excel' });

        const [url, config] = (ApiClient.get as any).mock.calls[0];
        expect(url).toBe('system_user/7/others/order-journals/export/excel');
        expect(config.responseType).toBe('blob');
    });

    it('sends the same filters as the table, under the names the server reads', async () => {
        await downloadOrderJournals({
            ...BASE,
            status: 'failed',
            journalKey: 'refund',
            partnerId: 'default',
            searchText: 'acme',
            format: 'pdf',
        });

        expect(sentParams()).toEqual({
            sort: 'DESC',
            sortField: 'transactionDate',
            searchText: 'acme',
            from: '2026-09-01',
            to: '2026-09-29',
            journalStatus: 'failed',
            journalKey: 'refund',
            partnerId: 'default',
        });
    });

    it('leaves the partner out when none is chosen', async () => {
        await downloadOrderJournals({ ...BASE, partnerId: '', format: 'excel' });

        expect(sentParams().partnerId).toBeUndefined();
    });

    it('reports a failed download as false', async () => {
        (ApiClient.get as any).mockRejectedValue(new Error('422'));

        expect(await downloadOrderJournals({ ...BASE, format: 'excel' })).toBe(false);
    });
});

describe('retrying a journal', () => {
    const USER = { userType: 'system_user', userId: 7, corporateTxnId: '1791010579744' };
    const refusal = (message: string) => ({
        response: { data: { status: false, message, data: {} } },
    });

    beforeEach(() => vi.clearAllMocks());

    it('hands back what the server decided, held back or posted, as it is', async () => {
        (ApiClient.put as any).mockResolvedValue({
            data: {
                success: false,
                skipped: true,
                reason: 'Commission for "Electricity Bill" is still not marked as configured.',
            },
        });

        expect(await retryJournal({ ...USER, journalKey: 'transaction' } as any)).toEqual({
            success: false,
            skipped: true,
            reason: 'Commission for "Electricity Bill" is still not marked as configured.',
        });
    });

    it('turns a refused retry into a reason the screen can show', async () => {
        (ApiClient.put as any).mockRejectedValue(
            refusal('This order is still pending — retry once it has a final status.')
        );

        expect(await retryJournal({ ...USER, journalKey: 'transaction' } as any)).toEqual({
            success: false,
            reason: 'This order is still pending — retry once it has a final status.',
        });
    });

    it('reports nothing when the request never reached the server', async () => {
        (ApiClient.put as any).mockRejectedValue(new Error('Network Error'));

        expect(await retryJournal({ ...USER, journalKey: 'transaction' } as any)).toBe(false);
    });
});
