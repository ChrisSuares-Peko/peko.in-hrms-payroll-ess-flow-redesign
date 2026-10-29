import { renderHook, act } from '@testing-library/react';
import { saveAs } from 'file-saver';
import { describe, it, expect, vi, beforeEach } from 'vitest';

import { getAllFleets, assign, deleteFleet, getFileBufferReport } from '../../api/index';
import useManageFleetApi from '../../hooks/useManageFleet';

vi.mock('../../api/index', () => ({
    getAllFleets: vi.fn(),
    assign: vi.fn(),
    deleteFleet: vi.fn(),
    getFileBufferReport: vi.fn(),
}));

vi.mock('file-saver', () => ({
    saveAs: vi.fn(),
}));

vi.mock('@src/hooks/store', () => ({
    useAppSelector: (selector: any) =>
        selector({
            reducer: {
                auth: { id: '123', role: 'admin' },
            },
        }),
}));

describe('useManageFleetApi', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('should fetch fleets on mount and set state', async () => {
        (getAllFleets as any).mockResolvedValue({
            data: [
                { id: 1, vehicleNumber: 'AB123', model: 'Sedan' },
                { id: 2, vehicleNumber: 'CD456', model: 'SUV' },
            ],
            recordsTotal: 2,
        });

        const { result } = renderHook(() =>
            useManageFleetApi({ searchText: '', page: 1, itemsPerPage: 10 })
        );

        await act(async () => {});

        expect(getAllFleets).toHaveBeenCalledWith({
            userId: '123',
            userType: 'admin',
            from: undefined,
            to: undefined,
            searchText: '',
            page: 1,
            itemsPerPage: 10,
        });

        expect(result.current.details).toEqual([
            { vehicleId: 1, vehicleNumber: 'AB123', model: 'Sedan' },
            { vehicleId: 2, vehicleNumber: 'CD456', model: 'SUV' },
        ]);
        expect(result.current.fleet.length).toBe(2);
        expect(result.current.count).toBe(2);
        expect(result.current.isLoading).toBe(false);
    });

    it('assignApi should call assign and trigger refresh', async () => {
        (assign as any).mockResolvedValue({ success: true });

        const { result } = renderHook(() => useManageFleetApi({ searchText: '' }));

        await act(async () => {
            const res = await result.current.assignApi({
                vehicleId: 10,
                driverId: 20,
            });
            expect(res).toEqual({ success: true });
        });

        expect(assign).toHaveBeenCalledWith({
            userId: '123',
            userType: 'admin',
            vehicleId: 10,
            driverId: 20,
        });

        expect(result.current.setRefresh).toBeDefined();
    });

    it('deleteApi should call deleteFleet and return true on success', async () => {
        (deleteFleet as any).mockResolvedValue(true);

        const { result } = renderHook(() => useManageFleetApi({}));

        let response;
        await act(async () => {
            response = await result.current.deleteApi({ id: 5 });
        });

        expect(deleteFleet).toHaveBeenCalledWith({
            userId: '123',
            userType: 'admin',
            id: 5,
        });

        expect(response).toBe(true);
    });

    it('downloadReport should trigger file download', async () => {
        (getFileBufferReport as any).mockResolvedValue({
            buffer: { data: [1, 2, 3] },
            fileType: 'application/pdf',
        });

        const { result } = renderHook(() => useManageFleetApi({}));

        await act(async () => {
            await result.current.downloadReport('pdf', '');
        });

        expect(getFileBufferReport).toHaveBeenCalledWith({
            userId: '123',
            userType: 'admin',
            type: 'pdf',
            searchText: '',
        });

        expect(saveAs).toHaveBeenCalled();
    });
});
