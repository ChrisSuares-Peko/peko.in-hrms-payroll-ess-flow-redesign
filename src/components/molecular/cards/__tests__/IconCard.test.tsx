import '@testing-library/jest-dom/vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import IconCard from '../IconCard';

vi.mock('react-svg', () => ({
    ReactSVG: ({ src }: any) => <span data-testid="svg" data-src={src} />,
}));

describe('IconCard', () => {
    it('renders the icon and title', () => {
        render(<IconCard icon="prepaid.svg" title="Prepaid" />);
        expect(screen.getByTestId('svg')).toHaveAttribute('data-src', 'prepaid.svg');
        expect(screen.getByText('Prepaid')).toBeInTheDocument();
    });

    it('keeps the class-driven dimensions when no size is given', () => {
        render(<IconCard icon="prepaid.svg" title="Prepaid" />);
        const tile = screen.getByRole('button');
        expect(tile.className).toContain('h-24');
        expect(tile.style.width).toBe('');
        expect(tile.style.height).toBe('');
        expect(tile.style.minWidth).toBe('');
    });

    it('pins the tile to an exact square when a size is given', () => {
        render(<IconCard icon="prepaid.svg" title="Prepaid" size={90} />);
        const tile = screen.getByRole('button');
        expect(tile.style.width).toBe('90px');
        expect(tile.style.height).toBe('90px');
        expect(tile.style.minWidth).toBe('90px');
    });

    it('renders a fixed-size image instead of an inline SVG when an image size is given', () => {
        const { container } = render(
            <IconCard
                icon="gift-cards.png"
                title="Gift Cards"
                imageSize={{ width: 88, height: 58 }}
            />
        );
        const image = container.querySelector('img');
        expect(screen.queryByTestId('svg')).not.toBeInTheDocument();
        expect(image).toHaveAttribute('src', 'gift-cards.png');
        expect(image).toHaveAttribute('width', '88');
        expect(image).toHaveAttribute('height', '58');
    });

    it('fires onClick from both the tile and the label', () => {
        const onClick = vi.fn();
        render(<IconCard icon="prepaid.svg" title="Prepaid" onClick={onClick} />);
        fireEvent.click(screen.getByRole('button'));
        fireEvent.click(screen.getByText('Prepaid'));
        expect(onClick).toHaveBeenCalledTimes(2);
    });
});
