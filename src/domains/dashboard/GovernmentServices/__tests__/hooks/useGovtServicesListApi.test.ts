import { act, renderHook } from '@testing-library/react';
import { beforeEach, describe, expect, it, Mock, vi } from 'vitest';

import { useAppDispatch, useAppSelector } from '@src/hooks/store';

import { getGovtServicesListApi, GovtServiceApiItem } from '../../apis';
import useGovtServicesListApi, { mapApiItem } from '../../hooks/useGovtServicesListApi';

vi.mock('@src/hooks/store', () => ({
    useAppSelector: vi.fn(),
    useAppDispatch: vi.fn(),
}));

vi.mock('../../apis', () => ({
    getGovtServicesListApi: vi.fn(),
}));

const mockDispatch = vi.fn();

const mockApiItem: GovtServiceApiItem = {
    id: 1,
    name: 'MSME Registration',
    slug: 'msme-registration',
    accessKey: 'govt_msme',
    description: 'Register your MSME',
    category: 'Registration',
    tag: 'Mandatory',
    processingTime: '2-5 days',
    price: '999',
    govtFee: null,
    status: true,
    sortOrder: 1,
};

describe('mapApiItem', () => {
    it('maps name, slug, accessKey, category and tab', () => {
        const result = mapApiItem(mockApiItem);
        expect(result.id).toBe(1);
        expect(result.name).toBe('MSME Registration');
        expect(result.slug).toBe('msme-registration');
        expect(result.accessKey).toBe('govt_msme');
        expect(result.tab).toBe('Mandatory');
        expect(result.category).toBe('Registration');
    });

    it('sets govtFee to "Free" when null', () => {
        expect(mapApiItem(mockApiItem).govtFee).toBe('Free');
    });

    it('sets govtFee to "Free" when "0"', () => {
        expect(mapApiItem({ ...mockApiItem, govtFee: '0' }).govtFee).toBe('Free');
    });

    it('sets govtFee to "Free" when "Free"', () => {
        expect(mapApiItem({ ...mockApiItem, govtFee: 'Free' }).govtFee).toBe('Free');
    });

    it('sets govtFee to a number when a positive numeric value', () => {
        expect(mapApiItem({ ...mockApiItem, govtFee: '500' }).govtFee).toBe(500);
    });

    it('uses processingTime for duration', () => {
        expect(mapApiItem(mockApiItem).duration).toBe('2-5 days');
    });

    it('falls back to empty string when processingTime is null and no serviceDetailsMap entry', () => {
        // Use an id that has no entry in serviceDetailsMap to test the empty-string fallback
        expect(mapApiItem({ ...mockApiItem, id: 99999, processingTime: null }).duration).toBe('');
    });

    it('converts price to number', () => {
        expect(mapApiItem(mockApiItem).price).toBe(999);
    });

    it('maps empty description to empty string when null', () => {
        expect(mapApiItem({ ...mockApiItem, description: null }).description).toBe('');
    });
});

describe('useGovtServicesListApi Hook', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        (useAppSelector as Mock).mockReturnValue({ role: 'admin', id: '123' });
        (useAppDispatch as Mock).mockReturnValue(mockDispatch);
        (getGovtServicesListApi as Mock).mockResolvedValue([]);
    });

    it('calls getGovtServicesListApi twice on mount (counts + filtered)', async () => {
        (getGovtServicesListApi as Mock).mockResolvedValue([mockApiItem]);

        renderHook(() => useGovtServicesListApi({}));

        await act(async () => {});

        expect(getGovtServicesListApi).toHaveBeenCalledTimes(2);
    });

    it('computes tabCounts correctly from the all-services fetch', async () => {
        const items: GovtServiceApiItem[] = [
            { ...mockApiItem, tag: 'Mandatory' },
            { ...mockApiItem, id: 2, accessKey: 'govt_trademark', tag: 'Mandatory' },
            { ...mockApiItem, id: 3, accessKey: 'govt_startup', tag: 'Good-to-have' },
        ];
        (getGovtServicesListApi as Mock).mockResolvedValue(items);

        const { result } = renderHook(() => useGovtServicesListApi({}));

        await act(async () => {});

        expect(result.current.tabCounts.Mandatory).toBe(2);
        expect(result.current.tabCounts['Good-to-have']).toBe(1);
        expect(result.current.tabCounts['Regulatory Dependent']).toBe(0);
    });

    it('filters out hidden accessKeys (govt_gst_composition)', async () => {
        const items: GovtServiceApiItem[] = [
            mockApiItem,
            { ...mockApiItem, id: 2, accessKey: 'govt_gst_composition' },
        ];
        (getGovtServicesListApi as Mock).mockResolvedValue(items);

        const { result } = renderHook(() => useGovtServicesListApi({}));

        await act(async () => {});

        expect(result.current.services).toHaveLength(1);
        expect(result.current.services[0].accessKey).toBe('govt_msme');
    });

    it('passes search params to filtered API call', async () => {
        renderHook(() =>
            useGovtServicesListApi({
                searchText: 'msme',
                category: 'Business Recognition',
                tag: 'Mandatory',
                authority: 'Central',
            })
        );

        await act(async () => {});

        expect(getGovtServicesListApi).toHaveBeenCalledWith('123', 'admin', {
            searchText: 'msme',
            category: 'Business Recognition',
            tag: 'Mandatory',
            authority: 'Central',
        });
    });

    it('omits "All" from category and authority params', async () => {
        renderHook(() => useGovtServicesListApi({ category: 'All', authority: 'All' }));

        await act(async () => {});

        const { calls } = (getGovtServicesListApi as Mock).mock;
        const filteredCall = calls.find(c => c[2] !== undefined);
        expect(filteredCall?.[2]).not.toHaveProperty('category');
        expect(filteredCall?.[2]).not.toHaveProperty('authority');
    });

    it('starts with isLoading true and sets it false after data loads', async () => {
        (getGovtServicesListApi as Mock).mockResolvedValue([mockApiItem]);

        const { result } = renderHook(() => useGovtServicesListApi({}));

        expect(result.current.isLoading).toBe(true);

        await act(async () => {});

        expect(result.current.isLoading).toBe(false);
    });

    it('re-fetches filtered services when params change', async () => {
        const { rerender } = renderHook(
            ({ searchText }) => useGovtServicesListApi({ searchText }),
            { initialProps: { searchText: '' } }
        );

        await act(async () => {});

        rerender({ searchText: 'trademark' });

        await act(async () => {});

        // Initial mount: 2 calls (counts effect + filtered effect)
        // After param change: 1 more call (only the filtered effect re-runs)
        expect(getGovtServicesListApi).toHaveBeenCalledTimes(3);
        expect(getGovtServicesListApi).toHaveBeenLastCalledWith('123', 'admin', {
            searchText: 'trademark',
        });
    });

    it('dispatches setServicesList with mapped items', async () => {
        (getGovtServicesListApi as Mock).mockResolvedValue([mockApiItem]);

        renderHook(() => useGovtServicesListApi({}));

        await act(async () => {});

        expect(mockDispatch).toHaveBeenCalled();
        const dispatchArg = mockDispatch.mock.calls[0][0];
        expect(dispatchArg.payload[0].name).toBe('MSME Registration');
    });
});
