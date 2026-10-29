import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';

import { KybChecklistDocument } from '../../../../api/admin/kybStatusApi';
import InitiateKyb from '../../../../components/kyb/admin/InitiateKyb';
import { DEFAULT_BUSINESS_TYPE, KYB_INTRO } from '../../../../utils/kybData';

// antd's Select is not drivable in jsdom; a native select keeps the Formik field wiring under test.
// SelectInput passes its options as Select.Option children, not an `options` prop, so the stub has to
// accept children and expose Option.
vi.mock('antd', async importOriginal => {
    const actual = await importOriginal<typeof import('antd')>();
    const MockSelect = ({ value, onChange, placeholder, children, disabled }: any) => (
        <select
            aria-label={placeholder}
            disabled={disabled}
            value={value ?? ''}
            onChange={event => onChange(event.target.value || undefined)}
        >
            <option value="">{placeholder}</option>
            {children}
        </select>
    );
    MockSelect.Option = ({ value, children }: any) => <option value={value}>{children}</option>;
    return { ...actual, Select: MockSelect };
});

const doc = (over: Partial<KybChecklistDocument> = {}): KybChecklistDocument => ({
    key: 'gst',
    documentName: 'GST_Certificate',
    label: 'GST Certificate',
    uploadLabel: 'Upload GST Certificate',
    hint: 'Company seal + authorised signatory signature required',
    required: true,
    ...over,
});

const LIMITED = [
    doc({ key: 'coi', label: 'Certificate of Incorporation' }),
    doc(),
    doc({ key: 'moa', label: 'MoA (Memorandum of Association)' }),
];
const PROPRIETORSHIP = [doc()];
const SOCIETY = [
    doc(),
    doc({
        key: 'darpan-id',
        label: 'Darpan ID',
        hint: 'Optional — submit if available',
        required: false,
    }),
];

const CATALOGUE: Record<string, KybChecklistDocument[]> = {
    PRIVATE_PUBLIC_LIMITED: LIMITED,
    PROPRIETORSHIP,
    SOCIETY_TRUST: SOCIETY,
};

const OPTIONS = [
    { label: 'Private / Public Limited', value: 'PRIVATE_PUBLIC_LIMITED' },
    { label: 'Proprietorship', value: 'PROPRIETORSHIP' },
    { label: 'Society / Trust', value: 'SOCIETY_TRUST' },
];

const setup = (props: Partial<React.ComponentProps<typeof InitiateKyb>> = {}) =>
    render(
        <InitiateKyb
            onInitiate={vi.fn()}
            onBack={vi.fn()}
            options={OPTIONS}
            documentsFor={type => (type ? (CATALOGUE[type] ?? []) : [])}
            {...props}
        />
    );

const businessTypeField = () => screen.getByLabelText(KYB_INTRO.businessTypePlaceholder);
const cta = () => screen.getByRole('button', { name: KYB_INTRO.ctaLabel });
const choose = (value: string) => fireEvent.change(businessTypeField(), { target: { value } });

describe('InitiateKyb', () => {
    it('renders the intro header', () => {
        setup();

        expect(screen.getByText(KYB_INTRO.title)).toBeInTheDocument();
        expect(screen.getByText(KYB_INTRO.checklistTitle)).toBeInTheDocument();
    });

    it('lists all four document rules', () => {
        setup();

        KYB_INTRO.infoNotes.forEach(note => {
            expect(screen.getByText(note)).toBeInTheDocument();
        });
    });

    it('offers the business types the backend returned', () => {
        setup();

        OPTIONS.forEach(option => {
            expect(screen.getByRole('option', { name: option.label })).toBeInTheDocument();
        });
    });

    describe('checklist per business type', () => {
        it('shows nothing to gather until a type is chosen', () => {
            setup();

            expect(screen.getByText(KYB_INTRO.checklistEmpty)).toBeInTheDocument();
        });

        it('shows the documents for the chosen type', async () => {
            setup();

            choose('PRIVATE_PUBLIC_LIMITED');

            await waitFor(() =>
                expect(screen.getByText('Certificate of Incorporation')).toBeInTheDocument()
            );
            expect(screen.getByText('MoA (Memorandum of Association)')).toBeInTheDocument();
        });

        // The whole point: a proprietorship must not be asked for incorporation papers.
        it('swaps the list when the type changes, dropping documents that no longer apply', async () => {
            setup();

            choose('PRIVATE_PUBLIC_LIMITED');
            await waitFor(() =>
                expect(screen.getByText('Certificate of Incorporation')).toBeInTheDocument()
            );

            choose('PROPRIETORSHIP');

            await waitFor(() =>
                expect(screen.queryByText('Certificate of Incorporation')).not.toBeInTheDocument()
            );
            expect(screen.getByText('GST Certificate')).toBeInTheDocument();
        });

        it('states the requirement behind each document', async () => {
            setup();

            choose('PROPRIETORSHIP');

            await waitFor(() =>
                expect(
                    screen.getByText('Company seal + authorised signatory signature required')
                ).toBeInTheDocument()
            );
        });

        it('marks an optional document as optional', async () => {
            setup();

            choose('SOCIETY_TRUST');

            await waitFor(() => expect(screen.getByText('Darpan ID')).toBeInTheDocument());
            expect(screen.getByText(KYB_INTRO.optionalSuffix)).toBeInTheDocument();
        });

        it('marks nothing optional when every document is required', async () => {
            setup();

            choose('PROPRIETORSHIP');

            await waitFor(() => expect(screen.getByText('GST Certificate')).toBeInTheDocument());
            expect(screen.queryByText(KYB_INTRO.optionalSuffix)).not.toBeInTheDocument();
        });
    });

    describe('going back', () => {
        it('offers a way back to the Corporate Cards landing page', () => {
            setup();

            expect(screen.getByText('Go Back')).toBeInTheDocument();
        });

        it('asks the parent to go back rather than leaving the page itself', () => {
            const onBack = vi.fn();
            setup({ onBack });

            fireEvent.click(screen.getByText('Go Back'));

            expect(onBack).toHaveBeenCalledTimes(1);
        });
    });

    describe('gating', () => {
        it('blocks the CTA until a business type is chosen', async () => {
            setup();

            await waitFor(() => expect(cta()).toBeDisabled());
        });

        it('enables the CTA once a type with documents is chosen', async () => {
            setup();

            choose('PROPRIETORSHIP');

            await waitFor(() => expect(cta()).toBeEnabled());
        });

        // Submitting with an empty checklist would send the corporate to an upload step with no fields.
        it('keeps the CTA blocked for a type the catalogue has no documents for', async () => {
            setup({ documentsFor: () => [] });

            choose('PROPRIETORSHIP');

            await waitFor(() => expect(cta()).toBeDisabled());
        });

        it('hands the chosen business type to onInitiate', async () => {
            const onInitiate = vi.fn();
            setup({ onInitiate });

            choose('SOCIETY_TRUST');
            await waitFor(() => expect(cta()).toBeEnabled());
            fireEvent.click(cta());

            await waitFor(() => expect(onInitiate).toHaveBeenCalledWith('SOCIETY_TRUST'));
        });

        it('restores a previously chosen business type', async () => {
            setup({ businessType: 'PROPRIETORSHIP' });

            expect(businessTypeField()).toHaveValue('PROPRIETORSHIP');
            await waitFor(() => expect(cta()).toBeEnabled());
        });
    });

    describe('default business type', () => {
        const WITH_DEFAULT = [
            { label: 'Private Limited', value: DEFAULT_BUSINESS_TYPE },
            ...OPTIONS,
        ];
        const documentsForDefault = (type?: string) =>
            type === DEFAULT_BUSINESS_TYPE ? LIMITED : (CATALOGUE[type ?? ''] ?? []);

        it('preselects Private Limited', async () => {
            setup({ options: WITH_DEFAULT, documentsFor: documentsForDefault });

            expect(businessTypeField()).toHaveValue(DEFAULT_BUSINESS_TYPE);
            expect(screen.getByText('Certificate of Incorporation')).toBeInTheDocument();
            await waitFor(() => expect(cta()).toBeEnabled());
        });

        it('submits the preselected type without the user touching the picker', async () => {
            const onInitiate = vi.fn();
            setup({ options: WITH_DEFAULT, documentsFor: documentsForDefault, onInitiate });

            await waitFor(() => expect(cta()).toBeEnabled());
            fireEvent.click(cta());

            await waitFor(() => expect(onInitiate).toHaveBeenCalledWith(DEFAULT_BUSINESS_TYPE));
        });

        it('keeps a saved business type instead of the default', () => {
            setup({
                options: WITH_DEFAULT,
                documentsFor: documentsForDefault,
                businessType: 'SOCIETY_TRUST',
            });

            expect(businessTypeField()).toHaveValue('SOCIETY_TRUST');
        });

        it('lets the user change away from the default', async () => {
            setup({ options: WITH_DEFAULT, documentsFor: documentsForDefault });

            choose('PROPRIETORSHIP');

            await waitFor(() => expect(businessTypeField()).toHaveValue('PROPRIETORSHIP'));
            expect(screen.queryByText('Certificate of Incorporation')).not.toBeInTheDocument();
        });

        it('applies the default once the checklist options arrive', async () => {
            const { rerender } = render(
                <InitiateKyb
                    onInitiate={vi.fn()}
                    onBack={vi.fn()}
                    options={[]}
                    documentsFor={documentsForDefault}
                    isLoading
                />
            );

            expect(businessTypeField()).toHaveValue('');

            rerender(
                <InitiateKyb
                    onInitiate={vi.fn()}
                    onBack={vi.fn()}
                    options={WITH_DEFAULT}
                    documentsFor={documentsForDefault}
                />
            );

            await waitFor(() => expect(businessTypeField()).toHaveValue(DEFAULT_BUSINESS_TYPE));
        });

        it('selects nothing when the backend does not offer Private Limited', () => {
            setup({ options: OPTIONS });

            expect(businessTypeField()).toHaveValue('');
        });
    });

    describe('when the checklist cannot be loaded', () => {
        it('says so and offers a retry rather than a silently empty list', () => {
            const onRetry = vi.fn();
            setup({ failed: true, options: [], documentsFor: () => [], onRetry });

            expect(screen.getByText(KYB_INTRO.checklistUnavailable)).toBeInTheDocument();
            fireEvent.click(screen.getByRole('button', { name: KYB_INTRO.retryLabel }));
            expect(onRetry).toHaveBeenCalledTimes(1);
        });

        it('disables the business type picker so nothing can be chosen blind', () => {
            setup({ failed: true, options: [], documentsFor: () => [] });

            expect(businessTypeField()).toBeDisabled();
        });
    });

    it('does not render a Terms & Conditions consent checkbox', () => {
        setup();

        expect(screen.queryByRole('checkbox')).not.toBeInTheDocument();
        expect(screen.queryByText(/Terms & Conditions/)).not.toBeInTheDocument();
    });

    // ADO 28847: a green check mark next to every document — before KYB is even started — misled
    // users into thinking those documents were already verified/uploaded. This is a "keep ready"
    // reminder list, not a completion tracker, so it should show no checked/verified state at all.
    it('does not render a misleading verified/checked icon next to any document', () => {
        const { container } = setup();

        expect(container.querySelector('.anticon-check-circle')).not.toBeInTheDocument();
    });
});
