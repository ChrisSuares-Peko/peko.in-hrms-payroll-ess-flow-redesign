import React from 'react';

import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';

import { useAppDispatch } from '@src/hooks/store';
import { showToast } from '@src/slices/apiSlice';

import EjariDocCard from '../../../components/OwnershipDoc/EjariDocCard';
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

describe('EjariDocCard', () => {
    const mockSetOpenOwnerDocumentModal = vi.fn();
    const mockSetSelectedDocument = vi.fn();
    const mockDispatch = vi.fn();
    const mockHandleDocumentDownload = vi.fn();

    const owner = {
        id: '1',
        ejari: {
            issueDate: '2024-09-01',
            expireDate: '2025-09-01',
            documentNumber: 'EJ123456789',
            document: 'http://example.com/ejari.pdf',
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

    it('renders the Ejari document details correctly', () => {
        render(
            <EjariDocCard
                owner={owner}
                setOpenOwnerDocumentModal={mockSetOpenOwnerDocumentModal}
                setSelectedDocument={mockSetSelectedDocument}
            />
        );

        expect(screen.getByText('Ejari')).toBeInTheDocument();
        expect(screen.getByText(/Issued Date:/i)).toBeInTheDocument();
        expect(screen.getByText(/2024-09-01/i)).toBeInTheDocument();
        expect(screen.getByText(/Expiry Date:/i)).toBeInTheDocument();
        expect(screen.getByText(/2025-09-01/i)).toBeInTheDocument();
        expect(screen.getByText(/Ejari No./i)).toBeInTheDocument();
        expect(screen.getByText(/EJ123456789/i)).toBeInTheDocument();
    });

    it('calls setOpenOwnerDocumentModal and setSelectedDocument when "Update" button is clicked', () => {
        render(
            <EjariDocCard
                owner={owner}
                setOpenOwnerDocumentModal={mockSetOpenOwnerDocumentModal}
                setSelectedDocument={mockSetSelectedDocument}
            />
        );

        fireEvent.click(screen.getAllByText('Update')[0]);

        expect(mockSetOpenOwnerDocumentModal).toHaveBeenCalledWith(true);
        expect(mockSetSelectedDocument).toHaveBeenCalledWith({
            ...owner.ejari,
            ownerId: owner.id,
            documentType: 'ejari',
        });
    });

    it('calls handleDocumentDownload when "Download" button is clicked', async () => {
        render(
            <EjariDocCard
                owner={owner}
                setOpenOwnerDocumentModal={mockSetOpenOwnerDocumentModal}
                setSelectedDocument={mockSetSelectedDocument}
            />
        );

        fireEvent.click(screen.getAllByText('Download')[0]);

        await waitFor(() => {
            expect(mockHandleDocumentDownload).toHaveBeenCalledWith(owner.ejari.document, 'Ejari');
        });
    });

    it('displays loading state on "Download" button when isLoading is true', () => {
        (useDownloadDocument as any).mockReturnValue({
            handleDocumentDownload: mockHandleDocumentDownload,
            isLoading: true,
        });

        render(
            <EjariDocCard
                owner={owner}
                setOpenOwnerDocumentModal={mockSetOpenOwnerDocumentModal}
                setSelectedDocument={mockSetSelectedDocument}
            />
        );

        expect(screen.getAllByRole('button', { name: /download/i })[0]).toHaveClass(
            'ant-btn-loading'
        );
    });

    it('copies the Ejari document number to clipboard and shows a success toast when clipboard icon is clicked', () => {
        const { container } = render(
            <EjariDocCard
                owner={owner}
                setOpenOwnerDocumentModal={mockSetOpenOwnerDocumentModal}
                setSelectedDocument={mockSetSelectedDocument}
            />
        );

        const clipboardIcon = container.querySelector('.cursor-pointer');

        fireEvent.click(clipboardIcon as Element);

        expect(copyToClipboard).toHaveBeenCalledWith(owner.ejari?.documentNumber);
        expect(mockDispatch).toHaveBeenCalledWith(
            showToast({ variant: 'success', description: 'Copied to clip board' })
        );
    });
});
