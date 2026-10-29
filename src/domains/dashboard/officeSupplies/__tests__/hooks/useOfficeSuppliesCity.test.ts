import { beforeEach, describe, expect, it, vi } from 'vitest';

import { readStoredCity } from '../../hooks/useOfficeSuppliesCity';

vi.mock('@src/hooks/store', () => ({
    useAppDispatch: () => vi.fn(),
    useAppSelector: vi.fn(),
}));

vi.mock('../../api/address', () => ({ getSavedAddressApi: vi.fn() }));
vi.mock('../../api/cityList', () => ({ lookupPostcode: vi.fn() }));

const CITY_STORAGE_KEY = 'officeSuppliesSelectedCity';

describe('readStoredCity', () => {
    beforeEach(() => {
        localStorage.clear();
    });

    it('keeps a persisted PIN on the stored city', () => {
        localStorage.setItem(
            CITY_STORAGE_KEY,
            JSON.stringify({ name: 'Bangalore', code: 'std:080', pincode: '560001' })
        );
        expect(readStoredCity()).toEqual({
            name: 'Bangalore',
            code: 'std:080',
            pincode: '560001',
        });
    });

    it('still reads a pre-PIN {name,code} row', () => {
        localStorage.setItem(
            CITY_STORAGE_KEY,
            JSON.stringify({ name: 'Bangalore', code: 'std:080' })
        );
        expect(readStoredCity()).toEqual({ name: 'Bangalore', code: 'std:080' });
    });

    it('strips an invalid stored PIN', () => {
        localStorage.setItem(
            CITY_STORAGE_KEY,
            JSON.stringify({ name: 'Bangalore', code: 'std:080', pincode: '012345' })
        );
        expect(readStoredCity()).toEqual({ name: 'Bangalore', code: 'std:080' });
    });
});
