import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';

import EsignStatusCard from '../../../../components/kyb/admin/EsignStatusCard';
import { ESIGN_STATUS } from '../../../../hooks/admin/useCorporateAgreement';
import { KYB_AGREEMENT } from '../../../../utils/kybData';

describe('EsignStatusCard', () => {
    it('tells the corporate the agreement went out and that we are watching for the signature', () => {
        render(<EsignStatusCard status={ESIGN_STATUS.SENT} />);

        expect(screen.getByText(KYB_AGREEMENT.esignAwaiting.badge)).toBeInTheDocument();
        expect(screen.getByText(KYB_AGREEMENT.esignAwaiting.title)).toBeInTheDocument();
        expect(screen.getByText(KYB_AGREEMENT.esignAwaiting.description)).toBeInTheDocument();
        expect(screen.getByText(KYB_AGREEMENT.esignChecking)).toBeInTheDocument();
    });

    it('confirms the signature and stops claiming to be checking once it is done', () => {
        render(<EsignStatusCard status={ESIGN_STATUS.SIGNED} />);

        expect(screen.getByText(KYB_AGREEMENT.esignSigned.badge)).toBeInTheDocument();
        expect(screen.getByText(KYB_AGREEMENT.esignSigned.title)).toBeInTheDocument();
        expect(screen.getByText(KYB_AGREEMENT.esignSigned.description)).toBeInTheDocument();
        expect(screen.queryByText(KYB_AGREEMENT.esignChecking)).not.toBeInTheDocument();
    });

    it('does not claim the agreement was sent while it is still being prepared', () => {
        render(<EsignStatusCard status={ESIGN_STATUS.PENDING_DISPATCH} />);

        expect(screen.getByText(KYB_AGREEMENT.esignPreparing.title)).toBeInTheDocument();
        expect(screen.queryByText(KYB_AGREEMENT.esignAwaiting.title)).not.toBeInTheDocument();
        expect(screen.queryByText(KYB_AGREEMENT.esignChecking)).not.toBeInTheDocument();
    });

    it('shows why the signature did not complete, so the corporate knows to send it again', () => {
        render(
            <EsignStatusCard
                status={ESIGN_STATUS.FAILED}
                failureReason="The authorised signatory declined the agreement."
            />
        );

        expect(screen.getByText(KYB_AGREEMENT.esignFailed.title)).toBeInTheDocument();
        expect(
            screen.getByText('The authorised signatory declined the agreement.')
        ).toBeInTheDocument();
        expect(screen.queryByText(KYB_AGREEMENT.esignChecking)).not.toBeInTheDocument();
    });

    it('offers the signing link only while a signature is outstanding', () => {
        const { rerender } = render(
            <EsignStatusCard status={ESIGN_STATUS.SENT} signingLink="https://sign.test/abc" />
        );

        expect(screen.getByRole('link', { name: KYB_AGREEMENT.esignSignNow })).toHaveAttribute(
            'href',
            'https://sign.test/abc'
        );

        rerender(
            <EsignStatusCard status={ESIGN_STATUS.SIGNED} signingLink="https://sign.test/abc" />
        );
        expect(screen.queryByRole('link', { name: KYB_AGREEMENT.esignSignNow })).toBeNull();
    });

    it('opens the signing link in a new tab without handing it the opener', () => {
        render(<EsignStatusCard status={ESIGN_STATUS.SENT} signingLink="https://sign.test/abc" />);

        const link = screen.getByRole('link', { name: KYB_AGREEMENT.esignSignNow });
        expect(link).toHaveAttribute('target', '_blank');
        expect(link.getAttribute('rel')).toContain('noopener');
    });

    it('marks the completed state as success and the pending one as in-progress', () => {
        const { container: pending } = render(<EsignStatusCard status={ESIGN_STATUS.SENT} />);
        expect(pending.querySelector('.text-textLightRed')).toBeInTheDocument();

        const { container: done } = render(<EsignStatusCard status={ESIGN_STATUS.SIGNED} />);
        expect(done.querySelector('.text-savingsTagLightText')).toBeInTheDocument();
    });
});
