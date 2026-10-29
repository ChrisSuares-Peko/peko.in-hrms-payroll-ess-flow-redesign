import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { vi, describe, it, expect, beforeEach, Mock } from 'vitest';

import { useAppSelector } from '@src/hooks/store';

import {
    getDocumentSizeLimits,
    updateDocumentSizeLimits,
} from '../../../api/corporateCardDocumentLimits';
import CorporateCardDocumentLimits from '../../../component/corporateCardDocumentLimits/CorporateCardDocumentLimits';

const mockDispatch = vi.fn();
vi.mock('@src/hooks/store', () => ({
    useAppSelector: vi.fn(),
    useAppDispatch: () => mockDispatch,
}));

vi.mock('@src/slices/apiSlice', () => ({
    showToast: vi.fn((payload: unknown) => ({ type: 'SHOW_TOAST', payload })),
}));

vi.mock('../../../api/corporateCardDocumentLimits', () => ({
    getDocumentSizeLimits: vi.fn(),
    updateDocumentSizeLimits: vi.fn(),
}));

const mockAuth = { reducer: { auth: { role: 'admin', id: 5 } } };

const response = () => ({
    documents: [
        {
            documentName: 'MOA',
            label: 'MoA (Memorandum of Association)',
            maxSizeKb: 10240,
            defaultMaxSizeKb: 10240,
        },
        {
            documentName: 'Address_Proof',
            label: 'Address Proof',
            maxSizeKb: 500,
            defaultMaxSizeKb: 500,
        },
    ],
    totals: {
        totalUploadKb: 25 * 1024,
        vendorPackKb: 26 * 1024,
        defaults: { totalUploadKb: 25 * 1024, vendorPackKb: 26 * 1024 },
    },
    minSizeKb: 100,
    maxSizeKb: 20480,
    minTotalKb: 1024,
    maxTotalKb: 100 * 1024,
});

const saveButton = () => screen.getByRole('button', { name: /Save/i });
const addressProofInput = () => screen.getAllByRole('spinbutton')[1];

describe('CorporateCardDocumentLimits', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        (useAppSelector as unknown as Mock).mockImplementation((fn: any) => fn(mockAuth));
        (getDocumentSizeLimits as Mock).mockResolvedValue(response());
    });

    it('lists each document with its current limit and its default', async () => {
        render(<CorporateCardDocumentLimits />);

        await waitFor(() => expect(screen.getByText('Address Proof')).toBeInTheDocument());
        expect(screen.getByText('MoA (Memorandum of Association)')).toBeInTheDocument();
        expect(screen.getByText('Default 500 KB')).toBeInTheDocument();
        expect(screen.getByText('Default 10 MB')).toBeInTheDocument();
    });

    it('states the range the admin may set', async () => {
        render(<CorporateCardDocumentLimits />);

        await waitFor(() =>
            expect(screen.getByText(/Between 100 KB and 20 MB/)).toBeInTheDocument()
        );
    });

    it('keeps Save disabled until something actually changes', async () => {
        render(<CorporateCardDocumentLimits />);

        await waitFor(() => expect(saveButton()).toBeDisabled());
    });

    it('sends only the documents that were edited', async () => {
        (updateDocumentSizeLimits as Mock).mockResolvedValue(response());
        render(<CorporateCardDocumentLimits />);

        await waitFor(() => expect(screen.getByText('Address Proof')).toBeInTheDocument());
        fireEvent.change(addressProofInput(), { target: { value: '1024' } });

        await waitFor(() => expect(saveButton()).toBeEnabled());
        fireEvent.click(saveButton());

        await waitFor(() =>
            expect(updateDocumentSizeLimits).toHaveBeenCalledWith(
                { userType: 'admin', userId: 5 },
                { limits: { Address_Proof: 1024 } }
            )
        );
    });

    it('shows the totals with their defaults', async () => {
        render(<CorporateCardDocumentLimits />);

        await waitFor(() =>
            expect(screen.getByText('Total documents a corporate may upload')).toBeInTheDocument()
        );
        expect(screen.getByText('Total pack sent to the vendor')).toBeInTheDocument();
        expect(screen.getByText(/Default 26 MB/)).toBeInTheDocument();
    });

    it('refuses to save a vendor pack smaller than the upload total', async () => {
        render(<CorporateCardDocumentLimits />);

        await waitFor(() =>
            expect(screen.getByText('Total pack sent to the vendor')).toBeInTheDocument()
        );
        const packInput = screen.getAllByRole('spinbutton')[3];
        fireEvent.change(packInput, { target: { value: String(10 * 1024) } });

        await waitFor(() => expect(saveButton()).toBeDisabled());
        expect(
            screen.getByText(/vendor pack must be at least as large as the upload total/)
        ).toBeInTheDocument();
    });

    it('sends only the totals that changed', async () => {
        (updateDocumentSizeLimits as Mock).mockResolvedValue(response());
        render(<CorporateCardDocumentLimits />);

        await waitFor(() =>
            expect(screen.getByText('Total pack sent to the vendor')).toBeInTheDocument()
        );
        const uploadInput = screen.getAllByRole('spinbutton')[2];
        fireEvent.change(uploadInput, { target: { value: String(20 * 1024) } });

        await waitFor(() => expect(saveButton()).toBeEnabled());
        fireEvent.click(saveButton());

        await waitFor(() =>
            expect(updateDocumentSizeLimits).toHaveBeenCalledWith(
                { userType: 'admin', userId: 5 },
                { totals: { totalUploadKb: 20 * 1024 } }
            )
        );
    });

    it('blocks Save when a value falls outside the allowed range', async () => {
        render(<CorporateCardDocumentLimits />);

        await waitFor(() => expect(screen.getByText('Address Proof')).toBeInTheDocument());
        fireEvent.change(addressProofInput(), { target: { value: '10' } });

        await waitFor(() => expect(saveButton()).toBeDisabled());
        expect(updateDocumentSizeLimits).not.toHaveBeenCalled();
    });

    it('tells the admin when the save failed rather than looking saved', async () => {
        (updateDocumentSizeLimits as Mock).mockResolvedValue(false);
        render(<CorporateCardDocumentLimits />);

        await waitFor(() => expect(screen.getByText('Address Proof')).toBeInTheDocument());
        fireEvent.change(addressProofInput(), { target: { value: '1024' } });
        await waitFor(() => expect(saveButton()).toBeEnabled());
        fireEvent.click(saveButton());

        await waitFor(() =>
            expect(mockDispatch).toHaveBeenCalledWith(
                expect.objectContaining({ type: 'SHOW_TOAST' })
            )
        );
    });
});
