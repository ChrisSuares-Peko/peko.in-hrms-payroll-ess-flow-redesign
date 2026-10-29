import { renderHook, act, waitFor } from '@testing-library/react';
import { vi, describe, it, expect, beforeEach, Mock } from 'vitest';

import {
    AddBeneficiaryApi,
    deleteBeneficiaryApi,
    getServiceBeneficiary,
    updateBeneficiaryApi,
} from '@src/domains/dashboard/billPayments/api/index';
import { useAppSelector } from '@src/hooks/store';
import { accessKeys } from '@utils/accessKeys';

import useChallanBeneficiaries from '../../hooks/useChallanBeneficiaries';

vi.mock('@src/hooks/store', () => ({ useAppSelector: vi.fn() }));
vi.mock('@src/domains/dashboard/billPayments/api/index', () => ({
    AddBeneficiaryApi: vi.fn(),
    deleteBeneficiaryApi: vi.fn(),
    getServiceBeneficiary: vi.fn(),
    updateBeneficiaryApi: vi.fn(),
}));

describe('useChallanBeneficiaries', () => {
    const role = 'CORPORATE';
    const id = 7;

    beforeEach(() => {
        vi.clearAllMocks();
        (useAppSelector as Mock).mockImplementation((cb: (s: any) => any) =>
            cb({ reducer: { auth: { role, id } } })
        );
        (getServiceBeneficiary as Mock).mockResolvedValue({ beneficiaries: [] });
    });

    it('fetches beneficiaries with the challan accessKey and maps the vehicle from customerParams', async () => {
        (getServiceBeneficiary as Mock).mockResolvedValue({
            beneficiaries: [
                { id: 1, name: 'Truck A', customerParams: [{ name: 'vehicleNumber', value: 'KA01AB1234' }] },
                { id: 2, name: 'No Vehicle', customerParams: [] }, // dropped — no vehicle number
            ],
        });

        const { result } = renderHook(() => useChallanBeneficiaries());

        await waitFor(() => expect(result.current.isLoading).toBe(false));
        expect(getServiceBeneficiary).toHaveBeenCalledWith({
            userId: id,
            userType: role,
            accessKey: accessKeys.challan,
        });
        expect(result.current.beneficiaries).toEqual([
            { id: '1', nickname: 'Truck A', vehicleNumber: 'KA01AB1234' },
        ]);
    });

    it('addBeneficiary posts the vehicle as a customerParams entry', async () => {
        (AddBeneficiaryApi as Mock).mockResolvedValue({ status: true });

        const { result } = renderHook(() => useChallanBeneficiaries());
        await waitFor(() => expect(result.current.isLoading).toBe(false));

        await act(async () => {
            await result.current.addBeneficiary({ nickname: 'Truck B', vehicleNumber: 'KA05CD6789' });
        });

        expect(AddBeneficiaryApi).toHaveBeenCalledWith(
            expect.objectContaining({
                userId: id,
                userType: role,
                name: 'Truck B',
                accessKey: accessKeys.challan,
                isActive: '1',
                credentialId: String(id),
                customerParams: [{ name: 'vehicleNumber', value: 'KA05CD6789' }],
            })
        );
    });

    it('editBeneficiary updates via the numeric id and keeps the vehicle customerParams', async () => {
        (updateBeneficiaryApi as Mock).mockResolvedValue({ status: true });

        const { result } = renderHook(() => useChallanBeneficiaries());
        await waitFor(() => expect(result.current.isLoading).toBe(false));

        await act(async () => {
            await result.current.editBeneficiary({
                id: '9',
                nickname: 'Edited',
                vehicleNumber: 'KA09XY0001',
            });
        });

        expect(updateBeneficiaryApi).toHaveBeenCalledWith(
            expect.objectContaining({
                id: 9,
                name: 'Edited',
                accessKey: accessKeys.challan,
                customerParams: [{ name: 'vehicleNumber', value: 'KA09XY0001' }],
            })
        );
    });

    it('removeBeneficiary deletes via the numeric id', async () => {
        (deleteBeneficiaryApi as Mock).mockResolvedValue({ status: true });

        const { result } = renderHook(() => useChallanBeneficiaries());
        await waitFor(() => expect(result.current.isLoading).toBe(false));

        await act(async () => {
            await result.current.removeBeneficiary('5');
        });

        expect(deleteBeneficiaryApi).toHaveBeenCalledWith({ userId: id, userType: role, id: 5 });
    });
});
