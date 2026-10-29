import { render, screen, fireEvent } from '@testing-library/react';
import { Provider } from 'react-redux';
import { MemoryRouter } from 'react-router-dom';
import configureStore from 'redux-mock-store';
import { describe, it, expect, vi, beforeEach } from 'vitest';

import useFileDownloader from '@src/hooks/useFileDownloader';

import TableBody from '../../../components/orderHistory/TableBody';
import * as eSignDocumentHook from '../../../hooks/useESignDocument';
import useESignHistory from '../../../hooks/useESignHistory';

// Mock hooks
vi.mock('../../../hooks/useESignHistory', () => ({
    default: vi.fn(),
}));

vi.mock('@src/hooks/useFileDownloader', () => ({
    default: vi.fn(() => ({ handleDownloadLink: vi.fn() })),
}));

// Properly mock `useESignDocument` using vi.mock with `vi.importActual`
vi.mock('../../../hooks/useESignDocument', async () => {
    const actual = await vi.importActual('../../../hooks/useESignDocument');
    return {
        ...actual,
        useESignDocument: vi.fn(() => ({ isLoading: false })),
    };
});

const mockStore = configureStore();
const store = mockStore({
    reducer: {
        eSignDoc: { signerCo: 'mockedData' }, // Mocked eSignDoc slice
    },
});

describe('TableBody Component', () => {
    const mockDownload = vi.fn();

    beforeEach(() => {
        vi.clearAllMocks();

        (useFileDownloader as unknown as any).mockReturnValue({
            handleDownloadLink: mockDownload,
        });

        (useESignHistory as unknown as any).mockReturnValue({
            tableData: [
                {
                    id: '1',
                    createdAt: '2024-02-14T12:00:00Z',
                    docket_title: 'Test Document',
                    signers_info: [{ signer_name: 'John Doe' }],
                    status: 'COMPLETED',
                    document_url: '/test-document.pdf',
                },
            ],
            isLoading: false,
            count: 10,
        });

        vi.spyOn(eSignDocumentHook, 'useESignDocument').mockReturnValue({
            isLoading: false,
            eSignDocument: async () => true,
            resendInvitation: async () => Promise.resolve(),
            getOrderDetails: async () => Promise.resolve(true),
            downloadDocument: vi.fn(),
        });
    });

    it('renders the TableBody component correctly', () => {
        render(
            <Provider store={store}>
                <MemoryRouter>
                    <TableBody searchText="" filters={undefined} />
                </MemoryRouter>
            </Provider>
        );

        expect(screen.getByText('Created Date')).toBeInTheDocument();
        expect(screen.getByText('Document Name')).toBeInTheDocument();
        expect(screen.getByText('Status')).toBeInTheDocument();
        expect(screen.getByText('Actions')).toBeInTheDocument();
        expect(screen.getByText('Test Document')).toBeInTheDocument();
    });

    it('handles download click for completed documents', () => {
        render(
            <Provider store={store}>
                <MemoryRouter>
                    <TableBody searchText="" filters={undefined} />
                </MemoryRouter>
            </Provider>
        );

        const downloadButton = screen.getByText(/Download/i);
        expect(downloadButton).toBeInTheDocument();

        // Simulate click event
        fireEvent.click(downloadButton);
        expect(mockDownload).toHaveBeenCalledWith('/test-document.pdf');
    });

    it('handles pagination changes when next page is available', async () => {
        // Mock pagination with enough data to enable next page
        (useESignHistory as unknown as any).mockReturnValue({
            tableData: Array(15).fill({
                id: '1',
                createdAt: '2024-02-14T12:00:00Z',
                docket_title: 'Test Document',
                signers_info: [{ signer_name: 'John Doe' }],
                status: 'COMPLETED',
                document_url: '/test-document.pdf',
            }),
            isLoading: false,
            count: 15, // Ensuring there are multiple pages
        });

        render(
            <Provider store={store}>
                <MemoryRouter>
                    <TableBody searchText="" filters={undefined} />
                </MemoryRouter>
            </Provider>
        );

        // Ensure the "Next Page" button exists and is enabled
        const nextPageButton = screen.getByRole('button', { name: /right/i });
        expect(nextPageButton).toBeInTheDocument();
        expect(nextPageButton).not.toBeDisabled();

        // Simulate clicking the Next Page button
        fireEvent.click(nextPageButton);
    });
});
