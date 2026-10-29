import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import StatCard from '../../../components/shared/StatCard';

vi.mock('react-svg', () => ({
    ReactSVG: ({ src }: { src: string }) => <span data-testid="react-svg" data-src={src} />,
}));

describe('StatCard (shared)', () => {
    it('renders the value, label and icon', () => {
        render(<StatCard value="42" label="Paid" bgColor="#F8FAFC" icon="/icon.svg" />);
        expect(screen.getByText('42')).toBeInTheDocument();
        expect(screen.getByText('Paid')).toBeInTheDocument();
        expect(screen.getByTestId('react-svg')).toHaveAttribute('data-src', '/icon.svg');
    });
});
