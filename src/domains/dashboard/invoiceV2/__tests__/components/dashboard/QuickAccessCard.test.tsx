import { render, screen, fireEvent } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import QuickAccessCard from '../../../components/dashboard/QuickAccessCard';

vi.mock('react-svg', () => ({
    ReactSVG: ({ src }: { src: string }) => <span data-testid="react-svg" data-src={src} />,
}));

describe('QuickAccessCard', () => {
    it('renders label and icon', () => {
        render(<QuickAccessCard icon="/i.svg" label="Create" />);
        expect(screen.getByText('Create')).toBeInTheDocument();
        expect(screen.getByTestId('react-svg')).toHaveAttribute('data-src', '/i.svg');
    });

    it('calls onClick when clicked', () => {
        const onClick = vi.fn();
        render(<QuickAccessCard icon="/i.svg" label="Create" onClick={onClick} />);
        fireEvent.click(screen.getByRole('button'));
        expect(onClick).toHaveBeenCalled();
    });

    it('does not call onClick when disabled', () => {
        const onClick = vi.fn();
        render(<QuickAccessCard icon="/i.svg" label="X" onClick={onClick} disabled />);
        fireEvent.click(screen.getByText('X'));
        expect(onClick).not.toHaveBeenCalled();
    });
});
