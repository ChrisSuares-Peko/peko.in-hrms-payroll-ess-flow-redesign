import { fireEvent, render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import ConsultExpertCard from '../../components/ConsultExpertCard';

vi.mock('../../components/RequestCallbackModal', () => ({
    default: ({ open, onClose }: { open: boolean; onClose: () => void }) => (
        <div data-testid="callback-modal" data-open={String(open)}>
            <button type="button" onClick={onClose}>
                close-modal
            </button>
        </div>
    ),
}));

const modal = () => screen.getByTestId('callback-modal');

describe('ConsultExpertCard', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('renders the heading, copy and Expert assistance button', () => {
        render(<ConsultExpertCard />);

        expect(screen.getByText('Consult expert')).toBeInTheDocument();
        expect(screen.getByText('Consult an expert to walk you through the process:')).toBeInTheDocument();
        expect(screen.getByRole('button', { name: /Expert assistance/ })).toBeInTheDocument();
    });

    it('keeps the callback modal closed initially', () => {
        render(<ConsultExpertCard />);

        expect(modal()).toHaveAttribute('data-open', 'false');
    });

    it('opens the callback modal on Expert assistance and closes it via onClose', () => {
        render(<ConsultExpertCard />);

        fireEvent.click(screen.getByRole('button', { name: /Expert assistance/ }));
        expect(modal()).toHaveAttribute('data-open', 'true');

        fireEvent.click(screen.getByRole('button', { name: 'close-modal' }));
        expect(modal()).toHaveAttribute('data-open', 'false');
    });
});
