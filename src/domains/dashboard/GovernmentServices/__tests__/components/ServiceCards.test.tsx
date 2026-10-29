import { render, screen, fireEvent } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { beforeEach, describe, expect, it, Mock, vi } from 'vitest';

import { useAppDispatch, useAppSelector } from '@src/hooks/store';

import ServiceCards from '../../components/home/sections/ServiceCards';
import { Service } from '../../types';

const mockNavigate = vi.fn();
const mockDispatch = vi.fn();

vi.mock('react-router-dom', async () => {
    const actual = await vi.importActual('react-router-dom');
    return { ...actual, useNavigate: () => mockNavigate };
});

vi.mock('@src/hooks/store', () => ({
    useAppSelector: vi.fn(),
    useAppDispatch: vi.fn(),
}));

const mockServicesList: Service[] = [
    {
        id: 1,
        name: 'MSME Registration',
        slug: 'msme-registration',
        accessKey: 'govt_msme',
        description: 'Register MSME',
        category: 'Registration',
        tab: 'Mandatory',
        duration: '2-5 days',
        price: 999,
        govtFee: 'Free',
    },
    {
        id: 2,
        name: 'Trademark Registration',
        slug: 'trademark',
        accessKey: 'govt_trademark',
        description: 'Protect brand',
        category: 'Registration',
        tab: 'Mandatory',
        duration: '12-18 months',
        price: 4999,
        govtFee: 4500,
    },
];

describe('ServiceCards Component', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        (useAppDispatch as Mock).mockReturnValue(mockDispatch);
        (useAppSelector as Mock).mockReturnValue(mockServicesList);
    });

    it('renders the MSME promotional card', () => {
        render(
            <BrowserRouter>
                <ServiceCards />
            </BrowserRouter>
        );

        expect(screen.getByText(/MSME benefits/i)).toBeInTheDocument();
        expect(screen.getByText(/collateral-free loans/i)).toBeInTheDocument();
    });

    it('renders the Trademark promotional card', () => {
        render(
            <BrowserRouter>
                <ServiceCards />
            </BrowserRouter>
        );

        expect(screen.getByText(/Protect your brand with Trademark/i)).toBeInTheDocument();
        expect(screen.getByText(/exclusive rights/i)).toBeInTheDocument();
    });

    it('renders "Learn more" for each card', () => {
        render(
            <BrowserRouter>
                <ServiceCards />
            </BrowserRouter>
        );

        const learnMoreLinks = screen.getAllByText(/learn more/i);
        expect(learnMoreLinks).toHaveLength(2);
    });

    it('dispatches setSelectedService and navigates when MSME "Learn more" is clicked', () => {
        render(
            <BrowserRouter>
                <ServiceCards />
            </BrowserRouter>
        );

        const learnMoreLinks = screen.getAllByText(/learn more/i);
        fireEvent.click(learnMoreLinks[0]);

        expect(mockDispatch).toHaveBeenCalled();
        expect(mockNavigate).toHaveBeenCalledWith(expect.stringContaining('1'));
    });

    it('dispatches setSelectedService and navigates when Trademark "Learn more" is clicked', () => {
        render(
            <BrowserRouter>
                <ServiceCards />
            </BrowserRouter>
        );

        const learnMoreLinks = screen.getAllByText(/learn more/i);
        fireEvent.click(learnMoreLinks[1]);

        expect(mockDispatch).toHaveBeenCalled();
        expect(mockNavigate).toHaveBeenCalledWith(expect.stringContaining('2'));
    });

    it('does not dispatch or navigate when service is not found in the list', () => {
        (useAppSelector as Mock).mockReturnValue([]);

        render(
            <BrowserRouter>
                <ServiceCards />
            </BrowserRouter>
        );

        const learnMoreLinks = screen.getAllByText(/learn more/i);
        fireEvent.click(learnMoreLinks[0]);

        expect(mockDispatch).not.toHaveBeenCalled();
        expect(mockNavigate).not.toHaveBeenCalled();
    });
});
