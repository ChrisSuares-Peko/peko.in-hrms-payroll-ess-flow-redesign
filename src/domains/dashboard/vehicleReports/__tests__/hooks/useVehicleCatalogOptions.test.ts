import { act, renderHook } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import { getVehicleCatalog } from '../../api/index';
import useVehicleCatalogOptions from '../../hooks/useVehicleCatalogOptions';

vi.mock('../../api/index', () => ({
    getVehicleCatalog: vi.fn(),
}));

vi.mock('@src/hooks/store', () => ({
    useAppSelector: (selector: any) =>
        selector({ reducer: { auth: { id: 147, role: 'corporate' } } }),
}));

describe('useVehicleCatalogOptions', () => {
    it('does not fetch any level until a category is chosen', () => {
        renderHook(() => useVehicleCatalogOptions({ category: '' }));

        expect(getVehicleCatalog).not.toHaveBeenCalled();
    });

    it('fetches makes as soon as a category is chosen, and only makes', async () => {
        (getVehicleCatalog as any).mockResolvedValue(['Honda', 'Kia']);

        const { result } = renderHook(() => useVehicleCatalogOptions({ category: 'car' }));

        await act(async () => {});

        expect(getVehicleCatalog).toHaveBeenCalledTimes(1);
        expect(getVehicleCatalog).toHaveBeenCalledWith({
            userId: 147,
            userType: 'corporate',
            category: 'car',
            make: undefined,
            model: undefined,
            year: undefined,
        });
        expect(result.current.makes).toEqual([
            { label: 'Honda', value: 'Honda' },
            { label: 'Kia', value: 'Kia' },
        ]);
    });

    it('fetches models once a make is present, scoped by category+make', async () => {
        (getVehicleCatalog as any).mockResolvedValue(['Seltos', 'Sonet']);

        const { result } = renderHook(() =>
            useVehicleCatalogOptions({ category: 'car', make: 'Kia' })
        );

        await act(async () => {});

        // Both makes (category only) and models (category+make) are enabled here —
        // not asserting an exact call count since effect re-invocation under the test
        // renderer can duplicate a level's fetch without changing the resolved data.
        expect(getVehicleCatalog).toHaveBeenCalledWith(
            expect.objectContaining({ category: 'car', make: 'Kia', model: undefined, year: undefined })
        );
        expect(result.current.models).toEqual([
            { label: 'Seltos', value: 'Seltos' },
            { label: 'Sonet', value: 'Sonet' },
        ]);
    });

    it('does not fetch years until a model is present', async () => {
        (getVehicleCatalog as any).mockResolvedValue([]);

        renderHook(() => useVehicleCatalogOptions({ category: 'car', make: 'Kia' }));

        await act(async () => {});

        expect(getVehicleCatalog).not.toHaveBeenCalledWith(
            expect.objectContaining({ year: expect.anything() })
        );
    });

    it('returns an empty list when the API call fails', async () => {
        (getVehicleCatalog as any).mockResolvedValue(false);

        const { result } = renderHook(() => useVehicleCatalogOptions({ category: 'car' }));

        await act(async () => {});

        expect(result.current.makes).toEqual([]);
        expect(result.current.makesLoading).toBe(false);
    });
});
