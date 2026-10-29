import { render, screen, fireEvent } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { describe, it, expect } from 'vitest';

import marketPlaceDefaultImage from '@domains/dashboard/Connect/assets/icons/marketPlaceDefaultImage.svg';

import ConnectListCard from '../components/ConnectListCard';

describe('ConnectListCard Component', () => {
    const mockProps = {
        id: 1,
        title: 'Test Service',
        description: 'This is a test service description.',
        offer: '10% Discount',
        image: 'https://example.com/logo.png',
    };

    it('renders the card with title, description, and offer', () => {
        render(
            <MemoryRouter>
                <ConnectListCard {...mockProps} />
            </MemoryRouter>
        );

        expect(screen.getByText('Test Service')).toBeInTheDocument();
        expect(screen.getByText('This is a test service description.')).toBeInTheDocument();
        expect(screen.getByText('10% Discount')).toBeInTheDocument();
    });

    it('renders the correct image', () => {
        render(
            <MemoryRouter>
                <ConnectListCard {...mockProps} />
            </MemoryRouter>
        );

        const image = screen.getByAltText('logo') as HTMLImageElement;
        expect(image).toBeInTheDocument();
        expect(image.src).toBe(mockProps.image);
    });

    it('falls back to default image if image fails to load', () => {
        render(
            <MemoryRouter>
                <ConnectListCard {...mockProps} />
            </MemoryRouter>
        );

        const image = screen.getByAltText('logo') as HTMLImageElement;
        fireEvent.error(image); // Simulating image load failure
        expect(image.src).toContain(marketPlaceDefaultImage);
    });

    it('links to the correct details page', () => {
        render(
            <MemoryRouter>
                <ConnectListCard {...mockProps} />
            </MemoryRouter>
        );

        const link = screen.getByRole('link') as HTMLAnchorElement;
        expect(link.href).toContain(`/details/${mockProps.id}`);
    });
});
