import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { describe, expect, it, vi } from 'vitest';

import Card from '../../components/Card';

vi.mock('react-svg', () => ({
    ReactSVG: ({ src }: any) => <img data-testid="card-icon" src={src} alt="icon" />,
}));

const renderCard = (props = {}) =>
    render(
        <MemoryRouter>
            <Card icon="/icons/visa.svg" title="Visa" path="/visa" status="Free" {...props} />
        </MemoryRouter>
    );

describe('Card Component', () => {
    it('should render the title and status', () => {
        renderCard();
        expect(screen.getByText('Visa')).toBeInTheDocument();
        expect(screen.getByText('Free')).toBeInTheDocument();
    });

    it('should render the icon', () => {
        renderCard();
        expect(screen.getByTestId('card-icon')).toBeInTheDocument();
    });

    it('should render a link with the correct path', () => {
        renderCard({ path: '/corporate-travel/visa' });
        const link = screen.getByRole('link');
        expect(link).toHaveAttribute('href', '/corporate-travel/visa');
    });

    it('should render "New" status correctly', () => {
        renderCard({ status: 'New', title: 'Hotels' });
        expect(screen.getByText('New')).toBeInTheDocument();
    });

    it('should render "Coming soon" status correctly', () => {
        renderCard({ status: 'Coming soon', title: 'Flights' });
        expect(screen.getByText('Coming soon')).toBeInTheDocument();
    });
});
