import { render, screen, fireEvent } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import InternationalRemittanceModal from '../../../components/internationalRemittance/InternationalRemittanceModal';

vi.mock('../../../components/internationalRemittance/Wellcome', () => ({
    default: ({ onProceed }: any) => (
        <button type="button" data-testid="welcome" onClick={onProceed}>
            welcome
        </button>
    ),
}));

vi.mock('../../../components/internationalRemittance/CompanyDetails', () => ({
    default: () => <div data-testid="company" />,
}));

vi.mock('../../../components/internationalRemittance/Complete', () => ({
    default: () => <div data-testid="complete" />,
}));

describe('InternationalRemittanceModal', () => {
    it('renders all three step labels and starts on Welcome', () => {
        render(<InternationalRemittanceModal open onClose={vi.fn()} />);

        expect(screen.getByText('Welcome')).toBeInTheDocument();
        expect(screen.getByText('Company Details')).toBeInTheDocument();
        expect(screen.getByText('Complete')).toBeInTheDocument();
        expect(screen.getByTestId('welcome')).toBeInTheDocument();
    });

    it('moves to Company Details step when Welcome.proceed is fired', () => {
        render(<InternationalRemittanceModal open onClose={vi.fn()} />);
        fireEvent.click(screen.getByTestId('welcome'));
        expect(screen.getByTestId('company')).toBeInTheDocument();
    });

    it('does not render content when open is false', () => {
        render(<InternationalRemittanceModal open={false} onClose={vi.fn()} />);
        expect(screen.queryByTestId('welcome')).not.toBeInTheDocument();
    });
});
