import { render, screen, fireEvent } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import CompanyDetails from '../../../components/internationalRemittance/CompanyDetails';

vi.mock('react-svg', () => ({
    ReactSVG: () => <span data-testid="react-svg" />,
}));

vi.mock('../../../forms/CompanyDetailsForm', () => ({
    default: () => <div data-testid="company-form" />,
}));

vi.mock('../../../hooks/useCompanyDetailsSubmit', () => ({
    default: () => ({ handleSubmit: vi.fn() }),
}));

describe('CompanyDetails (international remittance)', () => {
    it('renders header, form and footer buttons', () => {
        render(<CompanyDetails onSkip={vi.fn()} onProceed={vi.fn()} />);

        expect(screen.getByText('Company Details')).toBeInTheDocument();
        expect(screen.getByTestId('company-form')).toBeInTheDocument();
        expect(screen.getByRole('button', { name: /Back/i })).toBeInTheDocument();
        expect(screen.getByRole('button', { name: /Submit Application/i })).toBeInTheDocument();
    });

    it('fires onSkip when Back is clicked', () => {
        const onSkip = vi.fn();
        render(<CompanyDetails onSkip={onSkip} onProceed={vi.fn()} />);
        fireEvent.click(screen.getByRole('button', { name: /Back/i }));
        expect(onSkip).toHaveBeenCalled();
    });
});
