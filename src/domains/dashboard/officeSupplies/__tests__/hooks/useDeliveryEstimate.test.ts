import { beforeEach, describe, expect, it, Mock, vi } from 'vitest';

import { getDeliveryEstimateApi } from '../../api/product';
import { getPosition, pincodeFromCoords } from '../../hooks/useCurrentLocation';
import { fetchDeliveryEstimate } from '../../hooks/useDeliveryEstimate';

vi.mock('@src/hooks/store', () => ({
    useAppDispatch: () => vi.fn(),
    useAppSelector: vi.fn(),
}));

vi.mock('../../api/product', () => ({
    getDeliveryEstimateApi: vi.fn(),
}));

vi.mock('../../hooks/useCurrentLocation', () => ({
    getPosition: vi.fn(),
    pincodeFromCoords: vi.fn(),
    useCurrentLocation: () => ({ detect: vi.fn(), isDetecting: false }),
}));

vi.mock('../../api/address', () => ({ getSavedAddressApi: vi.fn() }));
vi.mock('../../api/cityList', () => ({ lookupPostcode: vi.fn() }));

const CITY_STORAGE_KEY = 'officeSuppliesSelectedCity';

const params = {
    userId: 7,
    userType: 'corporate',
    ondcProductId: 'SKU-1',
    quantity: 1,
};

describe('fetchDeliveryEstimate payload', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        localStorage.clear();
        (getPosition as Mock).mockResolvedValue(null);
        (pincodeFromCoords as Mock).mockResolvedValue(undefined);
        (getDeliveryEstimateApi as Mock).mockResolvedValue({
            serviceable: true,
            deliveryTat: 'P2D',
            expectedDeliveryDate: '2026-09-01T00:00:00.000Z',
        });
    });

    it('posts the stored PIN', async () => {
        localStorage.setItem(
            CITY_STORAGE_KEY,
            JSON.stringify({ name: 'Bangalore', code: 'std:080', pincode: '560001' })
        );

        await fetchDeliveryEstimate(params);

        expect(pincodeFromCoords).not.toHaveBeenCalled();
        expect(getDeliveryEstimateApi).toHaveBeenCalledWith(
            expect.objectContaining({
                city: 'std:080',
                pincode: '560001',
            })
        );
    });

    it('omits an invalid stored PIN', async () => {
        localStorage.setItem(
            CITY_STORAGE_KEY,
            JSON.stringify({ name: 'Bangalore', code: 'std:080', pincode: '012345' })
        );

        await fetchDeliveryEstimate(params);

        expect(getDeliveryEstimateApi).toHaveBeenCalledWith(
            expect.objectContaining({
                city: 'std:080',
                pincode: undefined,
            })
        );
    });

    it('reverse-geocodes GPS when the stored city has no PIN', async () => {
        localStorage.setItem(
            CITY_STORAGE_KEY,
            JSON.stringify({ name: 'Bangalore', code: 'std:080' })
        );
        (getPosition as Mock).mockResolvedValue({
            coords: { latitude: 12.9716, longitude: 77.5946 },
        });
        (pincodeFromCoords as Mock).mockResolvedValue('560001');

        await fetchDeliveryEstimate(params);

        expect(pincodeFromCoords).toHaveBeenCalledWith(12.9716, 77.5946);
        expect(getDeliveryEstimateApi).toHaveBeenCalledWith(
            expect.objectContaining({
                pincode: '560001',
                gps: '12.9716,77.5946',
            })
        );
    });
});
