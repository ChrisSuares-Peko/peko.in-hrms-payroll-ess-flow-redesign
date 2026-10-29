import { act, renderHook, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { SubscriptionAddOnResponse, subscriptionHistoryResponse } from '@customtypes/general';
import { getAddonDetails, getSubscriptionHistory } from '@src/services/subscription';

import useGetAddonDetails from '../useSubscriptionAddons';

vi.mock('@src/services/subscription', () => ({
    getAddonDetails: vi.fn(),
    getSubscriptionHistory: vi.fn(),
}));

const addonResponse: SubscriptionAddOnResponse = {
    unitPrice: 10,
    maxLimit: 5,
    freeBaseLimit: 5,
    addonLimit: 0,
    packageId: 1,
    isDynamicUnitPricing: false,
    isAddonPurchaseAllowed: true,
};

const historyResponse = {
    currentSubscription: { subscriptionEndDate: '2026-12-31' },
    addOns: null,
    isGroupSubscription: true,
} as unknown as subscriptionHistoryResponse;

function createDeferred<T>() {
    let resolve: (value: T) => void = () => {};
    const promise = new Promise<T>(res => {
        resolve = res;
    });
    return { promise, resolve };
}

describe('useGetAddonDetails', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('stays loading until both the add-on details and the purchase history have settled', async () => {
        const addon = createDeferred<SubscriptionAddOnResponse | false>();
        const history = createDeferred<subscriptionHistoryResponse | false>();
        vi.mocked(getAddonDetails).mockReturnValue(addon.promise);
        vi.mocked(getSubscriptionHistory).mockReturnValue(history.promise);

        const { result } = renderHook(() => useGetAddonDetails('esign', 'eSign'));
        expect(result.current.isLoading).toBe(true);

        await act(async () => {
            history.resolve(historyResponse);
        });

        expect(result.current.isLoading).toBe(true);
        expect(result.current.addonData).toBeUndefined();

        await act(async () => {
            addon.resolve(addonResponse);
        });

        expect(result.current.isLoading).toBe(false);
        expect(result.current.addonData).toEqual(addonResponse);
        expect(result.current.purchaseData).toEqual(historyResponse);
    });

    it('settles on the add-on request alone when purchase history is not fetched', async () => {
        vi.mocked(getAddonDetails).mockResolvedValue(addonResponse);

        const { result } = renderHook(() => useGetAddonDetails('esign', 'eSign', false));

        await waitFor(() => expect(result.current.isLoading).toBe(false));
        expect(result.current.addonData).toEqual(addonResponse);
        expect(getSubscriptionHistory).not.toHaveBeenCalled();
    });

    it('stops loading without add-on data when the add-on request fails', async () => {
        vi.mocked(getAddonDetails).mockResolvedValue(false);
        vi.mocked(getSubscriptionHistory).mockResolvedValue(historyResponse);

        const { result } = renderHook(() => useGetAddonDetails('esign', 'eSign'));

        await waitFor(() => expect(result.current.isLoading).toBe(false));
        expect(result.current.addonData).toBeUndefined();
    });

    it('keeps the current add-on data while a refresh is in flight', async () => {
        vi.mocked(getAddonDetails).mockResolvedValue(addonResponse);
        vi.mocked(getSubscriptionHistory).mockResolvedValue(historyResponse);

        const { result } = renderHook(() => useGetAddonDetails('esign', 'eSign'));
        await waitFor(() => expect(result.current.isLoading).toBe(false));

        const refreshedAddon = createDeferred<SubscriptionAddOnResponse | false>();
        const refreshedHistory = createDeferred<subscriptionHistoryResponse | false>();
        vi.mocked(getAddonDetails).mockReturnValue(refreshedAddon.promise);
        vi.mocked(getSubscriptionHistory).mockReturnValue(refreshedHistory.promise);

        let refreshing: Promise<void> = Promise.resolve();
        act(() => {
            refreshing = result.current.refresh();
        });

        expect(result.current.isLoading).toBe(true);
        expect(result.current.addonData).toEqual(addonResponse);

        await act(async () => {
            refreshedAddon.resolve({ ...addonResponse, maxLimit: 8 });
            refreshedHistory.resolve(historyResponse);
            await refreshing;
        });

        expect(result.current.isLoading).toBe(false);
        expect(result.current.addonData?.maxLimit).toBe(8);
    });
});
