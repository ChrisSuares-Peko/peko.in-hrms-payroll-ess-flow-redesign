import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { Provider } from 'react-redux';
import { MemoryRouter } from 'react-router-dom';
import configureStore from 'redux-mock-store';
import { describe, it, expect, vi, beforeEach } from 'vitest';

import UploadForm from '../../../components/uploadPage/UploadForm';

const mockStore = configureStore();

describe('UploadForm Component', () => {
    let store: ReturnType<typeof mockStore>;

    beforeEach(() => {
        store = mockStore({
            reducer: {
                user: { roleName: 'admin' },
            },
        });

        store.dispatch = vi.fn();
    });

    it('renders the upload form correctly', () => {
        render(
            <Provider store={store}>
                <MemoryRouter>
                    <UploadForm eSignAvailable />
                </MemoryRouter>
            </Provider>
        );

        expect(screen.getByText(/Click or drag file to this area to upload/i)).toBeInTheDocument();
        expect(screen.getByText(/Upload the document in PDF format/i)).toBeInTheDocument();
    });

    it('allows uploading a valid PDF file', async () => {
        const file = new File(['dummy content'], 'test.pdf', { type: 'application/pdf' });

        const { container } = render(
            <Provider store={store}>
                <MemoryRouter>
                    <UploadForm eSignAvailable />
                </MemoryRouter>
            </Provider>
        );

        // Find the hidden input inside the upload component
        const fileInput = container.querySelector('input[type="file"]');
        expect(fileInput).not.toBeNull();

        // Fire event on the hidden input
        fireEvent.change(fileInput!, { target: { files: [file] } });

        await waitFor(() => {
            expect(store.dispatch).toHaveBeenCalled();
        });
    });

    it('shows an error when uploading a non-PDF file', async () => {
        const file = new File(['dummy content'], 'test.txt', { type: 'text/plain' });

        const { container } = render(
            <Provider store={store}>
                <MemoryRouter>
                    <UploadForm eSignAvailable />
                </MemoryRouter>
            </Provider>
        );

        const fileInput = container.querySelector('input[type="file"]');
        fireEvent.change(fileInput!, { target: { files: [file] } });

        await waitFor(() => {
            expect(store.dispatch).toHaveBeenCalledWith(
                expect.objectContaining({
                    payload: expect.objectContaining({
                        description: 'You can only upload PDF files.',
                    }),
                })
            );
        });
    });

    it('shows an error when uploading a file larger than 20MB', async () => {
        const largeFile = new File([new ArrayBuffer(21 * 1024 * 1024)], 'large.pdf', {
            type: 'application/pdf',
        });

        const { container } = render(
            <Provider store={store}>
                <MemoryRouter>
                    <UploadForm eSignAvailable />
                </MemoryRouter>
            </Provider>
        );

        const fileInput = container.querySelector('input[type="file"]');
        fireEvent.change(fileInput!, { target: { files: [largeFile] } });

        await waitFor(() => {
            expect(store.dispatch).toHaveBeenCalledWith(
                expect.objectContaining({
                    payload: expect.objectContaining({
                        description: 'File must be smaller than 20 MB.',
                    }),
                })
            );
        });
    });
});
