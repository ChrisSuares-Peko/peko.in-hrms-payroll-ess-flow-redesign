import { renderHook, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, Mock, vi } from 'vitest';

import { useAppDispatch, useAppSelector } from '@src/hooks/store';

import { GovtServiceApiItem, getGovtServicesListApi } from '../../apis';
import useGovtServicesListApi, { mapApiItem } from '../../hooks/useGovtServicesListApi';
import { setServicesList } from '../../slices';

vi.mock('@src/hooks/store', () => ({
    useAppDispatch: vi.fn(),
    useAppSelector: vi.fn(),
}));

vi.mock('../../apis', () => ({
    getGovtServicesListApi: vi.fn(),
}));

const mockDispatch = vi.fn();
const mockState = { reducer: { auth: { role: 'corporate', id: 1 } } };

const baseItem: GovtServiceApiItem = {
    id: '10',
    service_id: 100,
    service_name: 'Trademark Registration',
    variant_name: 'Standard',
    description: 'Register your brand',
    market_price: 6000,
    price: 5000,
    government_fee_amount: 4500,
    unit: '7 days',
    currency: 'INR',
    about: 'About trademark',
    sortOrder: 1,
    status: true,
};

describe('mapApiItem', () => {
    it('maps a full catalog row into a Service', () => {
        expect(mapApiItem(baseItem)).toEqual({
            id: 10,
            serviceId: 100,
            name: 'Trademark Registration',
            slug: 'trademark-registration',
            accessKey: '10',
            description: 'Register your brand',
            category: 'Standard',
            tab: 'Mandatory',
            duration: '7 days',
            price: 5000,
            govtFee: 4500,
        });
    });

    it('falls back to 0 id for non-numeric ids and uses the id as slug source when name is null', () => {
        const mapped = mapApiItem({ ...baseItem, id: 'Abc Def_1', service_name: null });
        expect(mapped.id).toBe(0);
        expect(mapped.accessKey).toBe('Abc Def_1');
        expect(mapped.name).toBe('Standard');
        expect(mapped.slug).toBe('abc-def-1');
    });

    it('uses empty strings and defaults when optional fields are null', () => {
        const mapped = mapApiItem({
            ...baseItem,
            service_id: null,
            service_name: null,
            variant_name: null,
            description: null,
            about: null,
            unit: null,
        });
        expect(mapped.serviceId).toBeNull();
        expect(mapped.name).toBe('');
        expect(mapped.description).toBe('');
        expect(mapped.category).toBe('');
        expect(mapped.duration).toBe('');
    });

    it('falls back to about when description is null', () => {
        expect(mapApiItem({ ...baseItem, description: null }).description).toBe('About trademark');
    });

    it('coerces numeric strings and treats a zero/invalid government fee as Free', () => {
        const mapped = mapApiItem({
            ...baseItem,
            price: '1200' as unknown as number,
            government_fee_amount: 0,
        });
        expect(mapped.price).toBe(1200);
        expect(mapped.govtFee).toBe('Free');

        const invalid = mapApiItem({
            ...baseItem,
            price: 'x' as unknown as number,
            government_fee_amount: 'y' as unknown as number,
        });
        expect(invalid.price).toBe(0);
        expect(invalid.govtFee).toBe('Free');
    });

    it('strips leading/trailing punctuation from the slug', () => {
        expect(mapApiItem({ ...baseItem, service_name: '  (GST) Registration!! ' }).slug).toBe('gst-registration');
    });
});

describe('useGovtServicesListApi', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        (useAppDispatch as Mock).mockReturnValue(mockDispatch);
        (useAppSelector as Mock).mockImplementation((selector) => selector(mockState));
    });

    const rows: GovtServiceApiItem[] = [
        baseItem,
        { ...baseItem, id: '32', service_name: 'Trademark Objection', description: 'Reply to objection' },
        { ...baseItem, id: '1', service_name: 'GST Registration', description: 'Get a GSTIN' },
    ];

    it('fetches, maps, dispatches the list and counts tabs', async () => {
        (getGovtServicesListApi as Mock).mockResolvedValue(rows);

        const { result } = renderHook(() => useGovtServicesListApi({}));
        expect(result.current.isLoading).toBe(true);
        expect(result.current.services).toEqual([]);

        await waitFor(() => expect(result.current.isLoading).toBe(false));

        const mapped = rows.map(mapApiItem);
        expect(getGovtServicesListApi).toHaveBeenCalledWith(1, 'corporate');
        expect(result.current.services).toEqual(mapped);
        expect(result.current.tabCounts).toEqual({ Mandatory: 3, 'Regulatory Dependent': 0, 'Good-to-have': 0 });
        expect(mockDispatch).toHaveBeenCalledWith(setServicesList(mapped));
    });

    it('handles an empty catalog', async () => {
        (getGovtServicesListApi as Mock).mockResolvedValue([]);

        const { result } = renderHook(() => useGovtServicesListApi({}));
        await waitFor(() => expect(result.current.isLoading).toBe(false));

        expect(result.current.services).toEqual([]);
        expect(result.current.tabCounts).toEqual({ Mandatory: 0, 'Regulatory Dependent': 0, 'Good-to-have': 0 });
        expect(mockDispatch).toHaveBeenCalledWith(setServicesList([]));
    });

    it('filters client-side by name or description, case-insensitively', async () => {
        (getGovtServicesListApi as Mock).mockResolvedValue(rows);

        const { result, rerender } = renderHook((props: { searchText?: string }) => useGovtServicesListApi(props), {
            initialProps: { searchText: 'TRADEMARK' },
        });
        await waitFor(() => expect(result.current.isLoading).toBe(false));
        expect(result.current.services.map((s) => s.name)).toEqual(['Trademark Registration', 'Trademark Objection']);

        rerender({ searchText: 'gstin' });
        expect(result.current.services.map((s) => s.name)).toEqual(['GST Registration']);

        rerender({ searchText: 'nothing-matches' });
        expect(result.current.services).toEqual([]);

        rerender({ searchText: '' });
        expect(result.current.services).toHaveLength(3);
        expect(getGovtServicesListApi).toHaveBeenCalledTimes(1);
    });

    it('ignores category/tag/authority params (no refetch, no filtering)', async () => {
        (getGovtServicesListApi as Mock).mockResolvedValue(rows);

        const { result } = renderHook(() =>
            useGovtServicesListApi({ category: 'Intellectual Property', tag: 'Good-to-have', authority: 'State' })
        );
        await waitFor(() => expect(result.current.isLoading).toBe(false));
        expect(result.current.services).toHaveLength(3);
    });
});
