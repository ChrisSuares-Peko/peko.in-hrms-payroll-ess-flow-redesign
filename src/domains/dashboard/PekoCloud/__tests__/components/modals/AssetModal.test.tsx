import React from 'react';

import { render, screen, fireEvent, waitFor, cleanup } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';

// Import the component and hooks
import AssetModal from '../../../components/Modals/AssetModal';
import useAssetCreate from '../../../hooks/assetHooks/useCreateAssetApi';

// Mock the dependencies
vi.mock('@src/hooks/store', () => ({
    useAppSelector: vi.fn(),
    useAppDispatch: vi.fn(),
}));

vi.mock('../../../hooks/assetHooks/useCreateAssetApi', () => ({
    default: vi.fn(() => ({
        handleAssetCreation: vi.fn(),
        submitLoading: false,
    })),
}));

vi.mock('../../../hooks/employeeHooks/useGetEmployeeApi', () => ({
    useGetEmployee: vi.fn(() => ({
        data: [],
        generateEmployeesDropdown: vi.fn(() => []),
    })),
}));

describe('AssetModal', () => {
    const mockHandleCancel = vi.fn();
    beforeEach(() => {
        cleanup();
        vi.clearAllMocks();
    });

    it('renders correctly in add mode', () => {
        render(<AssetModal open selectedRecordData={null} handleCancel={mockHandleCancel} />, {
            wrapper: MemoryRouter,
        });

        expect(screen.getByText('Add Asset')).toBeInTheDocument();
        expect(screen.getByPlaceholderText('Enter asset name')).toBeInTheDocument();
        expect(screen.getByText('Select asset category')).toBeInTheDocument();
        expect(screen.getByPlaceholderText('Enter serial number')).toBeInTheDocument();
        expect(screen.getByPlaceholderText('Select purchased date')).toBeInTheDocument();
        expect(screen.getByText('Select employee')).toBeInTheDocument();
        expect(screen.getByText('Select asset type')).toBeInTheDocument();
        expect(screen.getByText('Select warranty')).toBeInTheDocument();
        expect(screen.getByText('Select status')).toBeInTheDocument();
        expect(screen.getByPlaceholderText('Enter amount')).toBeInTheDocument();
    });

    it('calls handleAssetCreation on form submit in add mode', async () => {
        const handleAssetCreation = vi.fn();
        (useAssetCreate as any).mockReturnValue({
            handleAssetCreation,
            submitLoading: false,
        });

        render(
            <AssetModal
                open
                selectedRecordData={{
                    assetCategory: 'SUV',
                    status: 'Active',
                }}
                handleCancel={mockHandleCancel}
            />,
            {
                wrapper: MemoryRouter,
            }
        );

        fireEvent.change(screen.getByPlaceholderText('Enter asset name'), {
            target: { value: 'New Asset' },
        });
        fireEvent.change(screen.getByPlaceholderText('Enter serial number'), {
            target: { value: 'SN5678' },
        });
        fireEvent.click(screen.getByRole('button', { name: /submit/i }));

        await waitFor(() => expect(handleAssetCreation).toHaveBeenCalled());
    });

    it('renders loading state correctly', () => {
        (useAssetCreate as any).mockReturnValue({
            handleAssetCreation: vi.fn(),
            submitLoading: true,
        });

        render(<AssetModal open handleCancel={mockHandleCancel} />, {
            wrapper: MemoryRouter,
        });

        expect(screen.getByLabelText('loading')).toBeInTheDocument();
    });

    it('calls handleCancel when cancel button is clicked', () => {
        render(<AssetModal open handleCancel={mockHandleCancel} />, {
            wrapper: MemoryRouter,
        });

        fireEvent.click(screen.getByText('Cancel'));
        expect(mockHandleCancel).toHaveBeenCalled();
    });
});
