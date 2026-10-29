import { beforeEach, describe, expect, it, vi } from 'vitest';

import { ApiClient } from '@src/services/config';

import { getSubscriptionAddOns } from '../api/subscriptionAddOns';

vi.mock('@src/services/config', () => ({ ApiClient: { get: vi.fn() } }));

const BASE = {
    userType: 'system_user',
    userId: 7,
    page: 1,
    itemsPerPage: 10,
    searchText: '',
    partnerId: '',
};

beforeEach(() => {
    vi.clearAllMocks();
    (ApiClient.get as any).mockResolvedValue({ data: { data: [], recordsTotal: 0 } });
});

describe('subscription add-ons request', () => {
    it('asks the cashback service for the add-ons, naming no kind by default', async () => {
        await getSubscriptionAddOns(BASE);

        const [url, config] = (ApiClient.get as any).mock.calls[0];
        expect(url).toBe('system_user/7/others/cashback/subscription-add-ons');
        expect(config.params).toEqual(
            expect.objectContaining({ page: 1, itemsPerPage: 10, partnerId: '' })
        );
        expect(config.params.kind).toBeUndefined();
    });

    it('asks for the one-time items when the Others tab wants them', async () => {
        await getSubscriptionAddOns({ ...BASE, kind: 'others' });

        expect((ApiClient.get as any).mock.calls[0][1].params.kind).toBe('others');
    });
});
