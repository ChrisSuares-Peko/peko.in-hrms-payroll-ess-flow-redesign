import { render } from '@testing-library/react';
import { beforeAll, describe, expect, it, vi } from 'vitest';

import PDFAllPages from '../../../components/invoiceDetails/PDFAllPages';

beforeAll(() => {
    global.ResizeObserver = vi.fn().mockImplementation(() => ({
        observe: vi.fn(),
        unobserve: vi.fn(),
        disconnect: vi.fn(),
    })) as unknown as typeof ResizeObserver;
});

vi.mock('pdfjs-dist', () => ({
    getDocument: vi.fn(() => ({
        promise: Promise.resolve({
            numPages: 0,
            getPage: vi.fn(),
        }),
    })),
    GlobalWorkerOptions: { workerSrc: '' },
}));

describe('PDFAllPages', () => {
    it('renders the container and a loading spinner initially', () => {
        const { container } = render(
            <PDFAllPages fileUrl="" onPageCountChange={vi.fn()} onPageChange={vi.fn()} />
        );
        expect(container.querySelector('.ant-spin')).toBeTruthy();
    });
});
