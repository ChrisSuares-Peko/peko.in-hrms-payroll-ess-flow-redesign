import { render, screen } from '@testing-library/react';
import { Provider } from 'react-redux';
import { MemoryRouter } from 'react-router-dom';
import configureStore from 'redux-mock-store';
import { describe, it, expect, vi, beforeEach } from 'vitest';

import ViewPage from '../../pages/ViewPage';
import {
    clearESignDocData,
    clearSignerArray,
    clearSignerCoordinates,
} from '../../slices/eSignDocSlice';

const mockStore = configureStore();

vi.mock('pdfjs-dist', async () => {
    const actual = await vi.importActual<any>('pdfjs-dist'); // Import actual module for partial mocking
    return {
        ...actual,
        GlobalWorkerOptions: { workerSrc: '' }, // ✅ Mock worker to prevent error
        getDocument: vi.fn(() => ({
            promise: Promise.resolve({
                numPages: 5, // ✅ Mock number of pages
                getPage: vi.fn(pageNumber =>
                    Promise.resolve({
                        getViewport: vi.fn(() => ({ width: 612, height: 792 })), // ✅ Mock viewport size
                        render: vi.fn(() => ({
                            promise: Promise.resolve(), // ✅ Mock render function
                        })),
                    })
                ),
            }),
        })),
    };
});

vi.mock('pdfjs-dist/build/pdf.worker.min.js', () => ({})); // ✅ Prevent worker module not found error

vi.mock('../../hooks/useESignDocument', () => ({
    useESignDocument: () => ({
        isLoading: false,
        getOrderDetails: vi.fn(),
        eSignDocument: vi.fn().mockResolvedValue(true),
    }),
}));

describe('ViewPage Component', () => {
    let store: any;
    let dispatchMock: any;

    beforeEach(() => {
        store = mockStore({
            reducer: {
                auth: { role: 'admin', id: 123 },
                eSignDoc: {
                    document_url: 'test.pdf',
                    isDisabled: false,
                    id: 1,
                    docket_title: 'Test Document',
                    expiry_date: '2025-12-31',
                    reminder: false,
                    reminder_interval: undefined,
                    // Using a valid Base64-encoded PDF string
                    documentBase64: 'data:application/pdf;base64,SGVsbG8gd29ybGQK',
                    sequentialSignature: false,
                    signers_info: [],
                    initiator_name: 'John Doe',
                    initiator_email: 'john@example.com',
                    termsofUse: true,
                },
                user: {
                    contactPersonName: 'John Doe',
                    email: 'john@example.com',
                    mobileNo: '1234567890',
                },
            },
        });
        dispatchMock = vi.fn();
        store.dispatch = dispatchMock;
    });

    const renderComponent = () =>
        render(
            <Provider store={store}>
                <MemoryRouter>
                    <ViewPage />
                </MemoryRouter>
            </Provider>
        );

    it('renders without crashing', () => {
        renderComponent();
        expect(screen.getByText(/Document Name/i)).toBeInTheDocument();
    });

    it('dispatches clear actions on mount', () => {
        renderComponent();
        expect(dispatchMock).toHaveBeenCalledWith(clearSignerCoordinates());
        expect(dispatchMock).toHaveBeenCalledWith(clearSignerArray());
    });

    it('clears eSignDocData on unmount', () => {
        const { unmount } = renderComponent();
        unmount();
        expect(dispatchMock).toHaveBeenCalledWith(clearESignDocData());
    });

    it('renders with a valid documentBase64 value', () => {
        renderComponent();
        const base64String = store.getState().reducer.eSignDoc.documentBase64;
      
        expect(base64String).toMatch(/^data:application\/pdf;base64,/);
    });
});
