import React from 'react';

import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter, useNavigate } from 'react-router-dom';
import { describe, beforeEach, test, expect, vi, Mock } from 'vitest';

import { useGenerateEmbeddedSignupURL } from '../../hooks/useGenerateEmbeddedSignupURL';
import GetAllProjects from '../../hooks/useGetProjects';
import useWccPayment from '../../hooks/useWccPayment';
import LandingPage from '../../pages/LandingPage';

vi.mock('../../hooks/useSSOLogin', () => ({
    __esModule: true,
    default: vi.fn(() => ({
        handleSsoLogin: vi.fn(),
        isLoading: false,
    })),
}));

vi.mock('../../hooks/useGenerateEmbeddedSignupURL', () => ({
    __esModule: true,
    useGenerateEmbeddedSignupURL: vi.fn(() => ({
        generateURL: vi.fn(),
        isLoading: false,
    })),
}));

vi.mock('../../hooks/useWccPayment', () => ({
    __esModule: true,
    default: vi.fn(() => ({
        handleSubmission: vi.fn(),
    })),
}));

vi.mock('../../hooks/useGetProjects', () => ({
    __esModule: true,
    default: vi.fn(),
}));

vi.mock('react-router-dom', async () => {
    const actual = await vi.importActual('react-router-dom');
    return {
        ...actual,
        useNavigate: vi.fn(),
    };
});

describe('LandingPage Component', () => {
    let mockNavigate: any;

    beforeEach(() => {
        mockNavigate = vi.fn();

        vi.clearAllMocks();
        (useNavigate as unknown as any).mockReturnValue(mockNavigate);
    });

    test('renders skeleton loader when loading', () => {
        (GetAllProjects as Mock).mockReturnValue({ isLoading: true });

        render(
            <BrowserRouter>
                <LandingPage />
            </BrowserRouter>
        );

        expect(document.querySelector('.ant-skeleton')).toBeInTheDocument();
    });

    test('renders heading and subscription details', async () => {
        (GetAllProjects as Mock).mockReturnValue({
            isLoading: false,
            projectData: [
                {
                    id: '123',
                    status: 'active',
                    credit: 500,
                    plan_renewal_on: '2025-02-12',
                    is_whatsapp_verified: true,
                },
            ],
        });

        render(
            <BrowserRouter>
                <LandingPage />
            </BrowserRouter>
        );

        expect(await screen.findByText(/WhatsApp for Business/i)).toBeInTheDocument();
        expect(screen.getByText(/Balance:/i)).toBeInTheDocument();
        expect(screen.getByText('INR 500')).toBeInTheDocument();
        expect(screen.getByText(/Expires on \$2025-02-12/i)).toBeInTheDocument();
    });

    test('calls handleApplyNowClick when "Verify your WABA Account" button is clicked', async () => {
        const generateURLMock = vi
            .fn()
            .mockResolvedValue({ embeddedSignupURL: 'https://example.com' });
        (useGenerateEmbeddedSignupURL as Mock).mockReturnValue({
            generateURL: generateURLMock,
            isLoading: false,
        });

        (GetAllProjects as Mock).mockReturnValue({
            isLoading: false,
            projectData: [{ id: '123', is_whatsapp_verified: false }],
        });

        render(
            <BrowserRouter>
                <LandingPage />
            </BrowserRouter>
        );

        const verifyButton = screen.getByText(/Verify your WABA Account/i);
        fireEvent.click(verifyButton);

        await waitFor(() => expect(generateURLMock).toHaveBeenCalledWith('123'));
    });

    test('updates amount input field correctly', async () => {
        (GetAllProjects as Mock).mockReturnValue({
            isLoading: false,
            projectData: [{ id: '123', credit: 500 }],
        });

        render(
            <BrowserRouter>
                <LandingPage />
            </BrowserRouter>
        );

        const inputField = screen.getByPlaceholderText(/Please enter amount/i);
        fireEvent.change(inputField, { target: { value: '200' } });

        expect((inputField as HTMLInputElement).value).toBe('200');
    });

    test('does not update amount field for invalid values', async () => {
        (GetAllProjects as Mock).mockReturnValue({
            isLoading: false,
            projectData: [{ id: '123', credit: 500 }],
        });

        render(
            <BrowserRouter>
                <LandingPage />
            </BrowserRouter>
        );

        const inputField = screen.getByPlaceholderText(/Please enter amount/i);
        fireEvent.change(inputField, { target: { value: 'abc' } });

        expect((inputField as HTMLInputElement).value).toBe('');
    });

    test('predefined amount buttons update the input field', async () => {
        (GetAllProjects as Mock).mockReturnValue({
            isLoading: false,
            projectData: [{ id: '123', credit: 500 }],
        });

        render(
            <BrowserRouter>
                <LandingPage />
            </BrowserRouter>
        );

        const button100 = screen.getByText('INR 100');
        fireEvent.click(button100);

        const inputField = screen.getByPlaceholderText(/Please enter amount/i);
        expect((inputField as HTMLInputElement).value).toBe('100');
    });

    test('handles form submission correctly', async () => {
        const handleSubmissionMock = vi.fn();
        (useWccPayment as Mock).mockReturnValue({ handleSubmission: handleSubmissionMock });

        (GetAllProjects as Mock).mockReturnValue({
            isLoading: false,
            projectData: [{ id: '123', credit: 500 }],
        });

        render(
            <BrowserRouter>
                <LandingPage />
            </BrowserRouter>
        );

        const inputField = screen.getByPlaceholderText(/Please enter amount/i);
        fireEvent.change(inputField, { target: { value: '500' } });

        const topUpButton = screen.getByText(/Top-Up Now/i);
        fireEvent.click(topUpButton);

        await waitFor(() => expect(handleSubmissionMock).toHaveBeenCalledWith('500', '123'));
    });

    test('navigates to subscription page on clicking Manage Subscription', async () => {
        render(
            <BrowserRouter>
                <LandingPage />
            </BrowserRouter>
        );

        const subscriptionSection = screen.getByText(/Manage Subscription/i);
        fireEvent.click(subscriptionSection);

        expect(mockNavigate).toHaveBeenCalledWith('subscription');
    });
});
