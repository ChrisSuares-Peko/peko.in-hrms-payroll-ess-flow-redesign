import { render, screen, fireEvent, act } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { describe, it, expect } from 'vitest';

import GiftCard from '../../components/GiftCard';

const mockGiftCard = {
    id: 1,
    image: 'https://example.com/sample-image.png',
    name: 'Amazon Gift Card',
    description: 'Use this gift card to shop on Amazon',
    loaded: true,
};

describe('GiftCard Component', () => {
    it('renders the component correctly', () => {
        render(
            <BrowserRouter>
                <GiftCard {...mockGiftCard} />
            </BrowserRouter>
        );

        expect(screen.getByRole('img')).toBeInTheDocument();
        expect(screen.getByText(mockGiftCard.name)).toBeInTheDocument();
        expect(screen.getByText(mockGiftCard.description)).toBeInTheDocument();
    });

    it('navigates to the correct URL when clicked', async () => {
        render(
            <BrowserRouter>
                <GiftCard {...mockGiftCard} />
            </BrowserRouter>
        );

        const link = screen.getByRole('link');
        expect(link).toHaveAttribute('href', `/gift-cards/details/${mockGiftCard.id}`);
    });

    it('uses fallback image when image fails to load', () => {
        render(
            <BrowserRouter>
                <GiftCard {...mockGiftCard} />
            </BrowserRouter>
        );

        const image = screen.getByRole('img');
        expect(image).toHaveAttribute('src', mockGiftCard.image);

        // Simulate image load failure
        fireEvent.error(image);

        expect(image).toHaveAttribute(
            'src',
            '/src/domains/dashboard/GiftCards/assets/images/default.png'
        );
    });

    it('shows skeleton loader when image is loading', () => {
        render(
            <BrowserRouter>
                <GiftCard {...mockGiftCard} />
            </BrowserRouter>
        );

        expect(screen.getByRole('img')).toBeInTheDocument();
    });

    it('applies hover effect correctly', async () => {
        render(
            <BrowserRouter>
                <GiftCard {...mockGiftCard} />
            </BrowserRouter>
        );
        const cardContainer = screen.getByRole('link');

        const hoverableDiv = cardContainer.querySelector('div.transition-transform');

        expect(hoverableDiv).toBeInTheDocument();

        await act(async () => {
            fireEvent.mouseEnter(hoverableDiv as HTMLElement);
        });

        expect(hoverableDiv).toHaveClass('transform scale-105');

        await act(async () => {
            fireEvent.mouseLeave(hoverableDiv as HTMLElement);
        });
        screen.debug();

        expect(hoverableDiv).not.toHaveClass('scale-105');
    });

    it('handles missing props gracefully', () => {
        render(
            <BrowserRouter>
                <GiftCard />
            </BrowserRouter>
        );

        expect(screen.queryByRole('img')).toBeInTheDocument();
        expect(screen.queryByText(mockGiftCard.name)).not.toBeInTheDocument(); // Shouldn't exist
        expect(screen.queryByText(mockGiftCard.description)).not.toBeInTheDocument(); // Shouldn't exist
    });
});
