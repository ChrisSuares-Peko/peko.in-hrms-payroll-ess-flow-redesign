import { render, screen, fireEvent } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import PaymentFailed from '../../../../components/invoiceDetails/upiCollect/PaymentFailed';

describe('PaymentFailed', () => {
    it('renders failed header and action buttons', () => {
        render(<PaymentFailed onRetry={vi.fn()} onChooseAnother={vi.fn()} />);
        expect(screen.getByText('Payment Failed')).toBeInTheDocument();
        expect(screen.getByRole('button', { name: /Retry Payment/i })).toBeInTheDocument();
        expect(
            screen.getByRole('button', { name: /Choose Another Payment Method/i })
        ).toBeInTheDocument();
    });

    it('fires onRetry and onChooseAnother callbacks', () => {
        const onRetry = vi.fn();
        const onChooseAnother = vi.fn();
        render(<PaymentFailed onRetry={onRetry} onChooseAnother={onChooseAnother} />);
        fireEvent.click(screen.getByRole('button', { name: /Retry Payment/i }));
        fireEvent.click(screen.getByRole('button', { name: /Choose Another Payment Method/i }));
        expect(onRetry).toHaveBeenCalled();
        expect(onChooseAnother).toHaveBeenCalled();
    });
});
