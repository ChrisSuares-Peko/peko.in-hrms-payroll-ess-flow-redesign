import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';

import AgreementReviewPanel from '../../../component/corporateCardApplications/AgreementReviewPanel';
import { CorporateAgreementReview } from '../../../types/corporateDocuments';

const review = (overrides: Partial<CorporateAgreementReview> = {}): CorporateAgreementReview => ({
    groups: [
        {
            key: 'bank',
            label: 'Bank Details',
            fields: [
                { key: 'bankName', label: 'Bank', value: 'HDFC Bank', required: true },
                {
                    key: 'bankAccountNumber',
                    label: 'Account Number',
                    value: '123456789012',
                    required: true,
                },
                { key: 'bankIfsc', label: 'IFSC Code', value: null, required: true },
            ],
        },
        {
            key: 'signatory',
            label: 'Authorised Signatory',
            fields: [
                { key: 'signatoryName', label: 'Name', value: 'Aarav Sharma', required: true },
                {
                    key: 'signatoryIsPep',
                    label: 'Politically Exposed Person (PEP)',
                    value: 'No',
                    required: false,
                },
            ],
        },
    ],
    isDraft: false,
    missingFields: [],
    signMethod: 'E_SIGN',
    esignStatus: 'PENDING_DISPATCH',
    esignReference: null,
    generatedDocumentKey: 'staging/corporate/42/KYB-Documents/uuid-docx',
    generatedPdfKey: 'staging/corporate/42/KYB-Documents/uuid-pdf',
    canResend: true,
    updatedAt: '2026-08-14T06:00:00.000Z',
    ...overrides,
});

describe('AgreementReviewPanel', () => {
    it('renders nothing until the agreement has been fetched', () => {
        const { container } = render(<AgreementReviewPanel review={null} onRegenerate={vi.fn()} />);

        expect(container).toBeEmptyDOMElement();
    });

    // Reviewers previously had to open the .docx to check the declared bank account against the cheque.
    it('shows the declared details the reviewer has to check', () => {
        render(<AgreementReviewPanel review={review()} onRegenerate={vi.fn()} />);

        expect(screen.getByText('Bank Details')).toBeInTheDocument();
        expect(screen.getByText('123456789012')).toBeInTheDocument();
        expect(screen.getByText('Aarav Sharma')).toBeInTheDocument();
        expect(screen.getByText('Politically Exposed Person (PEP)')).toBeInTheDocument();
        expect(screen.getByText('No')).toBeInTheDocument();
    });

    it('flags a required field the corporate left empty', () => {
        render(<AgreementReviewPanel review={review()} onRegenerate={vi.fn()} />);

        expect(screen.getByText('Not provided')).toBeInTheDocument();
    });

    // The provider is not wired, so this must not read as sent.
    it('says the agreement has been generated but not sent', () => {
        render(<AgreementReviewPanel review={review()} onRegenerate={vi.fn()} />);

        expect(screen.getByText('Generated, not yet sent for e-signature')).toBeInTheDocument();
    });

    it.each([
        ['SENT', 'Sent for e-signature, awaiting the signature'],
        ['SIGNED', 'e-Signature completed'],
        ['FAILED', 'e-Signature failed'],
    ])('reports the %s state', (esignStatus, label) => {
        render(<AgreementReviewPanel review={review({ esignStatus })} onRegenerate={vi.fn()} />);

        expect(screen.getByText(label)).toBeInTheDocument();
    });

    // The PDF is the copy that goes for signature, so it leads.
    it('lets the reviewer view and download the PDF that goes for signature', () => {
        const onOpenGenerated = vi.fn();
        render(
            <AgreementReviewPanel
                review={review()}
                onRegenerate={vi.fn()}
                onOpenGenerated={onOpenGenerated}
            />
        );

        fireEvent.click(screen.getByRole('button', { name: /View PDF/ }));
        expect(onOpenGenerated).toHaveBeenCalledWith(
            'staging/corporate/42/KYB-Documents/uuid-pdf',
            'view'
        );

        fireEvent.click(screen.getByRole('button', { name: /Download PDF/ }));
        expect(onOpenGenerated).toHaveBeenCalledWith(
            'staging/corporate/42/KYB-Documents/uuid-pdf',
            'download'
        );
    });

    it('also offers the Word copy', () => {
        const onOpenGenerated = vi.fn();
        render(
            <AgreementReviewPanel
                review={review()}
                onRegenerate={vi.fn()}
                onOpenGenerated={onOpenGenerated}
            />
        );

        fireEvent.click(screen.getByRole('button', { name: /Download Word/ }));
        expect(onOpenGenerated).toHaveBeenCalledWith(
            'staging/corporate/42/KYB-Documents/uuid-docx',
            'download'
        );
    });

    it('offers no download before anything has been generated', () => {
        render(
            <AgreementReviewPanel
                review={review({ generatedDocumentKey: null, generatedPdfKey: null })}
                onRegenerate={vi.fn()}
            />
        );

        expect(screen.queryByRole('button', { name: /Download PDF/ })).not.toBeInTheDocument();
        expect(screen.queryByRole('button', { name: /Download Word/ })).not.toBeInTheDocument();
    });

    it('offers only the Word copy for an agreement generated before PDFs were stored', () => {
        render(
            <AgreementReviewPanel
                review={review({ generatedPdfKey: null })}
                onRegenerate={vi.fn()}
            />
        );

        expect(screen.getByRole('button', { name: /Download Word/ })).toBeInTheDocument();
        expect(screen.queryByRole('button', { name: /Download PDF/ })).not.toBeInTheDocument();
    });

    it('regenerates and requeues on request', () => {
        const onRegenerate = vi.fn();
        render(<AgreementReviewPanel review={review()} onRegenerate={onRegenerate} />);

        fireEvent.click(screen.getByRole('button', { name: /Regenerate & requeue/ }));

        expect(onRegenerate).toHaveBeenCalledTimes(1);
    });

    it('will not regenerate a half-filled agreement', () => {
        render(
            <AgreementReviewPanel
                review={review({ canResend: false, missingFields: ['bankIfsc', 'panNumber'] })}
                onRegenerate={vi.fn()}
            />
        );

        expect(screen.getByRole('button', { name: /Regenerate & requeue/ })).toBeDisabled();
        expect(screen.getByText(/2 required fields still empty/)).toBeInTheDocument();
    });

    it('explains an empty agreement rather than looking broken', () => {
        render(
            <AgreementReviewPanel
                review={review({
                    groups: null,
                    missingFields: null,
                    canResend: false,
                    esignStatus: null,
                })}
                onRegenerate={vi.fn()}
            />
        );

        expect(screen.getByText(/has not filled in any agreement details/)).toBeInTheDocument();
    });

    // One shared flag used to spin every button whenever any of them was clicked.
    it('spins only the button that was clicked', () => {
        const { container } = render(
            <AgreementReviewPanel
                review={review()}
                onRegenerate={vi.fn()}
                onOpenGenerated={vi.fn()}
                isOpening={(docKey, mode) =>
                    docKey === 'staging/corporate/42/KYB-Documents/uuid-pdf' && mode === 'download'
                }
            />
        );

        const loadingLabels = Array.from(container.querySelectorAll('button'))
            .filter(button => button.querySelector('.anticon-loading'))
            .map(button => button.textContent?.trim());

        expect(loadingLabels).toEqual(['Download PDF']);
    });

    it('spins nothing while idle', () => {
        const { container } = render(
            <AgreementReviewPanel review={review()} onRegenerate={vi.fn()} />
        );

        expect(container.querySelector('.anticon-loading')).not.toBeInTheDocument();
    });
});
