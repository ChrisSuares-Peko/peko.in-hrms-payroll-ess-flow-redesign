import React from 'react';

import { render, screen, fireEvent } from '@testing-library/react';
import { vi, describe, it, beforeEach, expect } from 'vitest';

import ENACHMandateModal from '../../../../components/collectPayment/eNACHMandate/ENACHMandateModal';
import useENACHMandate from '../../../../hooks/collectPayment/useENACHMandate';

vi.mock('../../../../hooks/collectPayment/useENACHMandate', () => ({ default: vi.fn() }));
vi.mock('../../../../components/collectPayment/eNACHMandate/MandateInfo', () => ({
    default: ({ onNext, onBack }: any) => (
        <div>
            <button type="button" onClick={onNext}>
                next
            </button>
            <button type="button" onClick={onBack}>
                back
            </button>
        </div>
    ),
}));
vi.mock('../../../../components/collectPayment/eNACHMandate/MandateForm', () => ({
    default: ({ onSubmit }: any) => (
        <button
            type="button"
            onClick={() =>
                onSubmit({
                    customer: { name: 'A', email: 'a@b.com', mobile: '111' },
                    mandate: { maxAmount: '100', frequency: 'monthly', startDate: '' },
                    purpose: { description: '' },
                })
            }
        >
            submit-form
        </button>
    ),
}));
vi.mock('../../../../components/collectPayment/eNACHMandate/MandateAwaitingApproval', () => ({
    default: () => <div data-testid="awaiting" />,
}));

beforeEach(() => {
    vi.clearAllMocks();
    (useENACHMandate as any).mockReturnValue({
        isResending: false,
        isCancelling: false,
        proceedToAuthorisation: vi.fn().mockResolvedValue('https://link'),
        resendAuthLink: vi.fn(),
        cancelMandateSetup: vi.fn(),
    });
});

describe('ENACHMandateModal', () => {
    it('starts on MandateInfo step and advances to MandateForm', () => {
        render(
            <ENACHMandateModal
                open
                onCancel={() => {}}
                onSuccess={() => {}}
            />
        );

        expect(screen.getByText('next')).toBeInTheDocument();
        fireEvent.click(screen.getByText('next'));
        expect(screen.getByText('submit-form')).toBeInTheDocument();
    });

    it('moves to awaiting approval after form submit', async () => {
        render(
            <ENACHMandateModal
                open
                onCancel={() => {}}
                onSuccess={() => {}}
            />
        );

        fireEvent.click(screen.getByText('next'));
        fireEvent.click(screen.getByText('submit-form'));

        // proceedToAuthorisation resolves to a link → awaiting view shows.
        await screen.findByTestId('awaiting');
    });
});
