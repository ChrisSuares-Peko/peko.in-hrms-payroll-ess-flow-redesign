import React from 'react';

import { render, screen, fireEvent } from '@testing-library/react';
import { vi, describe, it, expect } from 'vitest';

import MandateAwaitingApproval from '../../../../components/collectPayment/eNACHMandate/MandateAwaitingApproval';

vi.mock('../../../../components/shared/CopyableRow', () => ({
    default: ({ title, description }: any) => (
        <div>
            <span>{title}</span>
            <span>{description}</span>
        </div>
    ),
}));
vi.mock('../../../../components/shared/LeftHeader', () => ({
    default: ({ title }: any) => <div>{title}</div>,
}));

const formValues: any = {
    customer: { name: 'Acme', email: 'a@b.com', mobile: '999' },
    mandate: { maxAmount: '500', frequency: 'monthly', startDate: '2026-01-01' },
    purpose: { description: 'rent' },
};

describe('MandateAwaitingApproval', () => {
    it('renders mandate rows, auth link, and description', () => {
        render(
            <MandateAwaitingApproval
                authLink="https://link"
                formValues={formValues}
                onResend={() => {}}
                onCancel={() => {}}
            />
        );

        expect(screen.getByText('Awaiting customer approval')).toBeInTheDocument();
        expect(screen.getByText('Authorization Link')).toBeInTheDocument();
        expect(screen.getByText('https://link')).toBeInTheDocument();
        expect(screen.getByText('Acme')).toBeInTheDocument();
        expect(screen.getByText('a@b.com')).toBeInTheDocument();
        expect(screen.getByText('₹500')).toBeInTheDocument();
        expect(screen.getByText('rent')).toBeInTheDocument();
    });

    it('triggers onResend / onCancel for the action buttons', () => {
        const onResend = vi.fn();
        const onCancel = vi.fn();
        render(
            <MandateAwaitingApproval
                authLink=""
                formValues={formValues}
                onResend={onResend}
                onCancel={onCancel}
            />
        );

        fireEvent.click(screen.getByRole('button', { name: /resend authorization/i }));
        fireEvent.click(screen.getByRole('button', { name: /cancel mandate setup/i }));
        expect(onResend).toHaveBeenCalled();
        expect(onCancel).toHaveBeenCalled();
    });
});
