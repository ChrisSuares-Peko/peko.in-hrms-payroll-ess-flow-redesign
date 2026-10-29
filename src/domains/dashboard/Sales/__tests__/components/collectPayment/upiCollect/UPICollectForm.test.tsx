import React from 'react';

import { render, screen, fireEvent } from '@testing-library/react';
import { vi, describe, it, expect } from 'vitest';

import UPICollectForm from '../../../../components/collectPayment/upiCollect/UPICollectForm';

vi.mock('../../../../forms/collectPayment/SendUPICollectForm', () => ({
    default: () => <div data-testid="upi-form" />,
}));
vi.mock('../../../../components/shared/InfoCard', () => ({
    default: ({ title }: any) => <div>{title}</div>,
}));
vi.mock('../../../../components/shared/LeftHeader', () => ({
    default: ({ title }: any) => <div>{title}</div>,
}));

describe('UPICollectForm', () => {
    it('renders the form, info card and Cancel/Send buttons', () => {
        render(
            <UPICollectForm
                initialAmount="100"
                onSubmit={async () => {}}
                onCancel={() => {}}
            />
        );

        expect(screen.getByTestId('upi-form')).toBeInTheDocument();
        expect(screen.getByText('Send UPI Collect')).toBeInTheDocument();
        expect(screen.getByText('How UPI Collect works')).toBeInTheDocument();
        expect(screen.getByRole('button', { name: /^cancel$/i })).toBeInTheDocument();
        expect(screen.getByRole('button', { name: /send upi request/i })).toBeInTheDocument();
    });

    it('triggers onCancel when Cancel clicked', () => {
        const onCancel = vi.fn();
        render(<UPICollectForm onSubmit={async () => {}} onCancel={onCancel} />);

        fireEvent.click(screen.getByRole('button', { name: /^cancel$/i }));
        expect(onCancel).toHaveBeenCalled();
    });
});
