import React from 'react';

import { render, screen, fireEvent, waitFor, cleanup } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import OwnerDetailsModal from '../../../components/Modals/OwnerDetailsModal';
import useOwnerDocCreate from '../../../hooks/ownerDocHooks/useCreateOwnerDocApi';
import { useUpdateOwnerDoc } from '../../../hooks/ownerDocHooks/useUpdateOwnerDocApi';

// Mock the dependencies
vi.mock('@hooks/store', () => ({
    useAppSelector: vi.fn(),
    useAppDispatch: vi.fn(),
}));

vi.mock('../../../hooks/ownerDocHooks/useCreateOwnerDocApi', () => ({
    default: vi.fn(() => ({
        handleOwnerDocCreation: vi.fn(),
        submitLoading: false,
    })),
}));

vi.mock('../../../hooks/ownerDocHooks/useUpdateOwnerDocApi', () => ({
    useUpdateOwnerDoc: vi.fn(() => ({
        updateOwnerDoc: vi.fn(),
        submitLoading: false,
    })),
}));

vi.mock('../../../hooks/ownerDocHooks/useGetCountryApi', () => ({
    default: vi.fn(() => ({
        countriesList: [
            { label: 'United Arab Emirates', value: 'UAE' },
            { label: 'United States', value: 'USA' },
        ],
    })),
}));

describe('OwnerDetailsModal', () => {
    const mockHandleCancel = vi.fn();
    const mockReloadTable = vi.fn();

    beforeEach(() => {
        cleanup();
        vi.clearAllMocks();
    });

    it('renders correctly', () => {
        render(
            <OwnerDetailsModal
                open
                handleCancel={mockHandleCancel}
                reloadTable={mockReloadTable}
            />,
            { wrapper: MemoryRouter }
        );

        expect(screen.getByText('Add Owner Details')).toBeInTheDocument();
        expect(screen.getByText('Owner Name')).toBeInTheDocument();
        expect(screen.getByText('Percentage of Share')).toBeInTheDocument();
        expect(screen.getByText('Home Address')).toBeInTheDocument();
        expect(screen.getByText('Nationality')).toBeInTheDocument();
        expect(screen.getByText('Profile Picture')).toBeInTheDocument();
    });

    it('calls handleOwnerDocCreation on form submit when adding new owner details', async () => {
        const handleOwnerDocCreation = vi.fn();
        (useOwnerDocCreate as any).mockReturnValue({
            handleOwnerDocCreation,
            submitLoading: false,
        });

        render(
            <OwnerDetailsModal
                open
                handleCancel={mockHandleCancel}
                reloadTable={mockReloadTable}
            />,
            { wrapper: MemoryRouter }
        );

        fireEvent.change(screen.getByPlaceholderText('Enter owner name'), {
            target: { value: 'John Smith' },
        });
        fireEvent.change(screen.getByPlaceholderText('Enter percentage of share'), {
            target: { value: '25.00' },
        });
        fireEvent.change(screen.getByPlaceholderText('Enter home address'), {
            target: { value: '123 Main St' },
        });

        // Open the nationality select dropdown
        fireEvent.mouseDown(screen.getByText('Select Nationality'));

        // Select a nationality from the dropdown
        const nationalityOption = await screen.findByText('United Arab Emirates');
        fireEvent.click(nationalityOption);

        fireEvent.click(screen.getByRole('button', { name: /submit/i }));

        await waitFor(() => {
            expect(handleOwnerDocCreation).toHaveBeenCalled();
        });
    });

    it('calls updateOwnerDoc when editing an existing record', async () => {
        const updateOwnerDoc = vi.fn();
        (useUpdateOwnerDoc as any).mockReturnValue({
            updateOwnerDoc,
            submitLoading: false,
        });

        const selectedRecordData = {
            id: 1,
            ownerName: 'John Smith',
            percentageOfShare: '25.00',
            homeAddress: '123 Main St',
            nationality: 'UAE',
            profilePicture: 'profile.jpg',
        };

        render(
            <OwnerDetailsModal
                open
                handleCancel={mockHandleCancel}
                selectedData={selectedRecordData}
                reloadTable={mockReloadTable}
            />,
            { wrapper: MemoryRouter }
        );

        fireEvent.change(screen.getByPlaceholderText('Enter owner name'), {
            target: { value: 'Jane Smith' },
        });

        fireEvent.click(screen.getByRole('button', { name: /submit/i }));

        await waitFor(() =>
            expect(updateOwnerDoc).toHaveBeenCalledWith(
                expect.objectContaining({ ownerName: 'Jane Smith' }),
                { ownerId: selectedRecordData.id }
            )
        );
    });

    it('renders loading state correctly', () => {
        (useOwnerDocCreate as any).mockReturnValue({
            handleOwnerDocCreation: vi.fn(),
            submitLoading: true,
        });
        (useUpdateOwnerDoc as any).mockReturnValue({
            updateOwnerDoc: vi.fn(),
            submitLoading: true,
        });

        render(
            <OwnerDetailsModal
                open
                handleCancel={mockHandleCancel}
                reloadTable={mockReloadTable}
            />,
            { wrapper: MemoryRouter }
        );

        expect(screen.getByLabelText('loading')).toBeInTheDocument();
    });

    it('calls handleCancel when cancel button is clicked', () => {
        render(
            <OwnerDetailsModal
                open
                handleCancel={mockHandleCancel}
                reloadTable={mockReloadTable}
            />,
            { wrapper: MemoryRouter }
        );

        fireEvent.click(screen.getByText('Cancel'));
        expect(mockHandleCancel).toHaveBeenCalled();
    });
});
