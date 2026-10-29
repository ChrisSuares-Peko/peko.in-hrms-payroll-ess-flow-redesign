import { renderHook, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, Mock, vi } from 'vitest';

import { useAppSelector } from '@src/hooks/store';

import { getSavedAddressApi } from '../../api/address';
import { lookupPostcode } from '../../api/cityList';
import { useDefaultCity } from '../../hooks/useDefaultCity';

vi.mock('@src/hooks/store', () => ({
    useAppDispatch: () => vi.fn(),
    useAppSelector: vi.fn(),
}));

vi.mock('../../api/address', () => ({ getSavedAddressApi: vi.fn() }));
vi.mock('../../api/cityList', () => ({ lookupPostcode: vi.fn() }));

describe('useDefaultCity', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        (useAppSelector as unknown as Mock).mockImplementation((selectorFn: any) =>
            selectorFn({ reducer: { auth: { id: 7, role: 'corporate' } } })
        );
    });

    it('attaches the saved-address PIN onto the resolved city', async () => {
        (getSavedAddressApi as Mock).mockResolvedValue({
            addressDetails: [
                { default: 1, zipCode: '560001', city: 'Bangalore' },
            ],
        });
        (lookupPostcode as Mock).mockResolvedValue({ city: 'Bangalore', state: 'Karnataka' });

        const { result } = renderHook(() => useDefaultCity(true));
        await waitFor(() => expect(result.current.isLoading).toBe(false));

        expect(result.current.defaultCity).toEqual({
            name: 'Bangalore',
            code: 'std:080',
            state: 'Karnataka',
            pincode: '560001',
        });
    });
});
