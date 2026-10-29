import { act, renderHook } from '@testing-library/react';
import { beforeEach, describe, expect, it, Mock, vi } from 'vitest';

import { showToast } from '@src/slices/apiSlice';

import { generateEWaybillApi } from '../../../api/eInvoice';
import useGenerateEWaybill from '../../../hooks/eWayBill/useGenerateEWaybill';

vi.mock('../../../api/eInvoice', () => ({
    generateEWaybillApi: vi.fn(),
}));

const navigateMock = vi.fn();
vi.mock('react-router-dom', () => ({
    useNavigate: () => navigateMock,
}));

const dispatchMock = vi.fn();
vi.mock('@src/hooks/hooks', () => ({
    useAppDispatch: () => dispatchMock,
}));

vi.mock('@src/hooks/store', () => ({
    useAppSelector: vi.fn(() => ({ id: 'u1', role: 'admin' })),
}));

const values = {
    distance: '120',
    transportMode: 'road',
    transporterGstin: 'GSTIN',
    transporterName: 'Trans',
    vehicleNumber: 'KA01AB1234',
    vehicleType: 'R',
    transactionNumber: '',
    transactionDate: '',
} as any;

describe('useGenerateEWaybill', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('does nothing if no invoice id is provided', async () => {
        const { result } = renderHook(() => useGenerateEWaybill(undefined));
        await act(async () => {
            await result.current.generate(values);
        });
        expect(generateEWaybillApi).not.toHaveBeenCalled();
    });

    it('calls api with mapped body and navigates on success', async () => {
        (generateEWaybillApi as Mock).mockResolvedValue({ status: true });
        const { result } = renderHook(() => useGenerateEWaybill('inv-1'));

        await act(async () => {
            await result.current.generate(values);
        });

        expect(generateEWaybillApi).toHaveBeenCalledWith({
            userId: 'u1',
            userType: 'admin',
            invoiceId: 'inv-1',
            body: {
                distance: 120,
                transMode: 'road',
                transId: 'GSTIN',
                transName: 'Trans',
                vehNo: 'KA01AB1234',
                vehType: 'R',
            },
        });
        expect(navigateMock).toHaveBeenCalledWith(expect.stringContaining('e-invoicing'));
        expect(dispatchMock).toHaveBeenCalledWith(
            showToast({
                description: 'E-Waybill generated successfully',
                variant: 'success',
            })
        );
    });

    it('shows error toast on failure', async () => {
        (generateEWaybillApi as Mock).mockResolvedValue({ status: false, message: 'bad' });
        const { result } = renderHook(() => useGenerateEWaybill('inv-1'));

        await act(async () => {
            await result.current.generate(values);
        });

        expect(navigateMock).not.toHaveBeenCalled();
        expect(dispatchMock).toHaveBeenCalledWith(
            showToast({ description: 'bad', variant: 'error' })
        );
    });
});
