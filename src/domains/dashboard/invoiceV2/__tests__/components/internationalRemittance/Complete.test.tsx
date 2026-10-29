import { render, screen, fireEvent } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import Complete from '../../../components/internationalRemittance/Complete';

describe('Complete (international remittance)', () => {
    it('renders submission confirmation copy', () => {
        render(<Complete onClose={vi.fn()} />);
        expect(screen.getByText('Application Submitted!')).toBeInTheDocument();
        expect(screen.getByText('Review in Progress')).toBeInTheDocument();
        expect(screen.getByText('What Happens Next?')).toBeInTheDocument();
    });

    it('fires onClose when Go to Dashboard is clicked', () => {
        const onClose = vi.fn();
        render(<Complete onClose={onClose} />);
        fireEvent.click(screen.getByRole('button', { name: /Go to Dashboard/i }));
        expect(onClose).toHaveBeenCalled();
    });
});
