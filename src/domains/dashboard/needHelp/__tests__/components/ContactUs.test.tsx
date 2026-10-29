import '@testing-library/jest-dom/vitest';
import { render, screen } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { vi, describe, it, expect } from 'vitest';

import ContactUs from '../../components/ContactUs';

vi.mock('../../hooks/useEnableProductTour', () => ({
    default: vi.fn(() => ({ handleUpdateTour: vi.fn() })),
}));

vi.mock('@src/hooks/useScreenSize', () => ({
    default: vi.fn(() => ({ md: true, xs: false })),
}));

describe('ContactUs Component', () => {
    it('renders the Help Center text', () => {
        render(
            <BrowserRouter>
                <ContactUs />
            </BrowserRouter>
        );
        expect(screen.getByText(/Help Center/i)).toBeInTheDocument();
    });

    it('renders contact options', () => {
        render(
            <BrowserRouter>
                <ContactUs />
            </BrowserRouter>
        );
        expect(screen.getByText(/Call Us at/i)).toBeInTheDocument();
        expect(screen.getByText(/Write to us on/i)).toBeInTheDocument();
        expect(screen.getByText(/Chat with us on/i)).toBeInTheDocument();
    });

    it('renders the FAQ section', () => {
        render(
            <BrowserRouter>
                <ContactUs />
            </BrowserRouter>
        );
        expect(screen.getByText(/FAQ/i)).toBeInTheDocument();
    });

    it('links every FAQ category to its FAQ page', () => {
        render(
            <BrowserRouter>
                <ContactUs />
            </BrowserRouter>
        );
        const categories = [
            'Mobile Recharge',
            'Bill Payments',
            'Corporate Travel',
            'Verification Suite',
            'WhatsApp for Business',
            'Turbo',
            'eSign',
            'Payroll',
            'eSIM',
            'General',
        ];

        categories.forEach(category => {
            expect(screen.getByRole('link', { name: category })).toHaveAttribute(
                'href',
                `/need-help/frequently-asked-questions?faqCategory=${encodeURIComponent(category)}`
            );
        });
    });

    it('renders the product tour button when md screen is active', () => {
        render(
            <BrowserRouter>
                <ContactUs />
            </BrowserRouter>
        );
        expect(screen.getByText(/Give me a product tour/i)).toBeInTheDocument();
    });
});
