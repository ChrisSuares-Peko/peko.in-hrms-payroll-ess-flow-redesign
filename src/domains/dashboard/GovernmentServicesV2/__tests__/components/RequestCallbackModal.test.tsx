import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, Mock, vi } from 'vitest';

import { showToast } from '@src/slices/apiSlice';

import { GovtServiceApiItem, getGovtServicesListApi, requestExpertCallbackApi } from '../../apis';
import RequestCallbackModal from '../../components/RequestCallbackModal';

const mockDispatch = vi.fn();

vi.mock('@src/hooks/store', () => ({
    useAppDispatch: () => mockDispatch,
    useAppSelector: vi.fn((selector: (state: unknown) => unknown) =>
        selector({ reducer: { auth: { id: 42, role: 'corporate' } } })
    ),
}));

vi.mock('../../apis', () => ({
    getGovtServicesListApi: vi.fn(),
    requestExpertCallbackApi: vi.fn(),
}));

// Lightweight Formik-bound stand-ins for the shared atomic inputs.
vi.mock('@components/atomic/inputs/TextInput', async () => {
    const { Field, getIn } = await vi.importActual<typeof import('formik')>('formik');
    return {
        default: ({ name, label, placeholder }: { name: string; label: string; placeholder?: string }) => (
            <Field name={name}>
                {({ field, form }: any) => (
                    <div>
                        <label htmlFor={name}>{label}</label>
                        <input id={name} placeholder={placeholder} {...field} />
                        {getIn(form.touched, name) && getIn(form.errors, name) && (
                            <span>{getIn(form.errors, name)}</span>
                        )}
                    </div>
                )}
            </Field>
        ),
    };
});

vi.mock('@components/atomic/inputs/SelectInput', async () => {
    const { Field } = await vi.importActual<typeof import('formik')>('formik');
    return {
        default: ({
            name,
            label,
            options,
        }: {
            name: string;
            label: string;
            options: { label: string; value: string }[];
        }) => (
            <Field name={name}>
                {({ field }: any) => (
                    <div>
                        <label htmlFor={name}>{label}</label>
                        <select id={name} {...field}>
                            <option value="">Select a service</option>
                            {options.map((o) => (
                                <option key={o.value} value={o.value}>
                                    {o.label}
                                </option>
                            ))}
                        </select>
                    </div>
                )}
            </Field>
        ),
    };
});

const makeRow = (overrides: Partial<GovtServiceApiItem>): GovtServiceApiItem => ({
    id: 'cat-1',
    service_id: 1,
    service_name: 'Trademark Registration',
    variant_name: 'Basic',
    description: null,
    market_price: 0,
    price: 0,
    government_fee_amount: 0,
    unit: null,
    currency: null,
    about: null,
    sortOrder: 0,
    status: true,
    ...overrides,
});

const onClose = vi.fn();

const fillValidForm = () => {
    fireEvent.change(screen.getByLabelText('Full name'), { target: { value: 'Asha Nair' } });
    fireEvent.change(screen.getByLabelText('Email address'), { target: { value: 'asha@example.com' } });
    fireEvent.change(screen.getByLabelText('Mobile number'), { target: { value: '9876543210' } });
};

const submit = () => fireEvent.click(screen.getByRole('button', { name: /Request callback/ }));

describe('RequestCallbackModal', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        (getGovtServicesListApi as Mock).mockResolvedValue([
            makeRow({ id: 'cat-1', service_name: 'Trademark Registration', variant_name: 'Basic' }),
            makeRow({ id: 'cat-2', service_name: 'GST Registration', variant_name: null }),
            makeRow({ id: 'cat-3', service_name: 'Inactive Service', status: false }),
        ]);
        (requestExpertCallbackApi as Mock).mockResolvedValue(true);
    });

    it('renders nothing and does not fetch services while closed', () => {
        render(<RequestCallbackModal open={false} onClose={onClose} />);

        expect(screen.queryByText('Request a callback')).not.toBeInTheDocument();
        expect(getGovtServicesListApi).not.toHaveBeenCalled();
    });

    it('renders the title, fields and actions when open', async () => {
        render(<RequestCallbackModal open onClose={onClose} />);

        expect(screen.getByText('Request a callback')).toBeInTheDocument();
        expect(screen.getByLabelText('Full name')).toBeInTheDocument();
        expect(screen.getByLabelText('Email address')).toBeInTheDocument();
        expect(screen.getByLabelText('Mobile number')).toBeInTheDocument();
        expect(screen.getByLabelText('Which service are you interested in? (optional)')).toBeInTheDocument();
        expect(screen.getByRole('button', { name: /Cancel/ })).toBeInTheDocument();
        await waitFor(() => expect(getGovtServicesListApi).toHaveBeenCalledWith(42, 'corporate'));
    });

    it('loads only active catalog rows as "service — variant" options', async () => {
        render(<RequestCallbackModal open onClose={onClose} />);

        expect(await screen.findByRole('option', { name: 'Trademark Registration — Basic' })).toBeInTheDocument();
        expect(screen.getByRole('option', { name: 'GST Registration' })).toBeInTheDocument();
        expect(screen.queryByRole('option', { name: /Inactive Service/ })).not.toBeInTheDocument();
    });

    it('does not refetch options when reopened after they loaded', async () => {
        const { rerender } = render(<RequestCallbackModal open onClose={onClose} />);
        await screen.findByRole('option', { name: 'GST Registration' });

        rerender(<RequestCallbackModal open={false} onClose={onClose} />);
        rerender(<RequestCallbackModal open onClose={onClose} />);

        expect(getGovtServicesListApi).toHaveBeenCalledTimes(1);
    });

    it('calls onClose from the Cancel button', () => {
        render(<RequestCallbackModal open onClose={onClose} />);

        fireEvent.click(screen.getByRole('button', { name: /Cancel/ }));

        expect(onClose).toHaveBeenCalled();
    });

    it('shows required-field errors and does not submit an empty form', async () => {
        render(<RequestCallbackModal open onClose={onClose} />);

        submit();

        expect(await screen.findByText('Please enter your full name')).toBeInTheDocument();
        expect(screen.getByText('Please enter your email address')).toBeInTheDocument();
        expect(screen.getByText('Please enter your mobile number')).toBeInTheDocument();
        expect(requestExpertCallbackApi).not.toHaveBeenCalled();
    });

    it('validates name characters, email format and mobile pattern', async () => {
        render(<RequestCallbackModal open onClose={onClose} />);

        fireEvent.change(screen.getByLabelText('Full name'), { target: { value: 'Asha123' } });
        fireEvent.change(screen.getByLabelText('Email address'), { target: { value: 'not-an-email' } });
        fireEvent.change(screen.getByLabelText('Mobile number'), { target: { value: '1234567890' } });
        submit();

        expect(await screen.findByText('Please enter a valid full name')).toBeInTheDocument();
        expect(screen.getByText('Please enter a valid email address')).toBeInTheDocument();
        expect(screen.getByText('Please enter a valid 10-digit mobile number')).toBeInTheDocument();
        expect(requestExpertCallbackApi).not.toHaveBeenCalled();
    });

    it('rejects a name with a trailing space', async () => {
        render(<RequestCallbackModal open onClose={onClose} />);

        fireEvent.change(screen.getByLabelText('Full name'), { target: { value: 'Asha ' } });
        submit();

        expect(await screen.findByText('Full name cannot end with a blank space')).toBeInTheDocument();
    });

    it('submits the values without a catalogId, toasts success and closes', async () => {
        render(<RequestCallbackModal open onClose={onClose} />);

        fillValidForm();
        submit();

        await waitFor(() =>
            expect(requestExpertCallbackApi).toHaveBeenCalledWith(42, 'corporate', {
                name: 'Asha Nair',
                email: 'asha@example.com',
                mobile: '9876543210',
                catalogId: undefined,
            })
        );
        await waitFor(() => expect(onClose).toHaveBeenCalled());
        expect(mockDispatch).toHaveBeenCalledWith(
            showToast({
                description: 'Request received — our expert will call you back shortly.',
                variant: 'success',
            })
        );
    });

    it('includes the selected catalogId in the request', async () => {
        render(<RequestCallbackModal open onClose={onClose} />);
        await screen.findByRole('option', { name: 'GST Registration' });

        fillValidForm();
        fireEvent.change(screen.getByLabelText('Which service are you interested in? (optional)'), {
            target: { value: 'cat-2' },
        });
        submit();

        await waitFor(() =>
            expect(requestExpertCallbackApi).toHaveBeenCalledWith(
                42,
                'corporate',
                expect.objectContaining({ catalogId: 'cat-2' })
            )
        );
    });

    it('toasts an error and keeps the modal open when the request fails', async () => {
        (requestExpertCallbackApi as Mock).mockResolvedValue(false);
        render(<RequestCallbackModal open onClose={onClose} />);

        fillValidForm();
        submit();

        await waitFor(() =>
            expect(mockDispatch).toHaveBeenCalledWith(
                showToast({
                    description: 'Could not submit your request. Please try again.',
                    variant: 'error',
                })
            )
        );
        expect(onClose).not.toHaveBeenCalled();
    });
});
