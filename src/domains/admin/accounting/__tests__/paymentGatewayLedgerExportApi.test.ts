import { beforeEach, describe, expect, it, vi } from 'vitest';

import { ApiClient } from '@src/services/config';

import { downloadPaymentGatewayLedgerTab } from '../api/paymentGatewayLedger';

vi.mock('@src/services/config', () => ({ ApiClient: { get: vi.fn() } }));

const BASE = {
    userType: 'system_user',
    userId: 7,
    gatewayId: '4003352000000058004',
    from: '2026-09-06',
    to: '2026-10-06',
};

beforeEach(() => {
    vi.clearAllMocks();
    (ApiClient.get as any).mockResolvedValue(new Blob(['x']));
});

describe('payment gateway ledger export request', () => {
    it.each([
        ['transactions', 'excel'],
        ['received', 'pdf'],
        ['fees', 'excel'],
    ] as const)('asks for the %s file as %s, as a download', async (tab, format) => {
        await downloadPaymentGatewayLedgerTab({ ...BASE, tab, format });

        const [url, config] = (ApiClient.get as any).mock.calls[0];
        expect(url).toBe(
            `system_user/7/others/accounting/payment-gateways/4003352000000058004/${tab}/export/${format}`
        );
        expect(config.responseType).toBe('blob');
    });

    it('sends the date range the table is showing', async () => {
        await downloadPaymentGatewayLedgerTab({ ...BASE, tab: 'transactions', format: 'pdf' });

        expect((ApiClient.get as any).mock.calls[0][1].params).toEqual({
            from: '2026-09-06',
            to: '2026-10-06',
        });
    });

    it('reports a failed download as false', async () => {
        (ApiClient.get as any).mockRejectedValue(new Error('422'));

        expect(
            await downloadPaymentGatewayLedgerTab({ ...BASE, tab: 'fees', format: 'excel' })
        ).toBe(false);
    });
});
