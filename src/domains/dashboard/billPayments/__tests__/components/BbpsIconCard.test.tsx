import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import BbpsIconCard from '../../components/BbpsIconCard';

vi.mock('react-svg', () => ({
    ReactSVG: ({ src }: any) => <span data-testid="svg" data-src={src} />,
}));

describe('BbpsIconCard', () => {
    it('renders the icon and title', () => {
        render(<BbpsIconCard icon="electricity.svg" title="Electricity Bill" />);
        expect(screen.getByTestId('svg')).toHaveAttribute('data-src', 'electricity.svg');
        expect(screen.getByText('Electricity Bill')).toBeInTheDocument();
    });

    it('hugs the icon width so the tile starts at its column edge instead of centring', () => {
        render(<BbpsIconCard icon="electricity.svg" title="Electricity Bill" />);
        const tile = screen.getByRole('button');
        expect(tile.className).toContain('w-[90px]');
        expect(tile.className).not.toContain('w-full');
    });

    it('renders the icon plate at exactly 90 by 90 pixels at every breakpoint', () => {
        render(<BbpsIconCard icon="electricity.svg" title="Electricity Bill" />);
        const plate = screen.getByTestId('svg').parentElement as HTMLElement;
        expect(plate.className).toContain('w-[90px]');
        expect(plate.className).toContain('h-[90px]');
        expect(plate.className).not.toMatch(/\bh-24\b|\bmin-w-\[5\.6rem\]|xxl:/);
    });

    it('keeps the label centred on the icon and on one line', () => {
        render(<BbpsIconCard icon="electricity.svg" title="Traffic Challan" />);
        const label = screen.getByText('Traffic Challan');
        expect(label.className).toContain('text-center');
        expect(label.className).toContain('whitespace-nowrap');
    });

    it('fires onClick when the tile is clicked', () => {
        const onClick = vi.fn();
        render(<BbpsIconCard icon="electricity.svg" title="Electricity Bill" onClick={onClick} />);
        fireEvent.click(screen.getByRole('button'));
        expect(onClick).toHaveBeenCalledTimes(1);
    });
});
