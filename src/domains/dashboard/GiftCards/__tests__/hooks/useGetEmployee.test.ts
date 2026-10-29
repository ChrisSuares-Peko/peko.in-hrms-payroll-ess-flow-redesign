import { act, renderHook } from '@testing-library/react';
import { beforeEach, describe, expect, it, Mock, vi } from 'vitest';

import { useAppSelector } from '@src/hooks/store';

import { getEmployees } from '../../api';
import { useGetEmployee } from '../../hooks/useGetEmployeeApi';
import { employeeResponse } from '../../types/employee';

vi.mock('@src/hooks/store', () => ({
    useAppSelector: vi.fn(),
}));
vi.mock('../../api', () => ({
    getEmployees: vi.fn(),
}));

describe('useGetEmployee Hook', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        (useAppSelector as Mock).mockReturnValue({ role: 'admin', id: '123' });
    });

    it('should call getEmployees API when isPurchasedPayroll is true', async () => {
        const mockData: employeeResponse = {
            employees: [
                {
                    id: 'emp-001',
                    personalEmail: 'john.doe@example.com',
                    fullName: 'John Doe',
                    employeeInformation: { employeeId: 'E001' },
                    value: '',
                    label: '',
                    personalInformation: {
                        fullName: 'John Doe',
                        email: 'john.doe@example.com',
                    },
                },
                {
                    id: 'emp-002',
                    personalEmail: 'jane.doe@example.com',
                    fullName: 'Jane Doe',
                    employeeInformation: { employeeId: 'E002' },
                    value: '',
                    label: '',
                    personalInformation: {
                        fullName: 'Jane Doe',
                        email: 'jane.doe@example.com',
                    },
                },
            ],
        };

        (getEmployees as Mock).mockResolvedValue(mockData);

        const { result } = renderHook(() => useGetEmployee(true));

        await act(async () => {});

        expect(getEmployees).toHaveBeenCalledWith({ userId: '123', userType: 'admin' });
        expect(result.current.data).toEqual(mockData.employees);
    });

    it('should not call getEmployees API when isPurchasedPayroll is false', async () => {
        renderHook(() => useGetEmployee(false));

        expect(getEmployees).not.toHaveBeenCalled();
    });

    it('should update employees state correctly when API call is successful', async () => {
        const mockData: employeeResponse = {
            employees: [
                {
                    id: 'emp-001',
                    personalEmail: 'john.doe@example.com',
                    fullName: 'John Doe',
                    employeeInformation: { employeeId: 'E001' },
                    value: '',
                    label: '',
                    personalInformation: {
                        fullName: 'John Doe',
                        email: 'john.doe@example.com',
                    },
                },
            ],
        };

        (getEmployees as Mock).mockResolvedValue(mockData);

        const { result } = renderHook(() => useGetEmployee(true));

        await act(async () => {});

        expect(result.current.data).toEqual(mockData.employees);
    });

    it('should handle empty API response gracefully', async () => {
        (getEmployees as Mock).mockResolvedValue(false);

        const { result } = renderHook(() => useGetEmployee(true));

        await act(async () => {});

        expect(result.current.data).toEqual([]);
    });

    it('should return transformed employee data for dropdown', async () => {
        const mockData: employeeResponse = {
            employees: [
                {
                    id: 'emp-001',
                    personalEmail: 'john.doe@example.com',
                    fullName: 'John Doe',
                    employeeInformation: { employeeId: 'E001' },
                    value: '',
                    label: '',
                    personalInformation: {
                        fullName: 'John Doe',
                        email: 'john.doe@example.com',
                    },
                },
            ],
        };

        (getEmployees as Mock).mockResolvedValue(mockData);

        const { result } = renderHook(() => useGetEmployee(true));

        await act(async () => {});

        const transformedDropdown = result.current.generateEmployeesDropdown(mockData.employees);
        expect(transformedDropdown).toEqual([
            {
                value: 'emp-001',
                label: 'John Doe - E001',
                personalEmail: 'john.doe@example.com',
                fullName: 'John Doe',
            },
        ]);
    });
});
