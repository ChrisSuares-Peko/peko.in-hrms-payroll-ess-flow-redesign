import { act, renderHook, waitFor } from '@testing-library/react';
import { Mock, beforeEach, describe, expect, it, vi } from 'vitest';

import { useAppSelector } from '@src/hooks/store';

import {
    createAccountingCashbackApi,
    updateAccountingCashbackApi,
    updateAccountingServiceCashbackBulk,
} from '../api/services';
import { getSubscriptionAddOns, SubscriptionAddOnRow } from '../api/subscriptionAddOns';
import usePekoSubscriptionAddons from '../hooks/usePekoSubscriptionAddons';

vi.mock('@src/hooks/store', () => ({ useAppSelector: vi.fn() }));
vi.mock('../api/services', () => ({
    createAccountingCashbackApi: vi.fn(),
    updateAccountingCashbackApi: vi.fn(),
    updateAccountingServiceCashbackBulk: vi.fn(),
}));
vi.mock('../api/subscriptionAddOns', () => ({ getSubscriptionAddOns: vi.fn() }));

const FILTERS = { searchText: '', page: 1, itemsPerPage: 10, partnerId: '' };
const OTHERS_FILTERS = { ...FILTERS, kind: 'others' as const };

const configuredRow: SubscriptionAddOnRow = {
    packageId: 109,
    cashbackId: 583,
    packageName: 'Payroll',
    serviceProvider: 'Payroll',
    accessKey: 'peko_payroll',
    serviceOperatorId: 67,
    partnerId: null,
    partnerName: null,
    unitPrice: '20.00',
    baseLimit: '10.00',
    cashbackType: 'PERCENTAGE',
    cashback: '5',
    surchargeType: 'PERCENTAGE',
    surcharge: '2',
};

const unconfiguredRow: SubscriptionAddOnRow = {
    packageId: 8,
    cashbackId: null,
    packageName: 'eSign',
    serviceProvider: 'E Sign',
    accessKey: 'signDesk_eSign',
    serviceOperatorId: 64,
    partnerId: null,
    partnerName: null,
    unitPrice: null,
    baseLimit: null,
    cashbackType: null,
    cashback: null,
    surchargeType: null,
    surcharge: null,
};

beforeEach(() => {
    vi.clearAllMocks();
    (useAppSelector as unknown as Mock).mockImplementation(selector =>
        selector({ reducer: { auth: { role: 'system_user', id: 7 } } })
    );
    (getSubscriptionAddOns as Mock).mockResolvedValue({
        data: [configuredRow, unconfiguredRow],
        recordsTotal: 2,
    });
});

describe('fetching rows', () => {
    it('lists every eligible package, configured or not', async () => {
        const { result } = renderHook(() => usePekoSubscriptionAddons(FILTERS));

        await waitFor(() => expect(result.current.isLoading).toBe(false));

        expect(result.current.rows).toEqual([configuredRow, unconfiguredRow]);
        expect(result.current.count).toBe(2);
        expect(getSubscriptionAddOns).toHaveBeenCalledWith({
            userId: 7,
            userType: 'system_user',
            ...FILTERS,
        });
    });

    it('asks for the kind of rows the tab wants', async () => {
        const { result } = renderHook(() => usePekoSubscriptionAddons(OTHERS_FILTERS));

        await waitFor(() => expect(result.current.isLoading).toBe(false));

        expect(getSubscriptionAddOns).toHaveBeenCalledWith(
            expect.objectContaining({ kind: 'others' })
        );
    });
});

describe('saving a single row', () => {
    it('updates an already-configured row, echoing its own cashback/surcharge fields back', async () => {
        (updateAccountingCashbackApi as Mock).mockResolvedValue({ status: true });
        const { result } = renderHook(() => usePekoSubscriptionAddons(FILTERS));
        await waitFor(() => expect(result.current.isLoading).toBe(false));

        let success = false;
        await act(async () => {
            success = await result.current.saveRow(configuredRow, {
                unitPrice: '25',
                baseLimit: '15',
            });
        });

        expect(success).toBe(true);
        expect(updateAccountingCashbackApi).toHaveBeenCalledWith({
            userId: 7,
            userType: 'system_user',
            id: 583,
            packageId: '109',
            serviceOperatorId: '67',
            cashbackType: 'PERCENTAGE',
            cashback: '5',
            surchargeType: 'PERCENTAGE',
            surcharge: '2',
            unitPrice: '25',
            baseLimit: '15',
        });
        expect(createAccountingCashbackApi).not.toHaveBeenCalled();
    });

    it('creates a never-configured row with FLAT/0 cashback defaults', async () => {
        (createAccountingCashbackApi as Mock).mockResolvedValue({ status: true });
        const { result } = renderHook(() => usePekoSubscriptionAddons(FILTERS));
        await waitFor(() => expect(result.current.isLoading).toBe(false));

        let success = false;
        await act(async () => {
            success = await result.current.saveRow(unconfiguredRow, {
                unitPrice: '40',
                baseLimit: '5',
            });
        });

        expect(success).toBe(true);
        expect(createAccountingCashbackApi).toHaveBeenCalledWith({
            userId: 7,
            userType: 'system_user',
            packageId: '8',
            serviceOperatorId: '64',
            cashbackType: 'FLAT',
            cashback: '0',
            surchargeType: 'FLAT',
            surcharge: '0',
            unitPrice: '40',
            baseLimit: '5',
        });
        expect(updateAccountingCashbackApi).not.toHaveBeenCalled();
    });
});

describe('bulk-saving a mixed selection', () => {
    it('bulk-updates the configured rows and creates the unconfigured ones separately', async () => {
        (updateAccountingServiceCashbackBulk as Mock).mockResolvedValue({ status: true });
        (createAccountingCashbackApi as Mock).mockResolvedValue({ status: true });
        const { result } = renderHook(() => usePekoSubscriptionAddons(FILTERS));
        await waitFor(() => expect(result.current.isLoading).toBe(false));

        let success = false;
        await act(async () => {
            success = await result.current.bulkSaveRows([configuredRow, unconfiguredRow], {
                unitPrice: '99',
                baseLimit: '9',
            });
        });

        expect(success).toBe(true);
        expect(updateAccountingServiceCashbackBulk).toHaveBeenCalledWith({
            userId: 7,
            userType: 'system_user',
            ids: [583],
            unitPrice: '99',
            baseLimit: '9',
        });
        expect(createAccountingCashbackApi).toHaveBeenCalledWith(
            expect.objectContaining({ packageId: '8', unitPrice: '99', baseLimit: '9' })
        );
    });

    it('skips the bulk-update call when every selected row is unconfigured', async () => {
        (createAccountingCashbackApi as Mock).mockResolvedValue({ status: true });
        const { result } = renderHook(() => usePekoSubscriptionAddons(FILTERS));
        await waitFor(() => expect(result.current.isLoading).toBe(false));

        await act(async () => {
            await result.current.bulkSaveRows([unconfiguredRow], {
                unitPrice: '10',
                baseLimit: '1',
            });
        });

        expect(updateAccountingServiceCashbackBulk).not.toHaveBeenCalled();
    });

    it('reports failure when any create in the batch fails', async () => {
        (updateAccountingServiceCashbackBulk as Mock).mockResolvedValue({ status: true });
        (createAccountingCashbackApi as Mock).mockResolvedValue(false);
        const { result } = renderHook(() => usePekoSubscriptionAddons(FILTERS));
        await waitFor(() => expect(result.current.isLoading).toBe(false));

        let success = true;
        await act(async () => {
            success = await result.current.bulkSaveRows([configuredRow, unconfiguredRow], {
                unitPrice: '1',
                baseLimit: '1',
            });
        });

        expect(success).toBe(false);
    });
});
