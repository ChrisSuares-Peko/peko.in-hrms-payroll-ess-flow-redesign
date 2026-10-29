import React from 'react';

import { render, screen } from '@testing-library/react';
import { vi, describe, it, beforeEach, expect } from 'vitest';

import Step5Preview from '../../../components/createAgreement/Step5Preview';
import type { Step5Ref } from '../../../types/createAgreement';

vi.mock('../../../components/shared/PDFViewer', () => ({
    default: () => <div data-testid="pdf-viewer" />,
}));

const businessProfile = { name: 'My Co', email: 'me@co.com', mobileNo: '111', gstNumber: null, logo: null };
const businessAddress = { id: 1, addressLine1: 'L1', addressLine2: '', city: 'Kochi', state: 'KL', zipCode: '111111', default: 1 };

const baseProps = {
    agreementPrefix: 'AGR-',
    agreementNumber: '001',
    contractType: 'Service',
    title: 'My Agreement',
    description: 'Some description',
    startDate: 'Jan 1, 2026',
    createdAt: 'Jan 1, 2026',
    paymentTerms: 'NET30',
    customerName: 'Acme Corp',
    customerAddress: 'Line 1',
    customerEmail: 'hi@acme.com',
    customerPhone: '999',
    businessProfile,
    businessAddress,
};

beforeEach(() => {
    vi.clearAllMocks();
});

describe('Step5Preview', () => {
    it('renders the preview with title, agreement id and customer info', () => {
        render(<Step5Preview {...baseProps} />);

        expect(screen.getByText('Preview Agreement')).toBeInTheDocument();
        expect(screen.getByText('Service')).toBeInTheDocument();
        expect(screen.getByText('AGR-001 — Acme Corp')).toBeInTheDocument();
        expect(screen.getByText('My Agreement')).toBeInTheDocument();
        expect(screen.getByText('Some description')).toBeInTheDocument();
        expect(screen.getByText('Service Provider')).toBeInTheDocument();
        expect(screen.getByText('Client')).toBeInTheDocument();
        expect(screen.getByText('My Co')).toBeInTheDocument();
        expect(screen.getByText('Acme Corp')).toBeInTheDocument();
        expect(screen.getByText('hi@acme.com')).toBeInTheDocument();
    });

    it('renders payment terms when provided', () => {
        render(<Step5Preview {...baseProps} />);
        expect(screen.getByText('Payment Terms')).toBeInTheDocument();
        expect(screen.getByText('NET30')).toBeInTheDocument();
    });

    it('omits payment terms section when not provided', () => {
        render(<Step5Preview {...baseProps} paymentTerms={undefined} />);
        expect(screen.queryByText('Payment Terms')).not.toBeInTheDocument();
    });

    it('shows PDFViewer when documentFile is provided', () => {
        render(
            <Step5Preview
                {...baseProps}
                documentFile={new File(['x'], 'x.pdf', { type: 'application/pdf' })}
            />
        );
        expect(screen.getByTestId('pdf-viewer')).toBeInTheDocument();
    });

    it('shows fallback Agreement Preview text when no document is supplied', () => {
        render(<Step5Preview {...baseProps} />);
        expect(screen.getByText('Agreement Preview')).toBeInTheDocument();
        expect(screen.queryByTestId('pdf-viewer')).not.toBeInTheDocument();
    });

    it('exposes initiator info from business profile via ref', () => {
        const ref = React.createRef<Step5Ref>();
        render(<Step5Preview {...baseProps} businessProfile={businessProfile} ref={ref} />);

        expect(ref.current?.getInitiatorInfo()).toEqual({
            email: 'me@co.com',
            name: 'My Co',
        });
    });
});
