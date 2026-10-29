import { render, screen, fireEvent } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import Wellcome from '../../../components/internationalRemittance/Wellcome';

vi.mock('react-svg', () => ({
    ReactSVG: () => <span data-testid="react-svg" />,
}));

describe('Wellcome (international remittance)', () => {
    it('renders title, info box and footer buttons', () => {
        render(<Wellcome onSkip={vi.fn()} onProceed={vi.fn()} />);
        expect(screen.getByText('International Remittance Setup')).toBeInTheDocument();
        expect(screen.getByText('Optional Setup')).toBeInTheDocument();
        expect(screen.getByRole('button', { name: /Skip Setup/i })).toBeInTheDocument();
        expect(screen.getByRole('button', { name: /Proceed to Setup/i })).toBeInTheDocument();
    });

    it('fires onSkip and onProceed on button clicks', () => {
        const onSkip = vi.fn();
        const onProceed = vi.fn();
        render(<Wellcome onSkip={onSkip} onProceed={onProceed} />);

        fireEvent.click(screen.getByRole('button', { name: /Skip Setup/i }));
        fireEvent.click(screen.getByRole('button', { name: /Proceed to Setup/i }));

        expect(onSkip).toHaveBeenCalled();
        expect(onProceed).toHaveBeenCalled();
    });
});
