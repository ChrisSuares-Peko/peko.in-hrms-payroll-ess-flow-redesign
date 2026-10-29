import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';

import KybProgressPanel from '../../../component/corporateCardApplications/KybProgressPanel';
import { KybProgressStep } from '../../../types/corporateDocuments';

const step = (
    key: string,
    label: string,
    state: KybProgressStep['state'],
    detail: string | null = null
): KybProgressStep => ({ key, label, state, detail });

const FULL: KybProgressStep[] = [
    step('business_type', 'Business type selected', 'done', 'LLP'),
    step(
        'documents',
        'Business documents uploaded',
        'in_progress',
        '6 of 7 required documents uploaded'
    ),
    step('sign_method', 'Signing method chosen', 'done', 'e-Sign with Aadhaar'),
    step('agreement_details', 'Agreement details filled in', 'done'),
    step('agreement_signed', 'Agreement signed', 'pending'),
    step('submitted', 'Submitted for verification', 'pending'),
];

describe('KybProgressPanel', () => {
    it('lists every step with its state and detail', () => {
        render(<KybProgressPanel steps={FULL} businessType="LLP" />);

        FULL.forEach(entry => expect(screen.getByText(entry.label)).toBeInTheDocument());
        expect(screen.getByText('6 of 7 required documents uploaded')).toBeInTheDocument();
        expect(screen.getAllByText('Completed')).toHaveLength(3);
        expect(screen.getByText('In progress')).toBeInTheDocument();
        expect(screen.getAllByText('Pending')).toHaveLength(2);
    });

    it('summarises how far the corporate got, as a count and a percentage', () => {
        render(<KybProgressPanel steps={FULL} businessType="LLP" />);

        expect(screen.getByText(/3 of 6 steps · LLP/)).toBeInTheDocument();
        expect(screen.getByText('50%')).toBeInTheDocument();
    });

    it('reaches 100% without the steps the corporate was never asked to do', () => {
        const allDone = FULL.map(entry =>
            entry.key === 'agreement_details'
                ? { ...entry, state: 'not_applicable' as const }
                : { ...entry, state: 'done' as const }
        );
        render(<KybProgressPanel steps={allDone} businessType="LLP" />);

        expect(screen.getByText('100%')).toBeInTheDocument();
        expect(screen.getByText(/5 of 5 steps/)).toBeInTheDocument();
    });

    it('shows 0% for a corporate that has not started', () => {
        const none = FULL.map(entry => ({ ...entry, state: 'pending' as const }));
        render(<KybProgressPanel steps={none} businessType={null} />);

        expect(screen.getByText('0%')).toBeInTheDocument();
    });

    it('leaves not-applicable steps out of the total rather than counting them against the corporate', () => {
        const withNa = [
            ...FULL.slice(0, 3),
            step(
                'agreement_details',
                'Agreement details filled in',
                'not_applicable',
                'Not collected on the upload route'
            ),
            ...FULL.slice(4),
        ];
        render(<KybProgressPanel steps={withNa} businessType="LLP" />);

        expect(screen.getByText(/2 of 5 steps/)).toBeInTheDocument();
        expect(screen.getByText('40%')).toBeInTheDocument();
        expect(screen.getByText('Not applicable')).toBeInTheDocument();
    });

    it('says so when no business type has been chosen', () => {
        render(<KybProgressPanel steps={FULL} businessType={null} />);

        expect(screen.getByText(/business type not chosen/)).toBeInTheDocument();
    });

    // An empty list means the fetch failed; an unstarted corporate still returns six pending steps.
    it('renders nothing at all when there are no steps to show', () => {
        const { container } = render(<KybProgressPanel steps={[]} businessType={null} />);

        expect(container).toBeEmptyDOMElement();
    });

    it("does not reuse the document rows' wording, so a step is never read as a document", () => {
        render(<KybProgressPanel steps={FULL} businessType="LLP" />);

        expect(screen.queryByText('Uploaded')).not.toBeInTheDocument();
        expect(screen.queryByText('Missing')).not.toBeInTheDocument();
        expect(screen.queryByText('Not uploaded')).not.toBeInTheDocument();
    });

    describe('the reviewer decision', () => {
        it('shows the current KYB status alongside the journey', () => {
            render(<KybProgressPanel steps={FULL} businessType="LLP" kybStatus="UNDER_REVIEW" />);

            expect(screen.getByText('Under review')).toBeInTheDocument();
        });

        // Otherwise a rejected application mid-resubmission reads as a finished journey.
        it('spells out why an application was rejected', () => {
            render(
                <KybProgressPanel
                    steps={FULL}
                    businessType="LLP"
                    kybStatus="REJECTED"
                    rejectionReason="The cancelled cheque is illegible"
                />
            );

            expect(screen.getByText('Rejected')).toBeInTheDocument();
            expect(
                screen.getByText(/Rejected: The cancelled cheque is illegible/)
            ).toBeInTheDocument();
        });

        it('says nothing about a decision that has not been made', () => {
            render(<KybProgressPanel steps={FULL} businessType="LLP" />);

            expect(screen.queryByText(/^Rejected:/)).not.toBeInTheDocument();
        });
    });
});
