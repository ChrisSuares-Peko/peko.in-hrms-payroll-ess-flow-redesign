import { act, renderHook, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, Mock, vi } from 'vitest';

import { deleteHoliday } from '../../../api/dashBoardIndex';
import { useDeleteHolidayApi } from '../../../hooks/dashboardHooks/useDeleteHolidayApi';

vi.mock('../../../api/dashBoardIndex', () => ({
    deleteHoliday: vi.fn(),
}));

vi.mock('@src/hooks/store', () => ({
    useAppSelector: vi.fn(() => ({ id: 1, role: 'merchant' })),
    useAppDispatch: vi.fn(),
}));

beforeEach(() => {
    vi.clearAllMocks();
});

describe('useDeleteHolidayApi', () => {
    it('returns true on a successful response even when handleCancel is not provided', async () => {
        (deleteHoliday as Mock).mockResolvedValueOnce({
            status: true,
            responseCode: '200',
            message: 'Deleted',
            data: {},
        });

        const { result } = renderHook(() => useDeleteHolidayApi({}));

        let returnValue: any;
        await act(async () => {
            returnValue = await result.current.deleteHolidayData('holiday-1');
        });

        expect(deleteHoliday).toHaveBeenCalledWith({
            userId: 1,
            userType: 'merchant',
            holidayId: 'holiday-1',
        });
        expect(returnValue).toBe(true);
    });

    it('calls handleCancel on a successful response when it is provided', async () => {
        (deleteHoliday as Mock).mockResolvedValueOnce({
            status: true,
            responseCode: '200',
            message: 'Deleted',
            data: {},
        });
        const handleCancel = vi.fn();

        const { result } = renderHook(() => useDeleteHolidayApi({ handleCancel }));

        let returnValue: any;
        await act(async () => {
            returnValue = await result.current.deleteHolidayData('holiday-1');
        });

        expect(handleCancel).toHaveBeenCalledTimes(1);
        expect(returnValue).toBe(true);
    });

    it('returns false and does not call handleCancel on a failed response', async () => {
        (deleteHoliday as Mock).mockResolvedValueOnce(false);
        const handleCancel = vi.fn();

        const { result } = renderHook(() => useDeleteHolidayApi({ handleCancel }));

        let returnValue: any;
        await act(async () => {
            returnValue = await result.current.deleteHolidayData('holiday-1');
        });

        expect(handleCancel).not.toHaveBeenCalled();
        expect(returnValue).toBe(false);
    });

    it('returns false on a failed response when handleCancel is not provided', async () => {
        (deleteHoliday as Mock).mockResolvedValueOnce(false);

        const { result } = renderHook(() => useDeleteHolidayApi({}));

        let returnValue: any;
        await act(async () => {
            returnValue = await result.current.deleteHolidayData('holiday-1');
        });

        expect(returnValue).toBe(false);
    });

    it('toggles isLoading true during the call and false after', async () => {
        let resolveApi: (v: any) => void;
        (deleteHoliday as Mock).mockReturnValue(new Promise(r => { resolveApi = r; }));

        const { result } = renderHook(() => useDeleteHolidayApi({}));

        act(() => {
            result.current.deleteHolidayData('holiday-1');
        });

        expect(result.current.isLoading).toBe(true);

        await act(async () => { resolveApi({ status: true, responseCode: '200', message: 'Deleted', data: {} }); });

        await waitFor(() => expect(result.current.isLoading).toBe(false));
    });
});
