import { renderHook, act } from '@testing-library/react';
import { vi, describe, it, expect, beforeEach, Mock } from 'vitest';

import { useAppSelector } from '@src/hooks/store';

import { getVehicleChallans } from '../../api/index';
import useVehicleChallans from '../../hooks/useVehicleChallans';

vi.mock('@src/hooks/store', () => ({ useAppSelector: vi.fn() }));
vi.mock('../../api/index', () => ({ getVehicleChallans: vi.fn() }));

describe('useVehicleChallans', () => {
    const role = 'CORPORATE';
    const id = 3;

    beforeEach(() => {
        vi.clearAllMocks();
        (useAppSelector as Mock).mockImplementation((cb: (s: any) => any) =>
            cb({ reducer: { auth: { role, id } } })
        );
    });

    it('fetches challans for the given vehicle and stores the array', async () => {
        const challans = [{ challan_number: 'C1' }];
        (getVehicleChallans as Mock).mockResolvedValue(challans);

        const { result } = renderHook(() => useVehicleChallans());

        await act(async () => {
            await result.current.fetchForVehicle('KA01AB1234');
        });

        expect(getVehicleChallans).toHaveBeenCalledWith({
            userId: id,
            userType: role,
            vehicleNumber: 'KA01AB1234',
        });
        expect(result.current.challans).toEqual(challans);
    });

    it('stores an empty array when the api returns a non-array (failure/unexpected shape)', async () => {
        (getVehicleChallans as Mock).mockResolvedValue(false);

        const { result } = renderHook(() => useVehicleChallans());

        let returned: unknown;
        await act(async () => {
            returned = await result.current.fetchForVehicle('KA01AB1234');
        });

        expect(returned).toEqual([]);
        expect(result.current.challans).toEqual([]);
    });
});
