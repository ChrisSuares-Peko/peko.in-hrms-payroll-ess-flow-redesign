import { render, screen, fireEvent } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { describe, it, expect, vi, beforeEach } from 'vitest';

import HeroBanner from '../../components/home/sections/HeroBanner';

const mockNavigate = vi.fn();

vi.mock('react-router-dom', async () => {
    const actual = await vi.importActual('react-router-dom');
    return { ...actual, useNavigate: () => mockNavigate };
});

describe('HeroBanner Component', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('renders the main heading', () => {
        render(
            <BrowserRouter>
                <HeroBanner />
            </BrowserRouter>
        );

        expect(
            screen.getByText(/Register Your Business with Government Benefits/i)
        ).toBeInTheDocument();
    });

    it('renders the subtitle description', () => {
        render(
            <BrowserRouter>
                <HeroBanner />
            </BrowserRouter>
        );

        expect(
            screen.getByText(/Access tax benefits, subsidies, and legal protection/i)
        ).toBeInTheDocument();
    });

    it('renders the "Explore services" button', () => {
        render(
            <BrowserRouter>
                <HeroBanner />
            </BrowserRouter>
        );

        expect(screen.getByRole('button', { name: /explore services/i })).toBeInTheDocument();
    });

    it('navigates to the explore page when button is clicked', () => {
        render(
            <BrowserRouter>
                <HeroBanner />
            </BrowserRouter>
        );

        fireEvent.click(screen.getByRole('button', { name: /explore services/i }));

        expect(mockNavigate).toHaveBeenCalledTimes(1);
        expect(mockNavigate).toHaveBeenCalledWith(expect.stringContaining('explore'));
    });
});
