import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { vi, describe, beforeEach, it, expect, Mock } from 'vitest';

import { useAppSelector } from '@src/hooks/store';

import { useGenerateEmbeddedSignupURL } from '../../hooks/useGenerateEmbeddedSignupURL';
import GetAllProjects from '../../hooks/useGetProjects';
import PaymentSuccess from '../../pages/PaymentSuccessPage';

const mockDispatch = vi.fn();

vi.mock('@src/hooks/store', () => ({
    useAppDispatch: () => mockDispatch,
    useAppSelector: vi.fn(),
}));
vi.mock('../../hooks/useGenerateEmbeddedSignupURL', () => ({
    useGenerateEmbeddedSignupURL: vi.fn(() => ({
        generateURL: vi.fn(),
        isLoading: false,
    })),
}));

// Mock `GetAllProjects`
vi.mock('../../hooks/useGetProjects', () => ({
    __esModule: true,
    default: vi.fn(),
}));
const mockUseAppSelector = useAppSelector as Mock;

describe('PaymentSuccess Page', () => {
    beforeEach(() => {
        mockUseAppSelector.mockReturnValue({ role: 'admin', id: '123' });
        vi.clearAllMocks();
    });

    it('should render PaymentSuccess message', () => {
        (GetAllProjects as Mock).mockReturnValue({
            projectData: [{ id: 'project-123', credit: 500 }],
            isLoading: false,
        });

        render(
            <BrowserRouter>
                <PaymentSuccess />
            </BrowserRouter>
        );

        expect(
            screen.getByText('You have successfully purchased WhatsApp for business plan')
        ).toBeInTheDocument();
    });

    it('should display "Verify your WABA Account" button', () => {
        (GetAllProjects as Mock).mockReturnValue({
            projectData: [{ id: 'project-123', credit: 500 }],
            isLoading: false,
        });

        render(
            <BrowserRouter>
                <PaymentSuccess />
            </BrowserRouter>
        );

        expect(screen.getByText('Verify your WABA Account')).toBeInTheDocument();
    });

    it('should call handleApplyNowClick when clicking "Verify your WABA Account"', async () => {
        const mockGenerateURL = vi.fn().mockResolvedValue({
            embeddedSignupURL: 'https://test-url.com',
        });

        (useGenerateEmbeddedSignupURL as Mock).mockReturnValue({
            generateURL: mockGenerateURL,
            isLoading: false,
        });

        (GetAllProjects as Mock).mockReturnValue({
            projectData: [{ id: 'project-123', credit: 500 }],
            isLoading: false,
        });

        render(
            <BrowserRouter>
                <PaymentSuccess />
            </BrowserRouter>
        );

        const button = screen.getByText('Verify your WABA Account');
        fireEvent.click(button);

        await waitFor(() => {
            expect(mockGenerateURL).toHaveBeenCalledWith('project-123');
        });
    });

    it('should redirect to the WFB dashboard when clicking "Go to WFB dashboard"', () => {
        (GetAllProjects as Mock).mockReturnValue({
            projectData: [{ id: 'project-123', credit: 500 }],
            isLoading: false,
        });

        render(
            <BrowserRouter>
                <PaymentSuccess />
            </BrowserRouter>
        );
        const link = screen.getByText('Go to WFB dashboard').closest('a'); // Ensure we get the anchor element

        expect(link).toHaveAttribute('href', '/more-services/more-services/whatsApp-for-business'); // Match actual href
    });
});
