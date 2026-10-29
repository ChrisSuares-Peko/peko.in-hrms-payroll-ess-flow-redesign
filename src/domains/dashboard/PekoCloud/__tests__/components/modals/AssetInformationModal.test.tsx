import React from 'react';

import { render, screen, fireEvent, waitFor, cleanup } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';

// Import the component and hooks
import AssetInformationModal from '../../../components/Modals/AssetInformationModal';
import { useUpdateAsset } from '../../../hooks/assetHooks/useUpdateAssetApi';

// Mock the dependencies
vi.mock('@src/hooks/store', () => ({
    useAppSelector: vi.fn(),
    useAppDispatch: vi.fn(),
}));
vi.mock('../../../hooks/assetHooks/useUpdateAssetApi', () => ({
    useUpdateAsset: vi.fn(() => ({
        updateAssetData: vi.fn(),
        submitLoading: false,
    })),
}));

describe('AssetInformationModal', () => {
    const mockHandleCancel = vi.fn();
    const mockSetRefState = vi.fn();

    beforeEach(() => {
        cleanup();
        vi.clearAllMocks();
    });

    it('renders correctly with initial values', () => {
        render(
            <AssetInformationModal
                open
                handleCancel={mockHandleCancel}
                setRefState={mockSetRefState}
                assetData={{
                    data: {
                        id: '1',
                        assetName: 'Test Asset',
                        assetCategory: 'Category A',
                        purchasedDate: '2024-01-01',
                        assetType: 'Type A',
                        serialNumber: 'SN123',
                        vendor: 'Vendor A',
                        amount: '1000',
                        amountRecurring: 'Monthly',
                        warranty: '1 Year',
                        batchNumber: 'Batch1',
                        status: 'Active',
                    },
                }}
                initialValues={null}
            />,
            { wrapper: MemoryRouter }
        );

        expect(screen.getByText('Asset Information')).toBeInTheDocument();
        expect(screen.getByText('Asset Name')).toBeInTheDocument();
        expect(screen.getByText('Asset Category')).toBeInTheDocument();
        expect(screen.getByText('Purchased Date')).toBeInTheDocument();
        expect(screen.getByText('Asset Type')).toBeInTheDocument();
        expect(screen.getByText('Serial Number')).toBeInTheDocument();
        expect(screen.getByText('Vendor')).toBeInTheDocument();
        expect(screen.getByText('Amount')).toBeInTheDocument();
        expect(screen.getByText('Amount Recurring')).toBeInTheDocument();
        expect(screen.getByText('Warranty (in years)')).toBeInTheDocument();
        expect(screen.getByText('Batch Number')).toBeInTheDocument();
        expect(screen.getByText('Status')).toBeInTheDocument();
    });

    it('renders correctly with pre-filled values in edit mode', () => {
        render(
            <AssetInformationModal
                open
                handleCancel={mockHandleCancel}
                setRefState={mockSetRefState}
                assetData={{
                    data: {
                        id: '1',
                        assetName: 'Existing Asset',
                        assetCategory: 'Laptop',
                        purchasedDate: '2024-02-01',
                        assetType: 'Owned',
                        serialNumber: 'SN456',
                        vendor: 'Vendor B',
                        amount: '2000',
                        amountRecurring: 'Yearly',
                        warranty: '2 Years',
                        batchNumber: 'Batch2',
                        status: 'Inactive',
                    },
                }}
                initialValues={null}
            />,
            { wrapper: MemoryRouter }
        );

        expect(screen.getByDisplayValue('Existing Asset')).toBeInTheDocument();
        expect(screen.getByText('Laptop')).toBeInTheDocument();
        expect(screen.getByDisplayValue('2024-02-01')).toBeInTheDocument();
        expect(screen.getByText('Owned')).toBeInTheDocument();
        expect(screen.getByDisplayValue('SN456')).toBeInTheDocument();
        expect(screen.getByDisplayValue('Vendor B')).toBeInTheDocument();
        expect(screen.getByDisplayValue('2000')).toBeInTheDocument();
        expect(screen.getByText('Yearly')).toBeInTheDocument();
        expect(screen.getByText('2 Years')).toBeInTheDocument();
        expect(screen.getByDisplayValue('Batch2')).toBeInTheDocument();
        expect(screen.getByText('Inactive')).toBeInTheDocument();
    });

    it('calls updateAssetData on form submit', async () => {
        const updateAssetData = vi.fn();
        (useUpdateAsset as any).mockReturnValue({
            updateAssetData,
            submitLoading: false,
        });

        render(
            <AssetInformationModal
                open
                handleCancel={mockHandleCancel}
                setRefState={mockSetRefState}
                assetData={{
                    data: {
                        id: '1',
                        assetName: 'Existing Asset',
                        assetCategory: 'Laptop',
                        purchasedDate: '2024-02-01',
                        assetType: 'Owned',
                        serialNumber: 'SN456',
                        vendor: 'Vendor B',
                        amount: '2000',
                        amountRecurring: 'Yearly',
                        warranty: '2 Years',
                        batchNumber: 'Batch2',
                        status: 'Inactive',
                    },
                }}
                initialValues={null}
            />,
            { wrapper: MemoryRouter }
        );

        fireEvent.change(screen.getByPlaceholderText('Enter asset name'), {
            target: { value: 'Updated Asset' },
        });
        fireEvent.change(screen.getByPlaceholderText('Enter amount'), {
            target: { value: '3000' },
        });

        fireEvent.click(screen.getByRole('button', { name: /submit/i }));

        await waitFor(() => expect(updateAssetData).toHaveBeenCalled());
    });

    it('calls handleCancel when cancel button is clicked', () => {
        render(
            <AssetInformationModal
                open
                handleCancel={mockHandleCancel}
                setRefState={mockSetRefState}
                assetData={{
                    data: {
                        id: '1',
                        assetName: 'Existing Asset',
                        assetCategory: 'Laptop',
                        purchasedDate: '2024-02-01',
                        assetType: 'Owned',
                        serialNumber: 'SN456',
                        vendor: 'Vendor B',
                        amount: '2000',
                        amountRecurring: 'Yearly',
                        warranty: '2 Years',
                        batchNumber: 'Batch2',
                        status: 'Inactive',
                    },
                }}
                initialValues={null}
            />,
            { wrapper: MemoryRouter }
        );

        fireEvent.click(screen.getByText('Cancel'));
        expect(mockHandleCancel).toHaveBeenCalled();
    });

    it('renders loading state correctly', () => {
        (useUpdateAsset as any).mockReturnValue({
            updateAssetData: vi.fn(),
            submitLoading: true,
        });

        render(
            <AssetInformationModal
                open
                handleCancel={mockHandleCancel}
                setRefState={mockSetRefState}
                assetData={{
                    data: {
                        id: '1',
                        assetName: 'Existing Asset',
                        assetCategory: 'Laptop',
                        purchasedDate: '2024-02-01',
                        assetType: 'Owned',
                        serialNumber: 'SN456',
                        vendor: 'Vendor B',
                        amount: '2000',
                        amountRecurring: 'Yearly',
                        warranty: '2 Years',
                        batchNumber: 'Batch2',
                        status: 'Inactive',
                    },
                }}
                initialValues={null}
            />,
            { wrapper: MemoryRouter }
        );

        expect(screen.getByLabelText('loading')).toBeInTheDocument();
    });
});
