import { render, screen, fireEvent } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import MandateInfo from '../../../../components/invoiceDetails/eNACHMandate/MandateInfo';

vi.mock('../../../../constants/invoiceDetails', () => ({
    ENACH_USE_CASES: [
        { title: 'Subscriptions', description: 'Recurring subs' },
        { title: 'EMIs', description: 'Loan installments' },
    ],
}));

describe('MandateInfo', () => {
    it('renders title, use cases and footer buttons', () => {
        render(<MandateInfo onBack={vi.fn()} onNext={vi.fn()} />);
        expect(screen.getByText('eNACH Mandate')).toBeInTheDocument();
        expect(screen.getByText('Subscriptions')).toBeInTheDocument();
        expect(screen.getByText('EMIs')).toBeInTheDocument();
        expect(screen.getByRole('button', { name: /Go Back/i })).toBeInTheDocument();
        expect(screen.getByRole('button', { name: /Create Mandate/i })).toBeInTheDocument();
    });

    it('fires onBack and onNext on button clicks', () => {
        const onBack = vi.fn();
        const onNext = vi.fn();
        render(<MandateInfo onBack={onBack} onNext={onNext} />);
        fireEvent.click(screen.getByRole('button', { name: /Go Back/i }));
        fireEvent.click(screen.getByRole('button', { name: /Create Mandate/i }));
        expect(onBack).toHaveBeenCalled();
        expect(onNext).toHaveBeenCalled();
    });
});
