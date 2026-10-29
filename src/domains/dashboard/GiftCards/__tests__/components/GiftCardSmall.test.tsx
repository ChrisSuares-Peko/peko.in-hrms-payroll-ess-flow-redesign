import { render, screen } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { describe, it, expect } from 'vitest';

import GiftCardSmall from '../../components/GiftCardSmall';

const mockGiftCard = {
    id: 1,
    image: 'https://example.com/sample-image.png',
    name: 'Amazon Gift Card',
    description: 'Use this gift card to shop on Amazon',
};

describe('GiftCardSmall Component', () => {
    it('renders the component correctly', () => {
        render(
            <BrowserRouter>
                <GiftCardSmall {...mockGiftCard} />
            </BrowserRouter>
        );

        expect(screen.getByRole('img')).toBeInTheDocument();
        expect(screen.getByText(mockGiftCard.name)).toBeInTheDocument();
        expect(screen.getByText(mockGiftCard.description)).toBeInTheDocument();
    });

    it('navigates to the correct URL when clicked', async () => {
        render(
            <BrowserRouter>
                <GiftCardSmall {...mockGiftCard} />
            </BrowserRouter>
        );

        const link = screen.getByRole('link');
        expect(link).toHaveAttribute('href', `/gift-cards/details/${mockGiftCard.id}`);
    });

    it('uses fallback image when image fails to load', () => {
        render(
            <BrowserRouter>
                <GiftCardSmall {...mockGiftCard} />
            </BrowserRouter>
        );
        const image = screen.getByRole('img');
        expect(image).toHaveAttribute('src', mockGiftCard.image);

        // Simulate image load failure
        image.dispatchEvent(new Event('error'));

        expect(image).toHaveAttribute('src', mockGiftCard.image);
    });

    it('handles missing props gracefully', () => {
        render(
            <BrowserRouter>
                <GiftCardSmall />
            </BrowserRouter>
        );

        expect(screen.queryByRole('img')).toBeInTheDocument();
        expect(screen.queryByText(/amazon gift card/i)).not.toBeInTheDocument(); // Shouldn't exist
        expect(screen.queryByText(/use this gift card/i)).not.toBeInTheDocument(); // Shouldn't exist
    });
});
