import React from 'react';

import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';

import SignatureStatusCard from '../../../components/agreementDetails/SignatureStatusCard';

describe('SignatureStatusCard', () => {
    it('defaults to Pending status when eSignStatus is missing', () => {
        render(<SignatureStatusCard customerName="Acme" eSignId={1} />);

        expect(screen.getByText('Signature Status')).toBeInTheDocument();
        expect(screen.getByText('Acme')).toBeInTheDocument();
        expect(screen.getByText('Client')).toBeInTheDocument();
        expect(screen.getByText('Pending')).toBeInTheDocument();
    });

    it('renders Signed when status is COMPLETED', () => {
        render(<SignatureStatusCard customerName="Acme" eSignId={1} eSignStatus="COMPLETED" />);

        expect(screen.getByText('Signed')).toBeInTheDocument();
    });

    it('renders Rejected when status is REJECTED', () => {
        render(<SignatureStatusCard customerName="Acme" eSignId={1} eSignStatus="REJECTED" />);

        expect(screen.getByText('Rejected')).toBeInTheDocument();
    });

    it('renders Expired when status is EXPIRED', () => {
        render(<SignatureStatusCard customerName="Acme" eSignId={1} eSignStatus="EXPIRED" />);

        expect(screen.getByText('Expired')).toBeInTheDocument();
    });

    it('falls back to Pending for unknown statuses', () => {
        render(<SignatureStatusCard customerName="Acme" eSignId={1} eSignStatus="WEIRD" />);

        expect(screen.getByText('Pending')).toBeInTheDocument();
    });
});
