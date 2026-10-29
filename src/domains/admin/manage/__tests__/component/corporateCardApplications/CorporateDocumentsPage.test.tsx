import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { vi, describe, it, expect, beforeEach, Mock } from 'vitest';

import { useAppSelector } from '@src/hooks/store';

import {
    downloadAllCorporateDocumentsForAdmin,
    getCorporateDocumentFileForAdmin,
    getCorporateDocumentsForAdmin,
} from '../../../api/corporateDocuments';
import CorporateDocumentsPage from '../../../component/corporateCardApplications/CorporateDocumentsPage';

const mockLocationState: { current: any } = { current: null };

vi.mock('react-router-dom', async () => {
    const actual = await vi.importActual<typeof import('react-router-dom')>('react-router-dom');
    return {
        ...actual,
        useParams: () => ({ corporateId: '42' }),
        useLocation: () => ({ state: mockLocationState.current }),
    };
});

const mockDispatch = vi.fn();
vi.mock('@src/hooks/store', () => ({
    useAppSelector: vi.fn(),
    useAppDispatch: () => mockDispatch,
}));

vi.mock('@src/slices/apiSlice', () => ({
    showToast: vi.fn((payload: unknown) => ({ type: 'SHOW_TOAST', payload })),
}));

vi.mock('../../../api/corporateDocuments', () => ({
    getCorporateDocumentsForAdmin: vi.fn(),
    getCorporateDocumentFileForAdmin: vi.fn(),
    getCorporateAgreementForAdmin: vi.fn(),
    regenerateCorporateAgreement: vi.fn(),
    downloadAllCorporateDocumentsForAdmin: vi.fn(),
}));

const mockAuth = { reducer: { auth: { role: 'admin', id: 5 } } };

const DOCUMENTS = [
    {
        documentName: 'Certificate_Of_Incorporation',
        label: 'Certificate of Incorporation',
        required: true,
    },
    { documentName: 'LLP_Agreement', label: 'LLP Agreement / Deed', required: true },
    { documentName: 'MOA', label: 'MoA (Memorandum of Association)', required: true },
    { documentName: 'Darpan_Id', label: 'Darpan ID', required: false },
    { documentName: 'Corporate_Agreement', label: 'Corporate Agreement', required: true },
];

const PROGRESS = [
    {
        key: 'business_type',
        label: 'Business type selected',
        state: 'done' as const,
        detail: 'LLP',
    },
    {
        key: 'submitted',
        label: 'Submitted for verification',
        state: 'pending' as const,
        detail: null,
    },
];

const response = (corporateDocuments = {}, documents = DOCUMENTS) => ({
    businessType: 'LLP',
    kybStatus: 'PENDING',
    rejectionReason: null,
    progress: PROGRESS,
    documents,
    corporateDocuments,
});

const uploadedMoa = {
    document: 'corp/42/moa/some-uuid.pdf',
    documentType: 'pdf',
    fileName: null,
    expiryDate: null,
    status: 'UPLOADED',
    uploadedAt: null,
};

describe('CorporateDocumentsPage', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        mockLocationState.current = {
            companyName: 'Steel & Co',
            fullName: 'Jane Doe',
            pekoAccountNumber: '100000726',
            email: 'jane@example.com',
        };
        (useAppSelector as unknown as Mock).mockImplementation((fn: any) => fn(mockAuth));
        (getCorporateDocumentsForAdmin as Mock).mockResolvedValue(response());
    });

    it('fetches documents for the corporateId from the URL', async () => {
        render(<CorporateDocumentsPage />);
        await waitFor(() =>
            expect(getCorporateDocumentsForAdmin).toHaveBeenCalledWith(
                { userType: 'admin', userId: 5 },
                42
            )
        );
    });

    it('renders the corporate context line from navigation state', async () => {
        render(<CorporateDocumentsPage />);
        await waitFor(() => expect(screen.getByText(/Steel & Co/)).toBeInTheDocument());
        expect(screen.getByText(/Jane Doe/)).toBeInTheDocument();
        expect(screen.getByText(/100000726/)).toBeInTheDocument();
        expect(screen.getByText(/jane@example.com/)).toBeInTheDocument();
    });

    // The list used to be a hardcoded eight, which hid LLP/Partnership/Proprietorship documents from
    // the reviewer entirely. It is now whatever the backend says this corporate has to produce.
    it('renders exactly the documents the backend lists for this corporate, in that order', async () => {
        render(<CorporateDocumentsPage />);

        await waitFor(() => expect(screen.getByText('LLP Agreement / Deed')).toBeInTheDocument());
        DOCUMENTS.forEach(doc => expect(screen.getByText(doc.label)).toBeInTheDocument());
        expect(screen.getAllByText(/^(Missing|Not uploaded)$/)).toHaveLength(DOCUMENTS.length);
    });

    it('separates a missing required document from a missing optional one', async () => {
        render(<CorporateDocumentsPage />);

        await waitFor(() => expect(screen.getAllByText('Missing')).toHaveLength(4));
        expect(screen.getAllByText('Not uploaded')).toHaveLength(1);
    });

    it('renders nothing but the empty list when the fetch fails', async () => {
        (getCorporateDocumentsForAdmin as Mock).mockResolvedValue(false);
        render(<CorporateDocumentsPage />);

        await waitFor(() =>
            expect(screen.queryByText('Certificate of Incorporation')).not.toBeInTheDocument()
        );
    });

    it('prefers the stored original file name over the generated S3 key', async () => {
        (getCorporateDocumentsForAdmin as Mock).mockResolvedValue(
            response({
                Corporate_Agreement: {
                    ...uploadedMoa,
                    document: 'corp/42/agreement/uuid-9',
                    documentType: 'docx',
                    fileName: 'Corporate-Agreement-Filled.docx',
                },
            })
        );
        render(<CorporateDocumentsPage />);

        await waitFor(() =>
            expect(screen.getByText('Corporate-Agreement-Filled.docx')).toBeInTheDocument()
        );
        expect(screen.queryByText('uuid-9')).not.toBeInTheDocument();
    });

    it('marks an uploaded document with its tag and file name, and shows download/view icons', async () => {
        (getCorporateDocumentsForAdmin as Mock).mockResolvedValue(response({ MOA: uploadedMoa }));
        render(<CorporateDocumentsPage />);

        await waitFor(() => expect(screen.getByText('some-uuid.pdf')).toBeInTheDocument());
        const moaLabel = screen.getByText('MoA (Memorandum of Association)');
        const row = moaLabel.closest('.border-b') as HTMLElement;
        expect(row.querySelector('.anticon-download')).toBeInTheDocument();
        expect(row.querySelector('.anticon-eye')).toBeInTheDocument();
    });

    it('does not show download/view icons for a document that has not been uploaded', async () => {
        render(<CorporateDocumentsPage />);

        await waitFor(() => expect(screen.getByText('Corporate Agreement')).toBeInTheDocument());
        const label = screen.getByText('Corporate Agreement');
        const row = label.closest('.border-b') as HTMLElement;
        expect(row.querySelector('.anticon-download')).not.toBeInTheDocument();
    });

    it('opens a blob URL in a new tab when the view icon is clicked', async () => {
        (getCorporateDocumentsForAdmin as Mock).mockResolvedValue(response({ MOA: uploadedMoa }));
        (getCorporateDocumentFileForAdmin as Mock).mockResolvedValue({
            buffer: { data: [1, 2, 3] },
            type: 'pdf',
        });
        const createObjectURL = vi.fn(() => 'blob:http://localhost/fake');
        const revokeObjectURL = vi.fn();
        Object.defineProperty(window, 'URL', {
            value: { createObjectURL, revokeObjectURL },
            writable: true,
        });
        const windowOpen = vi.spyOn(window, 'open').mockImplementation(() => null);

        render(<CorporateDocumentsPage />);
        await waitFor(() => expect(screen.getByText('some-uuid.pdf')).toBeInTheDocument());

        const row = screen
            .getByText('MoA (Memorandum of Association)')
            .closest('.border-b') as HTMLElement;
        fireEvent.click(row.querySelector('.anticon-eye')!);

        await waitFor(() =>
            expect(getCorporateDocumentFileForAdmin).toHaveBeenCalledWith(
                { userType: 'admin', userId: 5 },
                'corp/42/moa/some-uuid.pdf'
            )
        );
        await waitFor(() =>
            expect(windowOpen).toHaveBeenCalledWith(
                'blob:http://localhost/fake',
                '_blank',
                'noopener,noreferrer'
            )
        );
    });

    it('falls back to opening the raw docKey when the file fetch returns no buffer', async () => {
        (getCorporateDocumentsForAdmin as Mock).mockResolvedValue(response({ MOA: uploadedMoa }));
        (getCorporateDocumentFileForAdmin as Mock).mockResolvedValue(false);
        const windowOpen = vi.spyOn(window, 'open').mockImplementation(() => null);

        render(<CorporateDocumentsPage />);
        await waitFor(() => expect(screen.getByText('some-uuid.pdf')).toBeInTheDocument());

        const row = screen
            .getByText('MoA (Memorandum of Association)')
            .closest('.border-b') as HTMLElement;
        fireEvent.click(row.querySelector('.anticon-eye')!);

        await waitFor(() =>
            expect(windowOpen).toHaveBeenCalledWith(
                'corp/42/moa/some-uuid.pdf',
                '_blank',
                'noopener,noreferrer'
            )
        );
    });

    it('falls back to "Unnamed corporate" when there is no companyName or fullName in navigation state', async () => {
        mockLocationState.current = null;
        render(<CorporateDocumentsPage />);

        await waitFor(() => expect(screen.getByText(/Unnamed corporate/)).toBeInTheDocument());
    });

    describe('the journey panel', () => {
        it('shows which steps the corporate completed', async () => {
            render(<CorporateDocumentsPage />);

            await waitFor(() =>
                expect(screen.getByText('Steps completed by the corporate')).toBeInTheDocument()
            );
            expect(screen.getByText('Business type selected')).toBeInTheDocument();
            expect(screen.getByText('Submitted for verification')).toBeInTheDocument();
        });

        // Otherwise a reviewer sees a confident all-pending journey for a corporate who finished.
        it('is absent when the fetch failed, rather than claiming nothing was done', async () => {
            (getCorporateDocumentsForAdmin as Mock).mockResolvedValue(false);
            render(<CorporateDocumentsPage />);

            await waitFor(() =>
                expect(screen.queryByText('Certificate of Incorporation')).not.toBeInTheDocument()
            );
            expect(screen.queryByText('Steps completed by the corporate')).not.toBeInTheDocument();
        });
    });

    describe('Download All', () => {
        const button = () => screen.getByRole('button', { name: /Download All/i });

        it('is disabled when the corporate has uploaded nothing', async () => {
            render(<CorporateDocumentsPage />);

            await waitFor(() => expect(button()).toBeDisabled());
            expect(downloadAllCorporateDocumentsForAdmin).not.toHaveBeenCalled();
        });

        it('asks the backend for the whole pack once a document exists', async () => {
            (getCorporateDocumentsForAdmin as Mock).mockResolvedValue(
                response({ MOA: uploadedMoa })
            );
            (downloadAllCorporateDocumentsForAdmin as Mock).mockResolvedValue(
                new Blob(['zip'], { type: 'application/zip' })
            );
            render(<CorporateDocumentsPage />);

            await waitFor(() => expect(button()).toBeEnabled());
            fireEvent.click(button());

            await waitFor(() =>
                expect(downloadAllCorporateDocumentsForAdmin).toHaveBeenCalledWith(
                    { userType: 'admin', userId: 5 },
                    42
                )
            );
        });

        it('tells the reviewer when the pack could not be built, instead of failing silently', async () => {
            (getCorporateDocumentsForAdmin as Mock).mockResolvedValue(
                response({ MOA: uploadedMoa })
            );
            (downloadAllCorporateDocumentsForAdmin as Mock).mockResolvedValue(false);
            render(<CorporateDocumentsPage />);

            await waitFor(() => expect(button()).toBeEnabled());
            fireEvent.click(button());

            await waitFor(() =>
                expect(mockDispatch).toHaveBeenCalledWith(
                    expect.objectContaining({ type: 'SHOW_TOAST' })
                )
            );
        });
    });
});
