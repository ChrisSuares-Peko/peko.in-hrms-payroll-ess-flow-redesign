import { render, screen, fireEvent } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import ActivationSuccess from '../../../components/onboarding/ActivationSuccess';

describe('ActivationSuccess', () => {
    it('renders title, virtual account and Continue button', () => {
        render(<ActivationSuccess onDone={vi.fn()} virtualAccount="VA123" />);
        expect(screen.getByText('Payment Collections Activated')).toBeInTheDocument();
        expect(screen.getByText('VA123')).toBeInTheDocument();
        expect(screen.getByRole('button', { name: /Continue to Dashboard/i })).toBeInTheDocument();
    });

    it('falls back to placeholder text when virtualAccount is missing', () => {
        render(<ActivationSuccess onDone={vi.fn()} virtualAccount={null} />);
        expect(screen.getByText('PEKO -')).toBeInTheDocument();
    });

    it('calls onDone when Continue clicked', () => {
        const onDone = vi.fn();
        render(<ActivationSuccess onDone={onDone} virtualAccount="X" />);
        fireEvent.click(screen.getByRole('button', { name: /Continue to Dashboard/i }));
        expect(onDone).toHaveBeenCalled();
    });
});
