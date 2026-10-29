import React from 'react';

import { render, screen, fireEvent, waitFor, cleanup } from '@testing-library/react';
import dayjs from 'dayjs';
import { MemoryRouter } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';

// Import the component and hooks
import AssetUsageHistoryModal from '../../../components/Modals/AssetUsageHistoryModal';
import useUsageHistoryCreate from '../../../hooks/assetHooks/useCreateUsageApi';
import { useUpdateUsageHistory } from '../../../hooks/assetHooks/useUpdateUsageApi';

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

vi.mock('../../../hooks/assetHooks/useUpdateUsageApi', () => ({
    useUpdateUsageHistory: vi.fn(() => ({
        updateAssetUsageData: vi.fn(),
        submitLoading: false,
    })),
}));

vi.mock('../../../hooks/employeeHooks/useGetEmployeeApi', () => ({
    useGetEmployee: vi.fn(() => ({
        data: [],
        generateEmployeesDropdown: vi.fn(() => []),
    })),
}));

describe('AssetUsageHistoryModal', () => {
    const mockHandleCancel = vi.fn();

    beforeEach(() => {
        cleanup();
        vi.clearAllMocks();
    });

    it('renders correctly in add mode', () => {
        render(<AssetUsageHistoryModal open handleCancel={mockHandleCancel} assetId={1} />, {
            wrapper: MemoryRouter,
        });

        expect(screen.getByText('Assign Asset')).toBeInTheDocument();
        expect(screen.getByText('Select employee')).toBeInTheDocument();
        expect(screen.getByPlaceholderText('Select assign date')).toBeInTheDocument();
        expect(screen.getByPlaceholderText('Select return date')).toBeInTheDocument();
        expect(screen.getByText('Select return status')).toBeInTheDocument();
        expect(screen.getByPlaceholderText('Enter Remarks')).toBeInTheDocument();
    });

    it('renders correctly in edit mode with selectedRecordData', () => {
        render(
            <AssetUsageHistoryModal
                open
                handleCancel={mockHandleCancel}
                selectedRecordData={{
                    employee: 'Employee 1',
                    assignDate: dayjs().subtract(1, 'month').format('YYYY-MM-DD'),
                    returnDate: dayjs().add(1, 'month').format('YYYY-MM-DD'),
                    returnStatus: 'Returned',
                    remarks: 'Good condition',
                }}
                assetId={1}
            />,
            { wrapper: MemoryRouter }
        );

        expect(screen.getByText('Edit Asset')).toBeInTheDocument();
        expect(screen.getByDisplayValue('Good condition')).toBeInTheDocument();
    });

    it('calls updateAssetUsageData on form submit in edit mode', async () => {
        const updateAssetUsageData = vi.fn();
        (useUpdateUsageHistory as any).mockReturnValue({
            updateAssetUsageData,
            submitLoading: false,
        });

        render(
            <AssetUsageHistoryModal
                open
                handleCancel={mockHandleCancel}
                selectedRecordData={{
                    id: '1',
                    empId: '1',
                    employee: 'Employee 1',
                    assignDate: dayjs().subtract(1, 'month').format('YYYY-MM-DD'),
                    returnDate: dayjs().add(1, 'month').format('YYYY-MM-DD'),
                    returnStatus: 'Returned',
                    remarks: 'Good condition',
                }}
                assetId={1}
            />,
            { wrapper: MemoryRouter }
        );

        fireEvent.change(screen.getByPlaceholderText('Enter Remarks'), {
            target: { value: 'Updated condition' },
        });
        fireEvent.click(screen.getByText('Submit'));

        await waitFor(() => expect(updateAssetUsageData).toHaveBeenCalled());
    });

    it('calls handleCancel when cancel button is clicked', () => {
        render(<AssetUsageHistoryModal open handleCancel={mockHandleCancel} assetId={1} />, {
            wrapper: MemoryRouter,
        });

        fireEvent.click(screen.getByText('Cancel'));
        expect(mockHandleCancel).toHaveBeenCalled();
    });

    it('renders loading state correctly', () => {
        (useUsageHistoryCreate as any).mockReturnValue({
            handleUsageHistoryCreation: vi.fn(),
            submitLoading: true,
        });
        (useUpdateUsageHistory as any).mockReturnValue({
            updateAssetUsageData: vi.fn(),
            submitLoading: true,
        });

        render(<AssetUsageHistoryModal open handleCancel={mockHandleCancel} assetId={1} />, {
            wrapper: MemoryRouter,
        });

        expect(screen.getByLabelText('loading')).toBeInTheDocument();
    });
});
