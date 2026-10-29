import { render, screen, fireEvent } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import ComingSoonModal from '../../../components/shared/ComingSoonModal';

describe('ComingSoonModal', () => {
    it('renders title, description and Got it button when open', () => {
        render(
            <ComingSoonModal open onClose={vi.fn()} title="Coming Soon" description="Stay tuned" />
        );

        expect(screen.getByText('Coming Soon')).toBeInTheDocument();
        expect(screen.getByText('Stay tuned')).toBeInTheDocument();
        expect(screen.getByRole('button', { name: /Got it/i })).toBeInTheDocument();
    });

    it('fires onClose when Got it is clicked', () => {
        const onClose = vi.fn();
        render(<ComingSoonModal open onClose={onClose} title="t" description="d" />);
        fireEvent.click(screen.getByRole('button', { name: /Got it/i }));
        expect(onClose).toHaveBeenCalledTimes(1);
    });

    it('is not in DOM when open is false', () => {
        render(<ComingSoonModal open={false} onClose={vi.fn()} title="t" description="d" />);
        expect(screen.queryByText('t')).not.toBeInTheDocument();
    });
});
