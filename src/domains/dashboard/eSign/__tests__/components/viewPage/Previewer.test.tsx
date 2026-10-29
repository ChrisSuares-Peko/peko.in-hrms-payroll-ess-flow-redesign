import { render, screen } from '@testing-library/react';
import { Provider } from 'react-redux';
import { MemoryRouter } from 'react-router-dom';
import configureStore from 'redux-mock-store';
import { describe, it, expect, vi } from 'vitest';

import Previewer from '../../../components/viewPage/Previewer';

// ✅ Mock @react-pdf-viewer to avoid actual PDF rendering in tests
vi.mock('@react-pdf-viewer/core', () => ({
    Worker: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
    Viewer: () => <div data-testid="pdf-viewer">PDF Viewer</div>,
}));

vi.mock('@react-pdf-viewer/default-layout', () => ({
    defaultLayoutPlugin: () => ({}),
}));

const mockStore = configureStore();

describe('Previewer Component', () => {
    const renderComponent = (pdfUrl: string | null) => {
        const store = mockStore({
            reducer: {
                eSignDoc: {
                    document_url: pdfUrl,
                },
            },
        });

        return render(
            <Provider store={store}>
                <MemoryRouter>
                    <Previewer />
                </MemoryRouter>
            </Provider>
        );
    };

    it('does not show the PDF viewer if pdfUrl is null', () => {
        renderComponent(null);
        expect(screen.queryByTestId('pdf-viewer')).not.toBeInTheDocument();
    });

    it('renders the PDF viewer when pdfUrl is provided', () => {
        renderComponent('https://example.com/sample.pdf');
        expect(screen.getByTestId('pdf-viewer')).toBeInTheDocument();
    });
});
