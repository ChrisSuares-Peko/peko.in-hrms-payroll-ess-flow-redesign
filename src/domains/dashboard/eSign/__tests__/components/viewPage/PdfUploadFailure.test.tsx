import { render, screen, fireEvent } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { describe, it, expect, vi, beforeEach } from 'vitest';

import { paths } from '@src/routes/paths';

import PdfUploadFailure from '../../../components/viewPage/PdfUploadFailure';

// ✅ Mock `ReactSVG` to avoid SVG-related errors
vi.mock('react-svg', () => ({
    ReactSVG: () => <svg data-testid="pdf-failure-icon" />,
}));

// ✅ Mock `useNavigate` correctly
const mockNavigate = vi.fn();

vi.mock('react-router-dom', async () => {
    const actual = await vi.importActual('react-router-dom');
    return {
        ...actual,
        useNavigate: () => mockNavigate,
    };
});

describe('PdfUploadFailure Component', () => {
    beforeEach(() => {
        vi.clearAllMocks(); // Reset mock functions before each test
    });

    const renderComponent = () =>
        render(
            <MemoryRouter>
                <PdfUploadFailure />
            </MemoryRouter>
        );

    it('renders the component correctly', () => {
        renderComponent();

        expect(screen.getByTestId('pdf-failure-icon')).toBeInTheDocument();
        expect(screen.getByText(/Document Could Not Be Opened/i)).toBeInTheDocument();
        expect(
            screen.getByText(
                /The document you uploaded appears to be corrupted or damaged and cannot be viewed./i
            )
        ).toBeInTheDocument();
        expect(screen.getByRole('button', { name: /Try Again/i })).toBeInTheDocument();
    });

    it('navigates to the retry page when "Try Again" is clicked', () => {
        renderComponent();
        const tryAgainButton = screen.getByRole('button', { name: /Try Again/i });

        fireEvent.click(tryAgainButton);

        expect(mockNavigate).toHaveBeenCalledWith(paths.dashboard.eSign);
    });
});
