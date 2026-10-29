import React from 'react';

import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';

import { useAppDispatch } from '@src/hooks/store';
import { showToast } from '@src/slices/apiSlice';

import PersonalInfoCard from '../../../components/OwnershipDoc/PersonalInfoCard';
import { useDeleteOwnerDocApi } from '../../../hooks/ownerDocHooks/useDeleteOwnerDocApi';

// Mock dependencies
vi.mock('@src/hooks/store', () => ({
    useAppDispatch: vi.fn(),
}));

vi.mock('@src/slices/apiSlice', () => ({
    showToast: vi.fn(),
}));

vi.mock('../../../hooks/ownerDocHooks/useDeleteOwnerDocApi', () => ({
    useDeleteOwnerDocApi: vi.fn(),
}));

vi.mock('@components/molecular/modals/ConfirmationModal', () => ({
    __esModule: true,
    default: vi.fn(({ isOpen, handleCancel, handleSubmit, isLoading }) =>
        isOpen ? (
            <div>
                ConfirmationModal
                <button type="button" onClick={handleCancel}>
                    Cancel
                </button>
                <button type="button" onClick={handleSubmit} disabled={isLoading}>
                    Confirm
                </button>
            </div>
        ) : null
    ),
}));

describe('PersonalInfoCard', () => {
    const mockDispatch = vi.fn();
    const mockDeleteOwnerDocData = vi.fn();
    const mockSetOpenOwnerDetailsModal = vi.fn();
    const mockReloadTable = vi.fn();

    const owner = {
        id: '1',
        profilePicture: 'https://example.com/profile.jpg',
        ownerName: 'John Doe',
        percentageOfShare: 25,
        homeAddress: '123 Main St',
        nationality: 'American',
    };

    beforeEach(() => {
        vi.clearAllMocks();
        (useAppDispatch as any).mockReturnValue(mockDispatch);
        (useDeleteOwnerDocApi as any).mockReturnValue({
            deleteOwnerDocData: mockDeleteOwnerDocData,
            isLoading: false,
        });
    });

    it('renders PersonalInfoCard correctly', () => {
        render(
            <PersonalInfoCard
                owner={owner}
                setOpenOwnerDetailsModal={mockSetOpenOwnerDetailsModal}
                reloadTable={mockReloadTable}
            />
        );

        expect(screen.getByText(owner.ownerName)).toBeInTheDocument();
        expect(
            screen.getByText(`${owner.percentageOfShare.toFixed(2)}% ownership`)
        ).toBeInTheDocument();
        expect(screen.getByText('Home Address')).toBeInTheDocument();
        expect(screen.getByText(owner.homeAddress)).toBeInTheDocument();
        expect(screen.getByText('Nationality')).toBeInTheDocument();
        expect(screen.getByText(owner.nationality)).toBeInTheDocument();
    });

    it('opens ConfirmationModal when "Delete" button is clicked', () => {
        render(
            <PersonalInfoCard
                owner={owner}
                setOpenOwnerDetailsModal={mockSetOpenOwnerDetailsModal}
                reloadTable={mockReloadTable}
            />
        );

        fireEvent.click(screen.getByRole('img', { name: /delete/i }));

        expect(screen.getByText('ConfirmationModal')).toBeInTheDocument();
    });

    it('calls handleDeleteOwner when "Confirm" button is clicked in ConfirmationModal', async () => {
        (useDeleteOwnerDocApi as any).mockReturnValue({
            deleteOwnerDocData: mockDeleteOwnerDocData,
            isLoading: false,
        });

        render(
            <PersonalInfoCard
                owner={owner}
                setOpenOwnerDetailsModal={mockSetOpenOwnerDetailsModal}
                reloadTable={mockReloadTable}
            />
        );

        fireEvent.click(screen.getByRole('img', { name: /delete/i }));
        fireEvent.click(screen.getByRole('button', { name: /confirm/i }));

        await waitFor(() => {
            expect(mockDeleteOwnerDocData).toHaveBeenCalledWith(owner.id);
            expect(mockReloadTable).toHaveBeenCalled();
        });
    });

    it('displays loading state on "Confirm" button in ConfirmationModal when isLoading is true', () => {
        (useDeleteOwnerDocApi as any).mockReturnValue({
            deleteOwnerDocData: mockDeleteOwnerDocData,
            isLoading: true,
        });

        render(
            <PersonalInfoCard
                owner={owner}
                setOpenOwnerDetailsModal={mockSetOpenOwnerDetailsModal}
                reloadTable={mockReloadTable}
            />
        );

        fireEvent.click(screen.getByRole('img', { name: /delete/i }));

        expect(screen.getByRole('button', { name: /confirm/i })).toBeDisabled();
    });

    it('calls dispatch with showToast when "Share Documents" button is clicked', () => {
        render(
            <PersonalInfoCard
                owner={owner}
                setOpenOwnerDetailsModal={mockSetOpenOwnerDetailsModal}
                reloadTable={mockReloadTable}
            />
        );

        fireEvent.click(screen.getByRole('button', { name: /share documents/i }));

        expect(mockDispatch).toHaveBeenCalledWith(
            showToast({ variant: 'info', description: 'Coming soon' })
        );
    });

    it('closes ConfirmationModal when "Cancel" button is clicked', () => {
        render(
            <PersonalInfoCard
                owner={owner}
                setOpenOwnerDetailsModal={mockSetOpenOwnerDetailsModal}
                reloadTable={mockReloadTable}
            />
        );

        fireEvent.click(screen.getByRole('img', { name: /delete/i }));
        expect(screen.getByText('ConfirmationModal')).toBeInTheDocument();

        fireEvent.click(screen.getByRole('button', { name: /cancel/i }));

        expect(screen.queryByText('ConfirmationModal')).not.toBeInTheDocument();
    });

    it('opens OwnerDetailsModal when "Edit" button is clicked', () => {
        render(
            <PersonalInfoCard
                owner={owner}
                setOpenOwnerDetailsModal={mockSetOpenOwnerDetailsModal}
                reloadTable={mockReloadTable}
            />
        );

        fireEvent.click(screen.getByRole('img', { name: /edit/i }));

        expect(mockSetOpenOwnerDetailsModal).toHaveBeenCalledWith(true);
    });
});
