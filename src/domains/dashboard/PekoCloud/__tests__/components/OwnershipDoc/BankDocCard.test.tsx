import React from 'react';

import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';

import { useAppDispatch } from '@src/hooks/store';
import { showToast } from '@src/slices/apiSlice';

import BankDocCard from '../../../components/OwnershipDoc/BankDocCard';
import useDownloadDocument from '../../../hooks/useDownloadDocumentApi';
import { copyToClipboard } from '../../../utils/useCopyToClipboard';

// Mock dependencies
vi.mock('react-svg', () => ({
    ReactSVG: (props: any) => <div {...props} />,
}));

vi.mock('@src/hooks/store', () => ({
    useAppDispatch: vi.fn(),
}));

vi.mock('../../../hooks/useDownloadDocumentApi', () => ({
    default: vi.fn(() => ({
        handleDocumentDownload: vi.fn(),
        isLoading: false,
    })),
}));

vi.mock('@src/slices/apiSlice', async importOriginal => {
    const actual = (await importOriginal()) as typeof import('@src/slices/apiSlice');
    return {
        ...actual,
        showToast: vi.fn(),
    };
});

vi.mock('../../../utils/useCopyToClipboard', () => ({
    copyToClipboard: vi.fn(),
}));

describe('BankDocCard', () => {
    const mockSetOpenOwnerBankDetailsModal = vi.fn();
    const mockSetSelectedBankDetails = vi.fn();
    const mockDispatch = vi.fn();
    const mockHandleDocumentDownload = vi.fn();

    const owner = {
        id: '1',
        bankDetails: {
            name: 'John Doe',
            swiftcode: 'SWIFT123',
            iban: 'IBAN123456789',
            document: 'http://example.com/bankaccount.pdf',
        },
    };

    beforeEach(() => {
        vi.clearAllMocks();
        (useAppDispatch as any).mockReturnValue(mockDispatch);
        (useDownloadDocument as any).mockReturnValue({
            handleDocumentDownload: mockHandleDocumentDownload,
            isLoading: false,
        });
    });

    it('renders the Bank Account Details correctly', () => {
        render(
            <BankDocCard
                owner={owner}
                setOpenOwnerBankDetailsModal={mockSetOpenOwnerBankDetailsModal}
                setSelectedBankDetails={mockSetSelectedBankDetails}
            />
        );

        expect(screen.getByText('Bank Account Details')).toBeInTheDocument();
        expect(screen.getByText(/Name:/i)).toBeInTheDocument();
        expect(screen.getByText(/John Doe/i)).toBeInTheDocument();
        expect(screen.getByText(/Swift Code:/i)).toBeInTheDocument();
        expect(screen.getByText(/SWIFT123/i)).toBeInTheDocument();
        expect(screen.getByText(/IBAN:/i)).toBeInTheDocument();
        expect(screen.getByText(/IBAN123456789/i)).toBeInTheDocument();
    });

    it('calls setOpenOwnerBankDetailsModal and setSelectedBankDetails when "Update" button is clicked', () => {
        render(
            <BankDocCard
                owner={owner}
                setOpenOwnerBankDetailsModal={mockSetOpenOwnerBankDetailsModal}
                setSelectedBankDetails={mockSetSelectedBankDetails}
            />
        );

        fireEvent.click(screen.getAllByText('Update')[0]);

        expect(mockSetOpenOwnerBankDetailsModal).toHaveBeenCalledWith(true);
        expect(mockSetSelectedBankDetails).toHaveBeenCalledWith({
            ...owner.bankDetails,
            ownerId: owner.id,
            documentType: 'bankDetails',
        });
    });

    it('calls handleDocumentDownload when "Download" button is clicked', async () => {
        render(
            <BankDocCard
                owner={owner}
                setOpenOwnerBankDetailsModal={mockSetOpenOwnerBankDetailsModal}
                setSelectedBankDetails={mockSetSelectedBankDetails}
            />
        );

        fireEvent.click(screen.getAllByText('Download')[0]);

        await waitFor(() => {
            expect(mockHandleDocumentDownload).toHaveBeenCalledWith(
                owner.bankDetails.document,
                'Bank Account Details'
            );
        });
    });

    it('displays loading state on "Download" button when isLoading is true', () => {
        (useDownloadDocument as any).mockReturnValue({
            handleDocumentDownload: mockHandleDocumentDownload,
            isLoading: true,
        });

        render(
            <BankDocCard
                owner={owner}
                setOpenOwnerBankDetailsModal={mockSetOpenOwnerBankDetailsModal}
                setSelectedBankDetails={mockSetSelectedBankDetails}
            />
        );

        expect(screen.getAllByRole('button', { name: /download/i })[0]).toHaveClass(
            'ant-btn-loading'
        );
    });

    it('copies the IBAN to clipboard and shows a success toast when clipboard icon is clicked', () => {
        const { container } = render(
            <BankDocCard
                owner={owner}
                setOpenOwnerBankDetailsModal={mockSetOpenOwnerBankDetailsModal}
                setSelectedBankDetails={mockSetSelectedBankDetails}
            />
        );

        const clipboardIcon = container.querySelector('.cursor-pointer');

        fireEvent.click(clipboardIcon as Element);

        expect(copyToClipboard).toHaveBeenCalledWith(owner.bankDetails.iban);
        expect(mockDispatch).toHaveBeenCalledWith(
            showToast({ variant: 'success', description: 'Copied to clip board' })
        );
    });
});
