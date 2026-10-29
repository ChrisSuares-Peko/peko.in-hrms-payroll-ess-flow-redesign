import { renderHook, waitFor, act } from '@testing-library/react';
import { describe, it, expect, vi, Mock, beforeEach } from 'vitest';

import { getSubCorporates } from '../../../api/userManagement';
import useGetAllSubCorporate from '../../../hooks/user_management/useGetAllSubCorporate';
import { allSubCorporatesResponse } from '../../../types/userManagement';

vi.mock('../../../api/userManagement', () => ({
    getSubCorporates: vi.fn(),
}));

describe('useGetAllSubCorporate', () => {
    const mockSubCorporateData: allSubCorporatesResponse = {
        rows: [
            {
                id: 1,
                name: 'SubCorporate1',
                status: 'ACTIVE',
                email: 'sub1@example.com',
                mobileNo: '5555555551',
                role: 'Manager',
                services: [
                    { label: 'Service1', hasAccess: true },
                    { label: 'Service2', hasAccess: true },
                ],
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString(),
                corporateCredentialID: '',
                isDeleted: 0,
                credentialId: 0,
                corporateUserId: 0,
            },
            {
                id: 2,
                name: 'SubCorporate2',
                status: 'INACTIVE',
                email: 'sub2@example.com',
                mobileNo: '5555555552',
                role: 'Employee',
                services: [
                    { label: 'Service3', hasAccess: true },
                    { label: 'Service4', hasAccess: true },
                ],
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString(),
                corporateCredentialID: '',
                isDeleted: 0,
                credentialId: 0,
                corporateUserId: 0,
            },
        ],
        count: 2,
    };

    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('should return initial state correctly', () => {
        const { result } = renderHook(() =>
            useGetAllSubCorporate({
                itemsPerPage: 10,
                page: 1,
                status: '',
                searchText: '',
                reload: false,
            })
        );

        expect(result.current.data).toEqual([]);
        expect(result.current.isLoading).toBe(true);
        expect(result.current.count).toBeUndefined();
    });

    it('should fetch and return data correctly', async () => {
        (getSubCorporates as Mock).mockResolvedValueOnce(mockSubCorporateData);

        const { result } = renderHook(() =>
            useGetAllSubCorporate({
                itemsPerPage: 10,
                page: 1,
                status: '',
                searchText: '',
                reload: false,
            })
        );

        await waitFor(() =>
            expect(getSubCorporates).toHaveBeenCalledWith({
                itemsPerPage: 10,
                page: 1,
                status: '',
                searchText: '',
            })
        );

        await waitFor(() => {
            expect(result.current.data).toEqual(mockSubCorporateData.rows);
            expect(result.current.isLoading).toBe(false);
            expect(result.current.count).toBe(mockSubCorporateData.count);
        });
    });

    it('should handle API failure gracefully', async () => {
        (getSubCorporates as Mock).mockResolvedValueOnce(false);

        const { result } = renderHook(() =>
            useGetAllSubCorporate({
                itemsPerPage: 10,
                page: 1,
                status: '',
                searchText: '',
                reload: false,
            })
        );

        await waitFor(() => {
            expect(result.current.data).toEqual([]);
            expect(result.current.isLoading).toBe(false);
            expect(result.current.count).toBeUndefined();
        });
    });

    it('should refetch data when reload is triggered', async () => {
        (getSubCorporates as Mock).mockResolvedValueOnce(mockSubCorporateData);

        const { result, rerender } = renderHook(
            ({ reload }) =>
                useGetAllSubCorporate({
                    itemsPerPage: 10,
                    page: 1,
                    status: '',
                    searchText: '',
                    reload,
                }),
            { initialProps: { reload: false } }
        );

        await waitFor(() => expect(result.current.data).toEqual(mockSubCorporateData.rows));

        (getSubCorporates as Mock).mockResolvedValueOnce({
            ...mockSubCorporateData,
            rows: [{ id: 3, name: 'SubCorporate3', status: 'ACTIVE' }],
        });

        act(() => {
            rerender({ reload: true });
        });

        await waitFor(() => {
            expect(result.current.data).toEqual([
                { id: 3, name: 'SubCorporate3', status: 'ACTIVE' },
            ]);
            expect(result.current.isLoading).toBe(false);
            expect(result.current.count).toBe(mockSubCorporateData.count);
        });
    });

    it('should refetch data when any parameter changes', async () => {
        (getSubCorporates as Mock).mockResolvedValueOnce(mockSubCorporateData);

        const { result, rerender } = renderHook(
            ({ page }) =>
                useGetAllSubCorporate({
                    itemsPerPage: 10,
                    page,
                    status: '',
                    searchText: '',
                    reload: false,
                }),
            { initialProps: { page: 1 } }
        );

        await waitFor(() => expect(result.current.data).toEqual(mockSubCorporateData.rows));

        (getSubCorporates as Mock).mockResolvedValueOnce({
            ...mockSubCorporateData,
            rows: [{ id: 3, name: 'SubCorporate3', status: 'ACTIVE' }],
        });

        act(() => {
            rerender({ page: 2 });
        });

        await waitFor(() => {
            expect(result.current.data).toEqual([
                { id: 3, name: 'SubCorporate3', status: 'ACTIVE' },
            ]);
            expect(result.current.isLoading).toBe(false);
        });
    });
});
