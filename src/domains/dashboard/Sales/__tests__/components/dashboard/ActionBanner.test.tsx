import React from 'react';

import { render, screen, fireEvent } from '@testing-library/react';
import { vi, describe, it, expect } from 'vitest';

import ActionBanner from '../../../components/dashboard/ActionBanner';

vi.mock('react-svg', () => ({
    ReactSVG: ({ src }: { src: string }) => <span data-testid="svg" data-src={src} />,
}));

describe('ActionBanner', () => {
    it('renders icon, label and button text', () => {
        render(
            <ActionBanner
                icon="/global.svg"
                label="Activate International Payments"
                buttonLabel="Activate Now"
            />
        );

        expect(screen.getByTestId('svg')).toHaveAttribute('data-src', '/global.svg');
        expect(screen.getByText('Activate International Payments')).toBeInTheDocument();
        expect(screen.getByRole('button', { name: /activate now/i })).toBeInTheDocument();
    });

    it('invokes onClick when the button is pressed', () => {
        const onClick = vi.fn();
        render(<ActionBanner icon="/i.svg" label="L" buttonLabel="Go" onClick={onClick} />);

        fireEvent.click(screen.getByRole('button', { name: /go/i }));
        expect(onClick).toHaveBeenCalled();
    });

    it('does not throw when onClick is omitted', () => {
        render(<ActionBanner icon="/i.svg" label="L" buttonLabel="Go" />);

        expect(() => fireEvent.click(screen.getByRole('button', { name: /go/i }))).not.toThrow();
    });
});
