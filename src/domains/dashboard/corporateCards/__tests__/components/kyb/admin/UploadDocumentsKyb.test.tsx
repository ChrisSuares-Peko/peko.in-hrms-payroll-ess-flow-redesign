import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';

import { KybChecklistDocument } from '../../../../api/admin/kybStatusApi';
import UploadDocumentsKyb from '../../../../components/kyb/admin/UploadDocumentsKyb';
import { EMPTY_AGREEMENT, ESIGN_STATUS } from '../../../../hooks/admin/useCorporateAgreement';
import {
    AGREEMENT_SIGN_METHOD,
    KYB_AGREEMENT,
    KYB_INTRO,
    KYB_UPLOAD,
} from '../../../../utils/kybData';

const makeDoc = (key: string, label: string, required = true): KybChecklistDocument => ({
    key,
    documentName: label.replace(/[^A-Za-z]+/g, '_'),
    label,
    uploadLabel: `Upload ${label}`,
    hint: 'Company seal + authorised signatory signature required',
    required,
});

const UPLOAD_DOCUMENTS = [
    makeDoc('coi', 'Certificate of Incorporation'),
    makeDoc('gst', 'GST Certificate'),
    makeDoc('cancelled-cheque', 'Cancelled Cheque'),
];

const mockDispatch = vi.fn();
vi.mock('@hooks/store', () => ({
    useAppDispatch: () => mockDispatch,
}));

vi.mock('@components/atomic/inputs/SelectInput', () => ({
    default: ({ name, label }: { name: string; label: string }) => (
        <label htmlFor={name}>
            {label}
            <select id={name} name={name} />
        </label>
    ),
}));

const agreementPanel = (overrides: Record<string, unknown> = {}) => ({
    agreement: EMPTY_AGREEMENT,
    signMethod: AGREEMENT_SIGN_METHOD.E_SIGN as string,
    chooseSignMethod: vi.fn(),
    sendForEsign: vi.fn(),
    esignQueued: false,
    esignSigned: false,
    esignStatus: null,
    templateAvailable: true,
    downloadTemplate: vi.fn(),
    downloadLoading: false,
    sendLoading: false,
    ...overrides,
});

const consentBox = (name: string) =>
    document.getElementById(`${name}-checkbox`) as HTMLInputElement;

/**
 * The blocker reasons live in the submit button's tooltip, not under it — antd only mounts tooltip
 * content once it opens, and a disabled button fires no mouse events, so the hover targets the wrapper.
 */
const expectSubmitBlocker = async (text: string) => {
    const submit = screen.getByRole('button', { name: KYB_UPLOAD.submitLabel });
    fireEvent.mouseEnter(submit.parentElement as HTMLElement);
    expect(await screen.findByText(text)).toBeInTheDocument();
};

const acceptConsents = () => {
    fireEvent.click(screen.getByText(KYB_AGREEMENT.consentPrivacy));
};

const uploadedEntry = (fileName: string | null) => ({
    fileName,
    documentType: 'pdf',
    expiryDate: null,
    status: 'UPLOADED',
    uploadedAt: null,
});

const pickFile = (input: Element, name: string) => {
    const file = new File(['x'.repeat(10)], name, { type: 'application/pdf' });
    Object.defineProperty(input, 'files', { value: [file] });
    fireEvent.change(input);
};

describe('UploadDocumentsKyb — saved documents', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('shows a document the corporate uploaded before the refresh, by its own file name', () => {
        render(
            <UploadDocumentsKyb
                documents={UPLOAD_DOCUMENTS}
                onBack={vi.fn()}
                onSubmit={vi.fn()}
                uploadedDocuments={{ [UPLOAD_DOCUMENTS[0].documentName]: uploadedEntry('coi.pdf') }}
                isDocumentSaved={doc => doc.key === UPLOAD_DOCUMENTS[0].key}
            />
        );

        expect(screen.getByText('coi.pdf')).toBeInTheDocument();
    });

    it('names a restored document generically when the original file name was never stored', () => {
        render(
            <UploadDocumentsKyb
                documents={UPLOAD_DOCUMENTS}
                onBack={vi.fn()}
                onSubmit={vi.fn()}
                uploadedDocuments={{ [UPLOAD_DOCUMENTS[0].documentName]: uploadedEntry(null) }}
                isDocumentSaved={doc => doc.key === UPLOAD_DOCUMENTS[0].key}
            />
        );

        expect(screen.getByText(KYB_UPLOAD.savedFallbackName)).toBeInTheDocument();
    });

    it('does not ask again for a document that is already saved server-side', async () => {
        const onSubmit = vi.fn();
        const { container } = render(
            <UploadDocumentsKyb
                documents={UPLOAD_DOCUMENTS}
                onBack={vi.fn()}
                onSubmit={onSubmit}
                uploadedDocuments={Object.fromEntries(
                    UPLOAD_DOCUMENTS.map(doc => [doc.documentName, uploadedEntry('saved.pdf')])
                )}
                isDocumentSaved={() => true}
            />
        );

        fireEvent.click(screen.getByRole('button', { name: KYB_UPLOAD.submitLabel }));

        await waitFor(() => expect(onSubmit).toHaveBeenCalledTimes(1));
        expect(container.querySelectorAll('.ant-form-item-has-error')).toHaveLength(0);
    });

    it('still asks for a document whose save failed, even though a row exists for it', async () => {
        const onSubmit = vi.fn();
        render(
            <UploadDocumentsKyb
                documents={UPLOAD_DOCUMENTS}
                onBack={vi.fn()}
                onSubmit={onSubmit}
                uploadedDocuments={Object.fromEntries(
                    UPLOAD_DOCUMENTS.map(doc => [doc.documentName, uploadedEntry('old.pdf')])
                )}
                documentStates={{ [UPLOAD_DOCUMENTS[0].documentName]: 'failed' }}
                isDocumentSaved={doc => doc.key !== UPLOAD_DOCUMENTS[0].key}
            />
        );

        const submit = screen.getByRole('button', { name: KYB_UPLOAD.submitLabel });
        await waitFor(() => expect(submit).toBeDisabled());
        await expectSubmitBlocker(`Upload the ${UPLOAD_DOCUMENTS[0].label}.`);

        fireEvent.click(submit);
        expect(onSubmit).not.toHaveBeenCalled();
    });

    it('hands each chosen file straight to the caller instead of waiting for Continue', async () => {
        const onDocumentSelected = vi.fn();
        const { container } = render(
            <UploadDocumentsKyb
                documents={UPLOAD_DOCUMENTS}
                onBack={vi.fn()}
                onSubmit={vi.fn()}
                onDocumentSelected={onDocumentSelected}
            />
        );

        pickFile(container.querySelectorAll('input[type="file"]')[0], 'coi.pdf');

        await waitFor(() => expect(onDocumentSelected).toHaveBeenCalledTimes(1));
        expect(onDocumentSelected).toHaveBeenCalledWith(
            UPLOAD_DOCUMENTS[0],
            expect.objectContaining({ name: 'coi.pdf', format: 'pdf' })
        );
    });

    it('asks the caller to delete a document that was already saved', () => {
        const onDocumentRemoved = vi.fn();
        const { container } = render(
            <UploadDocumentsKyb
                documents={UPLOAD_DOCUMENTS}
                onBack={vi.fn()}
                onSubmit={vi.fn()}
                uploadedDocuments={{ [UPLOAD_DOCUMENTS[0].documentName]: uploadedEntry('coi.pdf') }}
                isDocumentSaved={doc => doc.key === UPLOAD_DOCUMENTS[0].key}
                onDocumentRemoved={onDocumentRemoved}
            />
        );

        fireEvent.click(container.querySelector('.anticon-close-circle') as Element);

        expect(onDocumentRemoved).toHaveBeenCalledWith(UPLOAD_DOCUMENTS[0]);
    });

    it('does not send a delete for a document that was never saved', async () => {
        const onDocumentRemoved = vi.fn();
        const { container } = render(
            <UploadDocumentsKyb
                documents={UPLOAD_DOCUMENTS}
                onBack={vi.fn()}
                onSubmit={vi.fn()}
                onDocumentRemoved={onDocumentRemoved}
            />
        );

        pickFile(container.querySelectorAll('input[type="file"]')[0], 'coi.pdf');
        await waitFor(() => expect(screen.getByText('coi.pdf')).toBeInTheDocument());

        fireEvent.click(container.querySelector('.anticon-close-circle') as Element);

        expect(onDocumentRemoved).not.toHaveBeenCalled();
    });

    it('blocks submission while a document is still being saved', () => {
        render(
            <UploadDocumentsKyb
                documents={UPLOAD_DOCUMENTS}
                onBack={vi.fn()}
                onSubmit={vi.fn()}
                documentStates={{ [UPLOAD_DOCUMENTS[0].documentName]: 'saving' }}
            />
        );

        expect(screen.getByRole('button', { name: KYB_UPLOAD.submitLabel })).toBeDisabled();
        expect(screen.getByText(KYB_UPLOAD.uploadingNote)).toBeInTheDocument();
    });

    it('offers a retry when the already-uploaded documents could not be loaded back', () => {
        const onRetryRestore = vi.fn();
        render(
            <UploadDocumentsKyb
                documents={UPLOAD_DOCUMENTS}
                onBack={vi.fn()}
                onSubmit={vi.fn()}
                restoreFailed
                onRetryRestore={onRetryRestore}
            />
        );

        expect(screen.getByText(KYB_UPLOAD.restoreFailed)).toBeInTheDocument();
        fireEvent.click(screen.getByRole('button', { name: KYB_UPLOAD.retryLabel }));
        expect(onRetryRestore).toHaveBeenCalledTimes(1);
    });

    it('does not claim progress is saved while a document is showing as not saved', () => {
        render(
            <UploadDocumentsKyb
                documents={UPLOAD_DOCUMENTS}
                onBack={vi.fn()}
                onSubmit={vi.fn()}
                uploadedDocuments={{ [UPLOAD_DOCUMENTS[0].documentName]: uploadedEntry('coi.pdf') }}
                documentStates={{ [UPLOAD_DOCUMENTS[1].documentName]: 'failed' }}
                isDocumentSaved={doc => doc.key === UPLOAD_DOCUMENTS[0].key}
            />
        );

        expect(screen.queryByText(KYB_UPLOAD.savedChip)).not.toBeInTheDocument();
    });
});

describe('UploadDocumentsKyb', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('renders every KYB document as a mandatory upload field', () => {
        render(
            <UploadDocumentsKyb documents={UPLOAD_DOCUMENTS} onBack={vi.fn()} onSubmit={vi.fn()} />
        );

        expect(screen.getByText(KYB_UPLOAD.sectionTitle)).toBeInTheDocument();
        UPLOAD_DOCUMENTS.forEach(doc => {
            // Some documents' label and uploadLabel are identical strings, so more than one
            // element can legitimately match — assert presence, not uniqueness.
            expect(screen.getAllByText(doc.label).length).toBeGreaterThan(0);
        });
        // One mandatory-field asterisk per document.
        expect(screen.getAllByText('*')).toHaveLength(UPLOAD_DOCUMENTS.length);
    });

    it('calls onBack when "Go Back" is clicked', () => {
        const onBack = vi.fn();
        render(
            <UploadDocumentsKyb documents={UPLOAD_DOCUMENTS} onBack={onBack} onSubmit={vi.fn()} />
        );

        fireEvent.click(screen.getByRole('button', { name: KYB_UPLOAD.backLabel }));

        expect(onBack).toHaveBeenCalledTimes(1);
    });

    it('does not render a Terms & Conditions consent checkbox', () => {
        render(
            <UploadDocumentsKyb documents={UPLOAD_DOCUMENTS} onBack={vi.fn()} onSubmit={vi.fn()} />
        );

        expect(screen.queryByRole('checkbox')).not.toBeInTheDocument();
        expect(screen.queryByText(/Terms & Conditions/)).not.toBeInTheDocument();
    });

    // Named on screen rather than behind a click on a live button: the submit is disabled while anything
    // is missing, so a reason the user has to click to discover would never be seen.
    it('names every missing document under a disabled submit instead of a toast', async () => {
        const onSubmit = vi.fn();
        render(
            <UploadDocumentsKyb documents={UPLOAD_DOCUMENTS} onBack={vi.fn()} onSubmit={onSubmit} />
        );

        const submit = screen.getByRole('button', { name: KYB_UPLOAD.submitLabel });
        await waitFor(() => expect(submit).toBeDisabled());
        // eslint-disable-next-line no-restricted-syntax
        for (const doc of UPLOAD_DOCUMENTS) {
            // eslint-disable-next-line no-await-in-loop
            await expectSubmitBlocker(`Upload the ${doc.label}.`);
        }

        fireEvent.click(submit);
        expect(onSubmit).not.toHaveBeenCalled();
        expect(mockDispatch).not.toHaveBeenCalled();
    });

    it('heads the guidance note with a label, and lists each point under it', () => {
        render(
            <UploadDocumentsKyb documents={UPLOAD_DOCUMENTS} onBack={vi.fn()} onSubmit={vi.fn()} />
        );

        expect(screen.getByText(KYB_INTRO.infoNotesLabel)).toBeInTheDocument();
        KYB_INTRO.infoNotesTop.forEach(note => {
            expect(screen.getByText(note)).toBeInTheDocument();
        });
    });

    /**
     * The footer shows one generic sentence, per the design. Listing every missing document there pushed
     * the buttons off-screen on a long checklist; the specifics belong in the submit tooltip.
     */
    it('shows a single generic hint under the buttons, not the document list', async () => {
        render(
            <UploadDocumentsKyb documents={UPLOAD_DOCUMENTS} onBack={vi.fn()} onSubmit={vi.fn()} />
        );

        await waitFor(() =>
            expect(screen.getByRole('button', { name: KYB_UPLOAD.submitLabel })).toBeDisabled()
        );

        expect(screen.getByText(KYB_UPLOAD.submitHint)).toBeInTheDocument();
        UPLOAD_DOCUMENTS.forEach(doc => {
            expect(screen.queryByText(`Upload the ${doc.label}.`)).not.toBeInTheDocument();
        });
    });

    it('keeps both actions available side by side', async () => {
        const onBack = vi.fn();
        render(
            <UploadDocumentsKyb documents={UPLOAD_DOCUMENTS} onBack={onBack} onSubmit={vi.fn()} />
        );

        fireEvent.click(screen.getByRole('button', { name: KYB_UPLOAD.backLabel }));

        expect(onBack).toHaveBeenCalledTimes(1);
    });

    it('submits once every document is uploaded', async () => {
        const onSubmit = vi.fn();
        const { container } = render(
            <UploadDocumentsKyb documents={UPLOAD_DOCUMENTS} onBack={vi.fn()} onSubmit={onSubmit} />
        );

        const inputs = Array.from(container.querySelectorAll('input[type="file"]'));
        expect(inputs).toHaveLength(UPLOAD_DOCUMENTS.length);
        inputs.forEach((input, i) => {
            const file = new File(['x'.repeat(10)], `doc-${i}.pdf`, { type: 'application/pdf' });
            Object.defineProperty(input, 'files', { value: [file] });
            fireEvent.change(input);
        });

        // Wait for every FileReader (async) to finish staging its file in Formik state.
        await waitFor(() => {
            inputs.forEach((_, i) => expect(screen.getByText(`doc-${i}.pdf`)).toBeInTheDocument());
        });

        fireEvent.click(screen.getByRole('button', { name: KYB_UPLOAD.submitLabel }));

        await waitFor(() => expect(onSubmit).toHaveBeenCalledTimes(1));
        UPLOAD_DOCUMENTS.forEach(doc => {
            expect(screen.queryByText(`Please upload the ${doc.label}.`)).not.toBeInTheDocument();
        });
    });

    describe('the corporate agreement below the documents', () => {
        it('renders the agreement section on the same page as the uploads', () => {
            render(
                <UploadDocumentsKyb
                    documents={UPLOAD_DOCUMENTS}
                    onBack={vi.fn()}
                    onSubmit={vi.fn()}
                    agreement={agreementPanel()}
                />
            );

            expect(screen.getByText(KYB_UPLOAD.sectionTitle)).toBeInTheDocument();
            expect(screen.getByText(KYB_AGREEMENT.sectionTitle)).toBeInTheDocument();
            expect(consentBox('consentPrivacy')).toBeInTheDocument();
            expect(consentBox('consentTerms')).not.toBeInTheDocument();
        });

        it('offers no Terms & Conditions consent, which the flow no longer asks for', () => {
            render(
                <UploadDocumentsKyb
                    documents={UPLOAD_DOCUMENTS}
                    onBack={vi.fn()}
                    onSubmit={vi.fn()}
                    agreement={agreementPanel()}
                />
            );

            expect(screen.queryByText(/Terms & Conditions/)).not.toBeInTheDocument();
            expect(
                screen.queryByRole('link', { name: /Terms & Conditions/ })
            ).not.toBeInTheDocument();
        });

        it('keeps the single Submit button disabled until the agreement is signed and the consent is given', async () => {
            render(
                <UploadDocumentsKyb
                    documents={UPLOAD_DOCUMENTS}
                    onBack={vi.fn()}
                    onSubmit={vi.fn()}
                    isDocumentSaved={() => true}
                    agreement={agreementPanel({
                        esignSigned: true,
                        esignStatus: ESIGN_STATUS.SIGNED,
                    })}
                />
            );

            const submit = () => screen.getByRole('button', { name: KYB_UPLOAD.submitLabel });
            expect(submit()).toBeDisabled();
            expect(screen.getByText(KYB_AGREEMENT.submitBlocked)).toBeInTheDocument();

            acceptConsents();

            await waitFor(() => expect(submit()).toBeEnabled());
        });

        /**
         * Every business type carries required documents, so an empty checklist means it has not arrived.
         * Deriving "nothing is missing" from it would enable the submit with no documents at all — and the
         * server does not check them either.
         */
        it('stays disabled when the document checklist has not arrived', async () => {
            render(
                <UploadDocumentsKyb
                    documents={[]}
                    onBack={vi.fn()}
                    onSubmit={vi.fn()}
                    agreement={agreementPanel({
                        esignSigned: true,
                        esignStatus: ESIGN_STATUS.SIGNED,
                    })}
                />
            );

            acceptConsents();

            await waitFor(() =>
                expect(screen.getByRole('button', { name: KYB_UPLOAD.submitLabel })).toBeDisabled()
            );
            await expectSubmitBlocker(KYB_INTRO.checklistUnavailable);
        });

        it('stays disabled while the saved documents are still being restored', async () => {
            render(
                <UploadDocumentsKyb
                    documents={UPLOAD_DOCUMENTS}
                    onBack={vi.fn()}
                    onSubmit={vi.fn()}
                    restoring
                    isDocumentSaved={() => true}
                    agreement={agreementPanel({
                        esignSigned: true,
                        esignStatus: ESIGN_STATUS.SIGNED,
                    })}
                />
            );

            acceptConsents();

            await waitFor(() =>
                expect(screen.getByRole('button', { name: KYB_UPLOAD.submitLabel })).toBeDisabled()
            );
            await expectSubmitBlocker(KYB_UPLOAD.checklistPending);
        });

        // The old gate ignored the documents entirely, so a signed agreement plus both consents enabled
        // the submit with nothing uploaded — and removing a saved document re-opened that hole.
        it('stays disabled when the agreement is done but a required document is missing', async () => {
            render(
                <UploadDocumentsKyb
                    documents={UPLOAD_DOCUMENTS}
                    onBack={vi.fn()}
                    onSubmit={vi.fn()}
                    isDocumentSaved={doc => doc.key !== UPLOAD_DOCUMENTS[1].key}
                    agreement={agreementPanel({
                        esignSigned: true,
                        esignStatus: ESIGN_STATUS.SIGNED,
                    })}
                />
            );

            acceptConsents();

            await waitFor(() =>
                expect(screen.getByRole('button', { name: KYB_UPLOAD.submitLabel })).toBeDisabled()
            );
            await expectSubmitBlocker(`Upload the ${UPLOAD_DOCUMENTS[1].label}.`);
        });

        it('stays disabled while the agreement is out for signature but not yet signed', async () => {
            render(
                <UploadDocumentsKyb
                    documents={UPLOAD_DOCUMENTS}
                    onBack={vi.fn()}
                    onSubmit={vi.fn()}
                    agreement={agreementPanel({
                        esignQueued: true,
                        esignSigned: false,
                        esignStatus: ESIGN_STATUS.SENT,
                    })}
                />
            );

            acceptConsents();

            await waitFor(() =>
                expect(screen.getByRole('button', { name: KYB_UPLOAD.submitLabel })).toBeDisabled()
            );
        });

        it('stays disabled while the e-Sign agreement has not been sent yet', async () => {
            render(
                <UploadDocumentsKyb
                    documents={UPLOAD_DOCUMENTS}
                    onBack={vi.fn()}
                    onSubmit={vi.fn()}
                    agreement={agreementPanel({ esignQueued: false })}
                />
            );

            acceptConsents();

            await waitFor(() => expect(consentBox('consentPrivacy')).toBeChecked());
            expect(screen.getByRole('button', { name: KYB_UPLOAD.submitLabel })).toBeDisabled();
        });

        it('submits the documents and the signed copy together on the upload branch', async () => {
            const onSubmit = vi.fn();
            const { container } = render(
                <UploadDocumentsKyb
                    documents={UPLOAD_DOCUMENTS}
                    onBack={vi.fn()}
                    onSubmit={onSubmit}
                    isDocumentSaved={() => true}
                    uploadedDocuments={Object.fromEntries(
                        UPLOAD_DOCUMENTS.map(doc => [doc.documentName, uploadedEntry('saved.pdf')])
                    )}
                    agreement={agreementPanel({ signMethod: AGREEMENT_SIGN_METHOD.UPLOAD })}
                />
            );

            acceptConsents();

            const input = container.querySelector('input[type="file"]') as HTMLInputElement;
            pickFile(input, 'signed-agreement.pdf');
            await waitFor(() =>
                expect(screen.getByText('signed-agreement.pdf')).toBeInTheDocument()
            );

            const submit = screen.getByRole('button', { name: KYB_UPLOAD.submitLabel });
            await waitFor(() => expect(submit).toBeEnabled());
            fireEvent.click(submit);

            await waitFor(() => expect(onSubmit).toHaveBeenCalledTimes(1));
            expect(onSubmit.mock.calls[0][0]['doc_corporate-agreement']).toEqual(
                expect.objectContaining({ name: 'signed-agreement.pdf' })
            );
        });
    });
});
