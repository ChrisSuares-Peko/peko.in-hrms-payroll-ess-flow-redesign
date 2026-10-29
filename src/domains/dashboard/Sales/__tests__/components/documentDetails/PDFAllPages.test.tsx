import { render, waitFor } from '@testing-library/react';
import { vi, describe, it, beforeEach, beforeAll, expect } from 'vitest';

import PDFAllPages from '../../../components/documentDetails/PDFAllPages';

const getDocumentMock = vi.fn();

vi.mock('pdfjs-dist', () => ({
    GlobalWorkerOptions: { workerSrc: '' },
    getDocument: (...args: unknown[]) => getDocumentMock(...args),
}));

beforeAll(() => {
    global.ResizeObserver = vi.fn(() => ({
        observe: vi.fn(),
        unobserve: vi.fn(),
        disconnect: vi.fn(),
    })) as any;
    HTMLCanvasElement.prototype.getContext = vi.fn(() => ({
        scale: vi.fn(),
        clearRect: vi.fn(),
    })) as any;
});

beforeEach(() => {
    vi.clearAllMocks();
});

describe('PDFAllPages', () => {
    it('renders the spinner initially', () => {
        getDocumentMock.mockReturnValue({ promise: new Promise(() => {}) });

        const { container } = render(
            <PDFAllPages
                fileUrl="https://example.com/x.pdf"
                onPageCountChange={() => {}}
                onPageChange={() => {}}
            />
        );

        expect(container.querySelector('.ant-spin')).not.toBeNull();
    });

    it('renders nothing extra when fileUrl is empty', () => {
        const onPageCountChange = vi.fn();
        const { container } = render(
            <PDFAllPages
                fileUrl=""
                onPageCountChange={onPageCountChange}
                onPageChange={() => {}}
            />
        );

        // No fetch attempted.
        expect(getDocumentMock).not.toHaveBeenCalled();
        // Spinner is shown for empty (initial isLoading=true).
        expect(container.querySelector('.ant-spin')).not.toBeNull();
        expect(onPageCountChange).not.toHaveBeenCalled();
    });

    it('reports page count after PDF resolves', async () => {
        const renderFn = vi.fn(() => ({ promise: Promise.resolve() }));
        const getPage = vi.fn(() =>
            Promise.resolve({
                getViewport: () => ({ width: 100, height: 100 }),
                render: renderFn,
            })
        );
        getDocumentMock.mockReturnValue({
            promise: Promise.resolve({ numPages: 2, getPage }),
        });

        const onPageCountChange = vi.fn();

        render(
            <PDFAllPages
                fileUrl="https://example.com/x.pdf"
                onPageCountChange={onPageCountChange}
                onPageChange={() => {}}
            />
        );

        await waitFor(() => expect(onPageCountChange).toHaveBeenCalledWith(2));
    });

    it('does not throw if PDF load fails', async () => {
        getDocumentMock.mockReturnValue({
            promise: Promise.reject(new Error('boom')),
        });

        const onPageCountChange = vi.fn();
        const { container } = render(
            <PDFAllPages
                fileUrl="https://example.com/x.pdf"
                onPageCountChange={onPageCountChange}
                onPageChange={() => {}}
            />
        );

        // Loading should resolve to false even on failure.
        await waitFor(() => {
            expect(container.querySelector('.ant-spin')).toBeNull();
        });
        expect(onPageCountChange).not.toHaveBeenCalled();
    });
});
