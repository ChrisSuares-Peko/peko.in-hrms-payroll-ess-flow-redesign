import { render, screen, fireEvent } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import CorporateTravelCard from '../../components/CorporateTravelCard';

vi.mock('react-router-dom', async () => {
    const actual = await vi.importActual<any>('react-router-dom');
    return { ...actual, useNavigate: () => vi.fn() };
});

vi.mock('@src/routes/paths', () => ({
    paths: { esim: { index: '/esim' } },
}));

const mockHandleChange = vi.fn();

const renderCard = (selectedType = '1') =>
    render(
        <MemoryRouter>
            <CorporateTravelCard handleChange={mockHandleChange} selectedType={selectedType} />
        </MemoryRouter>
    );

describe('CorporateTravelCard Component', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('should render all four travel service options', () => {
        renderCard();
        expect(screen.getByText('Air Ticket')).toBeInTheDocument();
        expect(screen.getByText('Hotel Booking')).toBeInTheDocument();
        expect(screen.getByText('Travel eSIM')).toBeInTheDocument();
        expect(screen.getByText('Visa')).toBeInTheDocument();
    });

    it('should call handleChange with "1" when Air Ticket is clicked', () => {
        renderCard();
        fireEvent.click(screen.getByText('Air Ticket'));
        expect(mockHandleChange).toHaveBeenCalledWith('1');
    });

    it('should call handleChange with "2" when Hotel Booking is clicked', () => {
        renderCard();
        fireEvent.click(screen.getByText('Hotel Booking'));
        expect(mockHandleChange).toHaveBeenCalledWith('2');
    });

    it('should call handleChange with "4" when Visa is clicked', () => {
        renderCard();
        fireEvent.click(screen.getByText('Visa'));
        expect(mockHandleChange).toHaveBeenCalledWith('4');
    });

    it('should render images for each service', () => {
        renderCard();
        expect(screen.getByAltText('Air Ticket')).toBeInTheDocument();
        expect(screen.getByAltText('Hotel Booking')).toBeInTheDocument();
        expect(screen.getByAltText('Travel eSIM')).toBeInTheDocument();
        expect(screen.getByAltText('Visa')).toBeInTheDocument();
    });
});
