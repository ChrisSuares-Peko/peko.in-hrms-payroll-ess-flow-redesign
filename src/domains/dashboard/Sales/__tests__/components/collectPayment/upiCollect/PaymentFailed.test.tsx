import React from 'react';

import { render, screen, fireEvent } from '@testing-library/react';
import { vi, describe, it, expect } from 'vitest';

import PaymentFailed from '../../../../components/collectPayment/upiCollect/PaymentFailed';

vi.mock('../../../../components/shared/CenteredHeader', () => ({
    default: ({ title, description }: any) => (
        <div>
            <span>{title}</span>
            <span>{description}</span>
        </div>
    ),
}));

describe('PaymentFailed', () => {
    it('renders the title and triggers retry/choose-another callbacks', () => {
        const onRetry = vi.fn();
        const onChooseAnother = vi.fn();
        render(<PaymentFailed onRetry={onRetry} onChooseAnother={onChooseAnother} />);

        expect(screen.getByText('Payment Failed')).toBeInTheDocument();

        fireEvent.click(screen.getByRole('button', { name: /retry payment/i }));
        fireEvent.click(screen.getByRole('button', { name: /choose another/i }));

        expect(onRetry).toHaveBeenCalled();
        expect(onChooseAnother).toHaveBeenCalled();
    });
});
