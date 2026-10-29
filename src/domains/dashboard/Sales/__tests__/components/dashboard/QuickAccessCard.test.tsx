import React from 'react';

import { render, screen, fireEvent } from '@testing-library/react';
import { vi, describe, it, expect } from 'vitest';

import QuickAccessCard from '../../../components/dashboard/QuickAccessCard';

vi.mock('react-svg', () => ({
    ReactSVG: ({ src }: { src: string }) => <span data-testid="svg" data-src={src} />,
}));

describe('QuickAccessCard', () => {
    it('renders icon and label', () => {
        render(<QuickAccessCard icon="/i.svg" label="Create Invoice" />);

        expect(screen.getByText('Create Invoice')).toBeInTheDocument();
        expect(screen.getByTestId('svg')).toHaveAttribute('data-src', '/i.svg');
    });

    it('invokes onClick when clicked (enabled)', () => {
        const onClick = vi.fn();
        render(<QuickAccessCard icon="/i.svg" label="Go" onClick={onClick} />);

        fireEvent.click(screen.getByRole('button'));
        expect(onClick).toHaveBeenCalled();
    });

    it('does not invoke onClick when disabled', () => {
        const onClick = vi.fn();
        render(<QuickAccessCard icon="/i.svg" label="Go" onClick={onClick} disabled />);

        // role="button" is removed when disabled, so click via the label.
        fireEvent.click(screen.getByText('Go'));
        expect(onClick).not.toHaveBeenCalled();
    });

    it('triggers onClick on Enter and Space key when enabled', () => {
        const onClick = vi.fn();
        render(<QuickAccessCard icon="/i.svg" label="Go" onClick={onClick} />);

        const button = screen.getByRole('button');
        fireEvent.keyDown(button, { key: 'Enter' });
        fireEvent.keyDown(button, { key: ' ' });
        expect(onClick).toHaveBeenCalledTimes(2);
    });

    it('does not trigger onClick on other keys', () => {
        const onClick = vi.fn();
        render(<QuickAccessCard icon="/i.svg" label="Go" onClick={onClick} />);

        fireEvent.keyDown(screen.getByRole('button'), { key: 'a' });
        expect(onClick).not.toHaveBeenCalled();
    });

    it('exposes role=button only when enabled', () => {
        const { rerender } = render(<QuickAccessCard icon="/i.svg" label="Go" />);
        expect(screen.getByRole('button')).toBeInTheDocument();

        rerender(<QuickAccessCard icon="/i.svg" label="Go" disabled />);
        expect(screen.queryByRole('button')).not.toBeInTheDocument();
    });
});
