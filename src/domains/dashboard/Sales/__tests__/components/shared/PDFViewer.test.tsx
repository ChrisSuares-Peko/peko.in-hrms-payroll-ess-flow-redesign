import React from 'react';

import { render } from '@testing-library/react';
import { vi, describe, it, beforeEach, expect } from 'vitest';

import PDFViewer from '../../../components/shared/PDFViewer';

// pdfjs-dist is heavy and depends on web APIs jsdom doesn't provide. Stub it.
vi.mock('pdfjs-dist', () => ({
    GlobalWorkerOptions: { workerSrc: '' },
    getDocument: vi.fn(() => ({
        promise: Promise.resolve({
            numPages: 1,
            getPage: vi.fn(() =>
                Promise.resolve({
                    getViewport: vi.fn(() => ({ width: 100, height: 100 })),
                    render: vi.fn(() => ({ promise: Promise.resolve() })),
                })
            ),
        }),
    })),
}));

beforeEach(() => {
    vi.clearAllMocks();
});

describe('PDFViewer', () => {
    it('renders nothing visible when no file/document is provided', () => {
        const { container } = render(<PDFViewer />);
        // The component returns an empty fragment when no document and no file —
        // verify that the render did not throw.
        expect(container).toBeInTheDocument();
    });

    it('does not throw when given a fileName but no file', () => {
        expect(() => render(<PDFViewer fileName="agreement.pdf" />)).not.toThrow();
    });
});
