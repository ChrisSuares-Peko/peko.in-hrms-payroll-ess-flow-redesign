import React from 'react';

import { render, screen, fireEvent, waitFor, cleanup } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';

// Import the component and hooks
import { useAppSelector } from '@src/hooks/store';

import AssignAssetModal from '../../../components/Modals/AssignAssetModal';
import useUsageHistoryCreate from '../../../hooks/assetHooks/useCreateUsageApi';
import { useGetAssets } from '../../../hooks/assetHooks/useGetAssetsApi';
import { useAssetUsageDetails } from '../../../hooks/assetHooks/useGetAssetUserDetailsApi';
import { useGetEmployee } from '../../../hooks/employeeHooks/useGetEmployeeApi';

// Mock the dependencies
vi.mock('@src/hooks/store', () => ({
    useAppSelector: vi.fn(),
    useAppDispatch: vi.fn(),
}));

vi.mock('../../../hooks/assetHooks/useCreateUsageApi', () => ({
    default: vi.fn(() => ({
        handleUsageHistoryCreation: vi.fn(),
        submitLoading: false,
    })),
}));

vi.mock('../../../hooks/assetHooks/useGetAssetsApi', () => ({
    useGetAssets: vi.fn(() => ({
        assetsData: [],
        generateAssetDropdown: vi.fn(() => []),
    })),
}));

vi.mock('../../../hooks/assetHooks/useGetAssetUserDetailsApi', () => ({
    useAssetUsageDetails: vi.fn(() => ({
        getUsageData: vi.fn(),
    })),
}));

vi.mock('../../../hooks/employeeHooks/useGetEmployeeApi', () => ({
    useGetEmployee: vi.fn(() => ({
        data: [],
        generateEmployeesDropdown: vi.fn(() => []),
    })),
}));

describe('AssignAssetModal', () => {
    const mockHandleCancel = vi.fn();
    const mockReloadTable = vi.fn();
    const mockReloadInfo = vi.fn();

    beforeEach(() => {
        cleanup();
        vi.clearAllMocks();
        (useAppSelector as any).mockImplementation((selector: any) =>
            selector({
                reducer: {
                    subscriptions: {},
                },
            })
        );
    });

    it('renders correctly', () => {
        render(
            <AssignAssetModal
                open
                handleCancel={mockHandleCancel}
                reloadTable={mockReloadTable}
                reloadInfo={mockReloadInfo}
            />,
            { wrapper: MemoryRouter }
        );

        expect(screen.getByText('Assign Asset')).toBeInTheDocument();
        expect(screen.getByText('Select Asset')).toBeInTheDocument();
        expect(screen.getByText('Select employee')).toBeInTheDocument();
        expect(screen.getByPlaceholderText('Select assign date')).toBeInTheDocument();
    });

    it('calls handleUsageHistoryCreation on form submit', async () => {
        const handleUsageHistoryCreation = vi.fn();
        const mockGetUsageData = vi.fn(() => null);
        (useUsageHistoryCreate as any).mockReturnValue({
            handleUsageHistoryCreation,
            submitLoading: false,
        });

        (useGetEmployee as any).mockReturnValue({
            data: [
                {
                    id: 1,
                    employee: 'John Doe',
                    employeeId: 'EMP123',
                    department: 'IT',
                    employeeEmail: 'test@teat.com',
                },
            ],
            generateEmployeesDropdown: vi.fn(() => [{ value: 1, label: 'John Doe - EMP123' }]),
            payrollEmployees: [],
        });

        (useGetAssets as any).mockReturnValue({
            assetsData: [{ id: 1, assetName: 'Asset 1' }],
            generateAssetDropdown: vi.fn(() => [{ value: 1, label: 'Asset 1' }]),
        });

        (useAssetUsageDetails as any).mockReturnValue({
            getUsageData: mockGetUsageData,
        });

        render(
            <AssignAssetModal
                open
                handleCancel={mockHandleCancel}
                reloadTable={mockReloadTable}
                reloadInfo={mockReloadInfo}
            />,
            { wrapper: MemoryRouter }
        );

        // Open the asset select dropdown
        fireEvent.mouseDown(screen.getByText('Select Asset'));

        // Select an asset from the dropdown
        const assetOption = await screen.findByText('Asset 1');
        fireEvent.click(assetOption);

        // Open the employee select dropdown
        fireEvent.mouseDown(screen.getByText('Select employee'));

        // Select an employee from the dropdown
        const employeeOption = await screen.findByText('John Doe - EMP123');
        fireEvent.click(employeeOption);

        const calendarIcon = screen.getByRole('img', { name: /calendar/i });
        fireEvent.click(calendarIcon);
        fireEvent.click(screen.getByText('Today'));

        fireEvent.click(screen.getByRole('button', { name: /submit/i }));

        await waitFor(() => expect(handleUsageHistoryCreation).toHaveBeenCalled());
    });

    it('renders loading state correctly', () => {
        (useUsageHistoryCreate as any).mockReturnValue({
            handleUsageHistoryCreation: vi.fn(),
            submitLoading: true,
        });

        render(<AssignAssetModal open handleCancel={mockHandleCancel} />, {
            wrapper: MemoryRouter,
        });

        expect(screen.getByLabelText('loading')).toBeInTheDocument();
    });

    it('calls handleCancel when cancel button is clicked', () => {
        render(<AssignAssetModal open handleCancel={mockHandleCancel} />, {
            wrapper: MemoryRouter,
        });

        fireEvent.click(screen.getByText('Cancel'));
        expect(mockHandleCancel).toHaveBeenCalled();
    });

    it('calls handleGetUsageData when an asset is selected', async () => {
        const mockGetUsageData = vi.fn(() => ({
            cloud_employee: { id: '1', employeeName: 'John Doe' },
            assignDate: '2023-09-01T00:00:00Z',
        }));

        (useUsageHistoryCreate as any).mockReturnValue({
            handleUsageHistoryCreation: vi.fn(),
            submitLoading: false,
        });

        (useGetAssets as any).mockReturnValue({
            assetsData: [],
            generateAssetDropdown: vi.fn(() => [{ label: 'Asset1', value: '1' }]),
        });

        (useAssetUsageDetails as any).mockReturnValue({
            getUsageData: mockGetUsageData,
        });

        render(<AssignAssetModal open handleCancel={mockHandleCancel} />, {
            wrapper: MemoryRouter,
        });

        // Open the asset select dropdown
        fireEvent.mouseDown(screen.getByText('Select Asset'));

        // Select an asset from the dropdown
        const assetOption = await screen.findByText('Asset1');
        fireEvent.click(assetOption);

        await waitFor(() => expect(mockGetUsageData).toHaveBeenCalledWith('1'));
    });

    it('renders the employee information and return fields when an asset with existing usage data is selected', async () => {
        const mockGetUsageData = vi.fn(() => ({
            cloud_employee: { id: '1', employeeName: 'John Doe' },
            assignDate: '2023-09-01T00:00:00Z',
        }));

        (useUsageHistoryCreate as any).mockReturnValue({
            handleUsageHistoryCreation: vi.fn(),
            submitLoading: false,
        });

        (useAssetUsageDetails as any).mockReturnValue({
            getUsageData: mockGetUsageData,
        });

        (useGetAssets as any).mockReturnValue({
            assetsData: [{ id: 1, assetName: 'Asset 1', usedBy: 'John Doe' }],
            generateAssetDropdown: vi.fn(() => [{ value: 1, label: 'Asset 1' }]),
        });

        render(<AssignAssetModal open handleCancel={mockHandleCancel} />, {
            wrapper: MemoryRouter,
        });

        // Open the asset select dropdown
        fireEvent.mouseDown(screen.getByText('Select Asset'));

        // Select an asset from the dropdown
        const assetOption = await screen.findByText('Asset 1');
        fireEvent.click(assetOption);

        await waitFor(() => {
            expect(
                screen.getByText('This asset is now used by John Doe from 2023-09-01')
            ).toBeInTheDocument();
            expect(screen.getByPlaceholderText('Select return date')).toBeInTheDocument();
            expect(screen.getByPlaceholderText('Enter Remarks')).toBeInTheDocument();
        });
    });
});
