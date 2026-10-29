import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import ENACHMandateModal from '../../../../components/invoiceDetails/eNACHMandate/ENACHMandateModal';

vi.mock('../../../../hooks/invoiceDetails/useENACHMandate', () => ({
    default: () => ({
        isResending: false,
        isCancelling: false,
        proceedToAuthorisation: vi.fn(),
        resendAuthLink: vi.fn(),
        cancelMandateSetup: vi.fn(),
    }),
}));

vi.mock('../../../../components/invoiceDetails/eNACHMandate/MandateInfo', () => ({
    default: () => <div data-testid="mandate-info" />,
}));

vi.mock('../../../../components/invoiceDetails/eNACHMandate/MandateForm', () => ({
    default: () => <div data-testid="mandate-form" />,
}));

vi.mock('../../../../components/invoiceDetails/eNACHMandate/MandateAwaitingApproval', () => ({
    default: () => <div data-testid="awaiting" />,
}));

describe('ENACHMandateModal', () => {
    it('renders MandateInfo on first step when open', () => {
        render(<ENACHMandateModal open onCancel={vi.fn()} onSuccess={vi.fn()} />);
        expect(screen.getByTestId('mandate-info')).toBeInTheDocument();
    });

    it('renders nothing when closed', () => {
        render(<ENACHMandateModal open={false} onCancel={vi.fn()} onSuccess={vi.fn()} />);
        expect(screen.queryByTestId('mandate-info')).not.toBeInTheDocument();
    });
});
