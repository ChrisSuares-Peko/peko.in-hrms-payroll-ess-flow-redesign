import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { Formik } from 'formik';
import { describe, it, expect, vi, beforeEach } from 'vitest';

import CorporateAgreementSection from '../../../../components/kyb/admin/CorporateAgreementSection';
import { EMPTY_AGREEMENT, ESIGN_STATUS } from '../../../../hooks/admin/useCorporateAgreement';
import { AGREEMENT_MAX } from '../../../../schema/corporateAgreementSchema';
import {
    AGREEMENT_LABELS as L,
    AGREEMENT_SIGN_METHOD,
    CORPORATE_AGREEMENT_DOCUMENT,
    KYB_AGREEMENT,
} from '../../../../utils/kybData';

const mockDispatch = vi.fn();
vi.mock('@hooks/store', () => ({
    useAppDispatch: () => mockDispatch,
}));

vi.mock('@components/atomic/inputs/SelectInput', () => ({
    default: ({ name, label, options }: { name: string; label: string; options: unknown[] }) => (
        <label htmlFor={name}>
            {label}
            <select id={name} name={name} data-options={(options ?? []).length} />
        </label>
    ),
}));

const mockStateOptions = vi.fn(() => ({
    stateOptions: [
        { label: 'Maharashtra', value: 'Maharashtra' },
        { label: 'Odisha', value: 'Odisha' },
    ],
    isLoading: false,
}));
vi.mock('@hooks/useIndianStates', () => ({ default: () => mockStateOptions() }));

/** Every mandatory field filled and valid, so the CTA is genuinely enabled. */
const VALID_AGREEMENT = {
    ...EMPTY_AGREEMENT,
    entityName: 'Acme Technologies Private Limited',
    regAddress: '221B Baker Street, Andheri East',
    regCity: 'Mumbai',
    regState: 'Maharashtra',
    regPinCode: '400069',
    regTelephone: '02212345678',
    regEmail: 'ops@acme.com',
    billSameAsRegistered: true,
    gstNumber: '27AAPFU0939F1ZV',
    panNumber: 'AAPFU0939F',
    bankName: 'HDFC Bank',
    bankBranch: 'Andheri East',
    bankAccountNumber: '50100123456789',
    bankIfsc: 'HDFC0000123',
    bankCity: 'Mumbai',
    officialContactName: 'Ravi Kumar',
    officialContactMobile: '9876543210',
    officialContactEmail: 'ravi@acme.com',
    salespersonName: 'Priya Nair',
    salespersonMobile: '9876543211',
    salespersonEmail: 'priya@acme.com',
    signatoryName: 'Ravi Kumar',
    signatoryContact: '9876543210',
    signatoryEmail: 'ravi@acme.com',
    signatoryIsPep: false,
};

const renderSection = (props: Partial<Parameters<typeof CorporateAgreementSection>[0]> = {}) =>
    render(
        <Formik initialValues={{ 'doc_corporate-agreement': null }} onSubmit={vi.fn()}>
            <CorporateAgreementSection
                signMethod={AGREEMENT_SIGN_METHOD.E_SIGN}
                onSignMethodChange={vi.fn()}
                initialValues={EMPTY_AGREEMENT}
                onSendForEsign={vi.fn()}
                onDownloadTemplate={vi.fn()}
                {...props}
            />
        </Formik>
    );

describe('CorporateAgreementSection', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('offers both signing methods', () => {
        renderSection();

        expect(screen.getByText(KYB_AGREEMENT.methodESign)).toBeInTheDocument();
        expect(screen.getByText(KYB_AGREEMENT.methodUpload)).toBeInTheDocument();
    });

    it('reports the chosen method back to the caller', () => {
        const onSignMethodChange = vi.fn();
        renderSection({ onSignMethodChange });

        fireEvent.click(screen.getByText(KYB_AGREEMENT.methodUpload));

        expect(onSignMethodChange).toHaveBeenCalledWith(AGREEMENT_SIGN_METHOD.UPLOAD);
    });

    it('renders the agreement form and hides the template download on the e-Sign branch', () => {
        renderSection();

        expect(screen.getByText(KYB_AGREEMENT.detailsTitle)).toBeInTheDocument();
        Object.values(KYB_AGREEMENT.groups).forEach(group => {
            expect(screen.getByText(group)).toBeInTheDocument();
        });
        expect(
            screen.queryByRole('button', { name: new RegExp(KYB_AGREEMENT.downloadLabel) })
        ).not.toBeInTheDocument();
    });

    it('renders the template download and signed-copy upload, and hides the form, on the upload branch', () => {
        const { container } = renderSection({ signMethod: AGREEMENT_SIGN_METHOD.UPLOAD });

        expect(
            screen.getByRole('button', { name: new RegExp(KYB_AGREEMENT.downloadLabel) })
        ).toBeInTheDocument();
        expect(screen.getByText(CORPORATE_AGREEMENT_DOCUMENT.uploadLabel)).toBeInTheDocument();
        expect(container.querySelectorAll('input[type="file"]').length).toBeGreaterThan(0);
        expect(screen.getByText(KYB_AGREEMENT.detailsTitle).closest('.hidden')).toBeTruthy();
    });

    it('shows the form on the e-Sign branch', () => {
        renderSection();

        expect(screen.getByText(KYB_AGREEMENT.detailsTitle).closest('.hidden')).toBeNull();
    });

    it('keeps what was typed when the signing method is switched away and back', () => {
        const { rerender } = renderSection();

        const entity = screen.getByPlaceholderText(L.entityName);
        fireEvent.change(entity, { target: { value: 'Acme Technologies Private Limited' } });

        const at = (method: (typeof AGREEMENT_SIGN_METHOD)[keyof typeof AGREEMENT_SIGN_METHOD]) =>
            rerender(
                <Formik initialValues={{ 'doc_corporate-agreement': null }} onSubmit={vi.fn()}>
                    <CorporateAgreementSection
                        signMethod={method}
                        onSignMethodChange={vi.fn()}
                        initialValues={EMPTY_AGREEMENT}
                        onSendForEsign={vi.fn()}
                        onDownloadTemplate={vi.fn()}
                    />
                </Formik>
            );

        at(AGREEMENT_SIGN_METHOD.UPLOAD);
        at(AGREEMENT_SIGN_METHOD.E_SIGN);

        expect(screen.getByPlaceholderText(L.entityName)).toHaveValue(
            'Acme Technologies Private Limited'
        );
    });

    it('downloads the template on request', () => {
        const onDownloadTemplate = vi.fn();
        renderSection({ signMethod: AGREEMENT_SIGN_METHOD.UPLOAD, onDownloadTemplate });

        fireEvent.click(
            screen.getByRole('button', { name: new RegExp(KYB_AGREEMENT.downloadLabel) })
        );

        expect(onDownloadTemplate).toHaveBeenCalledTimes(1);
    });

    it('warns and disables the download when the template is unavailable', () => {
        renderSection({ signMethod: AGREEMENT_SIGN_METHOD.UPLOAD, templateAvailable: false });

        expect(screen.getByText(KYB_AGREEMENT.templateUnavailable)).toBeInTheDocument();
        expect(
            screen.getByRole('button', { name: new RegExp(KYB_AGREEMENT.downloadLabel) })
        ).toBeDisabled();
    });

    it('blocks "Send for e-Signature" until the agreement details are valid', async () => {
        const onSendForEsign = vi.fn();
        renderSection({ onSendForEsign });

        const cta = screen.getByRole('button', { name: KYB_AGREEMENT.esignCta });
        await waitFor(() => expect(cta).toBeDisabled());
        expect(screen.getByText(KYB_AGREEMENT.esignIncomplete)).toBeInTheDocument();

        fireEvent.click(cta);
        expect(onSendForEsign).not.toHaveBeenCalled();
    });

    describe('the state selects', () => {
        const optionCount = (container: HTMLElement, name: string) =>
            container.querySelector(`select[name="${name}"]`)?.getAttribute('data-options');

        it('feeds both selects from the shared indian-states source', () => {
            const { container } = renderSection({
                initialValues: { ...EMPTY_AGREEMENT, billSameAsRegistered: false },
            });

            expect(optionCount(container, 'regState')).toBe('2');
            expect(optionCount(container, 'billState')).toBe('2');
        });

        it('renders no options of its own while the states are still loading', () => {
            mockStateOptions.mockReturnValueOnce({ stateOptions: [], isLoading: true });
            const { container } = renderSection();

            expect(optionCount(container, 'regState')).toBe('0');
        });
    });

    /**
     * The rule alone is not enough: without a cap on the control, someone types or pastes 400 characters,
     * gets an error they can only fix by deleting, and the draft autosave has already tried to store it.
     * The cap and the rule are the same number by construction — both read AGREEMENT_MAX.
     */
    describe('length caps', () => {
        const inputFor = (container: HTMLElement, name: string) =>
            container.querySelector(`input[name="${name}"]`) as HTMLInputElement;

        /**
         * Asserted on the attribute, not by typing: jsdom does not enforce maxlength on a programmatic
         * value change, so a length assertion here would pass whatever the component rendered. The
         * attribute is what a real browser enforces, on typing and on paste alike.
         */
        it('stops the Name of the Entity at its limit instead of accepting anything', () => {
            const { container } = renderSection();

            expect(inputFor(container, 'entityName')).toHaveAttribute(
                'maxlength',
                String(AGREEMENT_MAX.entityName)
            );
        });

        it.each([
            ['entityName', AGREEMENT_MAX.entityName],
            ['regAddress', AGREEMENT_MAX.address],
            ['regCity', AGREEMENT_MAX.city],
            ['bankName', AGREEMENT_MAX.bankName],
            ['bankBranch', AGREEMENT_MAX.bankBranch],
            ['officialContactName', AGREEMENT_MAX.contactName],
            ['salespersonName', AGREEMENT_MAX.contactName],
            ['signatoryName', AGREEMENT_MAX.contactName],
            ['regEmail', AGREEMENT_MAX.email],
            ['regTelephone', AGREEMENT_MAX.telephone],
        ])('caps %s at %i', (name, max) => {
            const { container } = renderSection();

            expect(inputFor(container, name)).toHaveAttribute('maxlength', String(max));
        });

        // A control that lets someone exceed a rule, or stops them short of it, is a bug either way.
        it('leaves no free-text field uncapped', () => {
            const { container } = renderSection();
            const uncapped = Array.from(container.querySelectorAll('input[type="text"]'))
                .filter(el => !el.getAttribute('maxlength'))
                .map(el => (el as HTMLInputElement).name);

            expect(uncapped).toEqual([]);
        });
    });

    /**
     * The button is gated on Formik's isValid, but a field's own message is gated on `touched` — so an
     * untouched or optional field can hold the submit shut with nothing on screen. The tooltip is the only
     * place those reasons are visible.
     */
    it('names what is blocking "Send for e-Signature" on hover', async () => {
        renderSection();

        const cta = screen.getByRole('button', { name: KYB_AGREEMENT.esignCta });
        await waitFor(() => expect(cta).toBeDisabled());

        fireEvent.mouseEnter(cta.parentElement as HTMLElement);

        expect(await screen.findByText(KYB_AGREEMENT.esignBlockedTitle)).toBeInTheDocument();
        expect(await screen.findByText(`Please enter the ${L.entityName}`)).toBeInTheDocument();
    });

    /**
     * A browser dispatches no mouse events for a disabled control, and they do not bubble to the wrapper
     * either — so without pointer-events:none the tooltip is unreachable in a real browser however well it
     * renders under a synthetic mouseEnter on the wrapper.
     */
    it('lets the hover through to the wrapper while the button is disabled', async () => {
        renderSection();

        const cta = screen.getByRole('button', { name: KYB_AGREEMENT.esignCta });
        await waitFor(() => expect(cta).toBeDisabled());

        expect(cta).toHaveStyle({ pointerEvents: 'none' });
    });

    it('takes the hover block off again once the button is live', async () => {
        renderSection({ initialValues: VALID_AGREEMENT, addressProofFileName: 'proof.pdf' });

        const cta = screen.getByRole('button', { name: KYB_AGREEMENT.esignCta });
        await waitFor(() => expect(cta).toBeEnabled());

        expect(cta).not.toHaveStyle({ pointerEvents: 'none' });
    });

    it('offers no tooltip once the details are valid', async () => {
        renderSection({ initialValues: VALID_AGREEMENT, addressProofFileName: 'proof.pdf' });

        const cta = screen.getByRole('button', { name: KYB_AGREEMENT.esignCta });
        await waitFor(() => expect(cta).toBeEnabled());

        fireEvent.mouseEnter(cta.parentElement as HTMLElement);

        await waitFor(() =>
            expect(screen.queryByText(KYB_AGREEMENT.esignBlockedTitle)).not.toBeInTheDocument()
        );
    });

    /**
     * Mirrors the signed-copy field, which has always guarded this: nothing exists server-side to delete
     * unless the upload actually saved, and asking anyway surfaces a removal failure that never happened.
     */
    describe('clearing the address proof', () => {
        const removeIcon = (container: HTMLElement) =>
            container.querySelectorAll('.anticon-close-circle')[0] as Element;

        it('asks the caller to delete one that was saved', () => {
            const onAddressProofRemoved = vi.fn();
            const { container } = renderSection({
                addressProofFileName: 'proof.pdf',
                onAddressProofRemoved,
            });

            fireEvent.click(removeIcon(container));

            expect(onAddressProofRemoved).toHaveBeenCalledTimes(1);
        });

        it('sends no delete for one that never reached the server', async () => {
            const onAddressProofRemoved = vi.fn();
            const { container } = renderSection({ onAddressProofRemoved });
            const input = container.querySelectorAll('input[type="file"]')[0];
            const file = new File(['x'.repeat(10)], 'proof.pdf', { type: 'application/pdf' });
            Object.defineProperty(input, 'files', { value: [file] });
            fireEvent.change(input);

            // The file is read asynchronously, so the clear control only appears once it is staged —
            // without this wait there is nothing to click and the test proves nothing.
            await waitFor(() => expect(removeIcon(container)).toBeTruthy());
            fireEvent.click(removeIcon(container));

            expect(onAddressProofRemoved).not.toHaveBeenCalled();
        });
    });

    it('replaces the whole form with the awaiting-signature card once the agreement has gone out', () => {
        renderSection({ esignStatus: ESIGN_STATUS.SENT });

        expect(screen.getByText(KYB_AGREEMENT.esignAwaiting.badge)).toBeInTheDocument();
        expect(screen.getByText(KYB_AGREEMENT.esignAwaiting.title)).toBeInTheDocument();
        expect(screen.getByText(KYB_AGREEMENT.esignChecking)).toBeInTheDocument();
        expect(screen.queryByText(KYB_AGREEMENT.detailsTitle)).not.toBeInTheDocument();
        expect(
            screen.queryByRole('button', { name: KYB_AGREEMENT.esignCta })
        ).not.toBeInTheDocument();
    });

    it('shows the completed card, with no polling row, once the signature is done', () => {
        renderSection({ esignStatus: ESIGN_STATUS.SIGNED });

        expect(screen.getByText(KYB_AGREEMENT.esignSigned.badge)).toBeInTheDocument();
        expect(screen.getByText(KYB_AGREEMENT.esignSigned.title)).toBeInTheDocument();
        expect(screen.queryByText(KYB_AGREEMENT.esignChecking)).not.toBeInTheDocument();
    });

    it('keeps the signing-method choice visible while awaiting the signature', () => {
        renderSection({ esignStatus: ESIGN_STATUS.SENT });

        expect(screen.getByText(KYB_AGREEMENT.methodESign)).toBeInTheDocument();
        expect(screen.getByText(KYB_AGREEMENT.methodUpload)).toBeInTheDocument();
    });

    it('hides the billing address fields once they mirror the registered address', async () => {
        const { container } = renderSection();

        expect(container.querySelector('[name="billAddress"]')).toBeInTheDocument();

        fireEvent.click(screen.getByText(KYB_AGREEMENT.sameAsRegistered));

        await waitFor(() =>
            expect(container.querySelector('[name="billAddress"]')).not.toBeInTheDocument()
        );
        expect(container.querySelector('[name="regAddress"]')).toBeInTheDocument();
    });

    describe('address proof', () => {
        it('collects it inside Registration Details on the e-Sign branch', () => {
            const { container } = renderSection();

            expect(screen.getByText(KYB_AGREEMENT.groups.registration)).toBeInTheDocument();
            expect(screen.getAllByText(L.addressProof).length).toBeGreaterThan(0);
            expect(container.querySelectorAll('input[type="file"]')).toHaveLength(1);
        });

        it('is not shown on the upload-signed-copy branch', () => {
            renderSection({ signMethod: AGREEMENT_SIGN_METHOD.UPLOAD });

            expect(screen.getByText(L.addressProof).closest('.hidden')).toBeTruthy();
        });

        it('hands the chosen file up immediately, so it is saved like every other document', async () => {
            const onAddressProofSelected = vi.fn();
            const { container } = renderSection({ onAddressProofSelected });

            const input = container.querySelector('input[type="file"]') as HTMLInputElement;
            const file = new File(['x'.repeat(10)], 'address-proof.pdf', {
                type: 'application/pdf',
            });
            Object.defineProperty(input, 'files', { value: [file] });
            fireEvent.change(input);

            await waitFor(() => expect(onAddressProofSelected).toHaveBeenCalledTimes(1));
            expect(onAddressProofSelected).toHaveBeenCalledWith(
                expect.objectContaining({ name: 'address-proof.pdf', format: 'pdf' })
            );
        });

        it('shows one already stored on the server, and lets it be removed', () => {
            const onAddressProofRemoved = vi.fn();
            const { container } = renderSection({
                addressProofFileName: 'stored-proof.pdf',
                addressProofSaveState: 'saved',
                onAddressProofRemoved,
            });

            expect(screen.getByText('stored-proof.pdf')).toBeInTheDocument();

            fireEvent.click(container.querySelector('.anticon-close-circle') as Element);

            expect(onAddressProofRemoved).toHaveBeenCalledTimes(1);
        });
    });

    describe('the signed copy', () => {
        const uploadBranch = (overrides = {}) =>
            renderSection({ signMethod: AGREEMENT_SIGN_METHOD.UPLOAD, ...overrides });

        it('hands the chosen file up immediately rather than holding it until submit', async () => {
            const onSignedCopySelected = vi.fn();
            const { container } = uploadBranch({ onSignedCopySelected });

            const input = container.querySelector('input[type="file"]') as HTMLInputElement;
            const file = new File(['x'.repeat(10)], 'signed.pdf', { type: 'application/pdf' });
            Object.defineProperty(input, 'files', { value: [file] });
            fireEvent.change(input);

            await waitFor(() => expect(onSignedCopySelected).toHaveBeenCalledTimes(1));
            expect(onSignedCopySelected).toHaveBeenCalledWith(
                expect.objectContaining({ name: 'signed.pdf', format: 'pdf' })
            );
        });

        it('shows a signed copy stored before the refresh, and reports its removal', () => {
            const onSignedCopyRemoved = vi.fn();
            const { container } = uploadBranch({
                signedCopyFileName: 'signed.pdf',
                signedCopySaveState: 'saved',
                onSignedCopyRemoved,
            });

            expect(screen.getByText('signed.pdf')).toBeInTheDocument();
            expect(screen.getByText('Saved')).toBeInTheDocument();

            fireEvent.click(container.querySelector('.anticon-close-circle') as Element);
            expect(onSignedCopyRemoved).toHaveBeenCalledTimes(1);
        });
    });

    describe('before the saved draft has loaded', () => {
        it('does not mount the form, so nothing typed can be wiped by the restore', () => {
            renderSection({ draftReady: false });

            expect(screen.queryByText(KYB_AGREEMENT.detailsTitle)).not.toBeInTheDocument();
            expect(
                screen.queryByRole('button', { name: KYB_AGREEMENT.esignCta })
            ).not.toBeInTheDocument();
        });

        it('mounts the form once the draft is in', () => {
            renderSection({ draftReady: true });

            expect(screen.getByText(KYB_AGREEMENT.detailsTitle)).toBeInTheDocument();
        });
    });
});

/**
 * After a rejection the corporate resubmits with the address proof already on the server. It arrives from
 * its own fetch, after the agreement form has already mounted and validated.
 */
describe('CorporateAgreementSection — address proof restored after the form mounted', () => {
    const renderWithProof = (addressProofFileName?: string) =>
        render(
            <Formik initialValues={{ 'doc_corporate-agreement': null }} onSubmit={vi.fn()}>
                <CorporateAgreementSection
                    signMethod={AGREEMENT_SIGN_METHOD.E_SIGN}
                    onSignMethodChange={vi.fn()}
                    initialValues={VALID_AGREEMENT}
                    onSendForEsign={vi.fn()}
                    onDownloadTemplate={vi.fn()}
                    addressProofFileName={addressProofFileName}
                />
            </Formik>
        );

    const cta = () => screen.getByRole('button', { name: KYB_AGREEMENT.esignCta });

    it('enables Send for e-signature once the stored proof arrives', async () => {
        const { rerender } = renderWithProof(undefined);

        await waitFor(() => expect(cta()).toBeDisabled());

        rerender(
            <Formik initialValues={{ 'doc_corporate-agreement': null }} onSubmit={vi.fn()}>
                <CorporateAgreementSection
                    signMethod={AGREEMENT_SIGN_METHOD.E_SIGN}
                    onSignMethodChange={vi.fn()}
                    initialValues={VALID_AGREEMENT}
                    onSendForEsign={vi.fn()}
                    onDownloadTemplate={vi.fn()}
                    addressProofFileName="stored-proof.pdf"
                />
            </Formik>
        );

        await waitFor(() => expect(cta()).toBeEnabled());
    });

    it('is enabled from the start when the stored proof is already known', async () => {
        renderWithProof('stored-proof.pdf');

        await waitFor(() => expect(cta()).toBeEnabled());
    });
});
