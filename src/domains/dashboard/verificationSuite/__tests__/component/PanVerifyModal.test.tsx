/* eslint-disable react/button-has-type */
import React from 'react';

import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { Formik } from 'formik';
import { describe, it, expect, vi, beforeEach } from 'vitest';

import PanVerifyModal from '../../components/PanVerifyModal';
import useAadhaarVerification from '../../hooks/useAadhaarVerification';
import useVerifyApi from '../../hooks/useVerify';
import { generateYupSchema } from '../../schema';

vi.mock('../../hooks/useVerify', () => ({ default: vi.fn() }));
vi.mock('../../hooks/useAadhaarVerification', () => ({ default: vi.fn() }));
vi.mock('../../api', () => ({ AdharOcr: vi.fn() }));

vi.mock('@src/hooks/store', () => ({
    useAppSelector: (selector: any) =>
        selector({
            reducer: {
                auth: { id: '123', role: 'corporate' },
                user: { user: { name: 'Test User', balance: 100 } },
            },
        }),
}));

const mockDispatch = vi.fn();
vi.mock('react-redux', () => ({
    useDispatch: () => mockDispatch,
}));

vi.mock('@src/slices/apiSlice', () => ({
    showToast: (payload: any) => ({ type: 'toast/show', payload }),
}));
vi.mock('@src/slices/userSlice', () => ({
    setUserInfo: (payload: any) => ({ type: 'user/setUserInfo', payload }),
}));

vi.mock('@components/atomic/inputs/DatePickerInput', () => ({
    default: ({ name, label }: any) => <div data-testid={`date-input-${name}`}>{label}</div>,
}));
vi.mock('@components/atomic/inputs/SelectInput', () => ({
    default: ({ name, placeholder }: any) => (
        <div data-testid={`select-input-${name}`}>{placeholder}</div>
    ),
}));
vi.mock('../../components/VerificationInput', () => ({
    default: ({ name, label }: any) => <div data-testid={`text-input-${name}`}>{label}</div>,
}));

vi.mock('../../components/SuccessModal', () => ({
    default: ({ data }: any) => <div data-testid="success-modal">{JSON.stringify(data)}</div>,
}));
vi.mock('../../components/AadhaarConsentModal', () => ({
    default: ({ isOpen, link }: any) =>
        isOpen ? <div data-testid="aadhaar-consent-modal">{link}</div> : null,
}));

// Following the pattern in DocModal.test.tsx: CustomModalWithForm is stubbed out
// so we can invoke handleFormSubmit directly without driving real antd form
// interactions. `mockSubmitValues` lets each test control what "submitting the
// form" would have produced. The 'dropdown'/'fileUpload' input branches in
// PanVerifyModal.tsx render a raw formik <Field> directly (not wrapped by a
// mockable input component), so `children` still needs a real <Formik> context
// underneath this stub or those Fields throw "formik.getFieldProps is not a function".
let mockSubmitValues: any = {};
vi.mock('@components/molecular/modals/CustomModalWithForm', () => ({
    default: ({ children, modalTitle, handleFormSubmit, initialValues }: any) => (
        <div>
            <h1>{modalTitle}</h1>
            <Formik initialValues={initialValues} onSubmit={() => {}}>
                {() => children}
            </Formik>
            <button onClick={() => handleFormSubmit(mockSubmitValues)}>Submit</button>
        </div>
    ),
}));

const allTypesInputComponents = [
    {
        type: 'input',
        name: 'pan',
        label: 'PAN',
        placeholder: 'Enter PAN',
        min: 10,
        max: 10,
        required: true,
    },
    {
        type: 'date',
        name: 'date_of_birth',
        label: 'Date of Birth',
        placeholder: 'Enter Date of Birth',
        required: true,
    },
    {
        type: 'select',
        name: 'state_code',
        label: 'State',
        placeholder: 'Select state',
        required: true,
        options: [],
    },
    {
        type: 'dropdown',
        name: 'fy',
        label: 'Financial year',
        placeholder: 'select year',
        required: true,
    },
    {
        type: 'fileUpload',
        name: 'image',
        label: 'Upload Image',
        placeholder: 'Upload Image',
    },
];

describe('PanVerifyModal', () => {
    const mockVerifyBank = vi.fn();
    const mockGenerateLink = vi.fn();

    beforeEach(() => {
        vi.clearAllMocks();
        mockSubmitValues = {};
        (useVerifyApi as unknown as ReturnType<typeof vi.fn>).mockReturnValue({
            verifyBank: mockVerifyBank,
            isLoading: false,
        });
        (useAadhaarVerification as unknown as ReturnType<typeof vi.fn>).mockReturnValue({
            generateLink: mockGenerateLink,
            isGeneratingLink: false,
        });
    });

    it('renders the right input component for every inputComponents type', () => {
        render(
            <PanVerifyModal
                open
                handleCancel={vi.fn()}
                inputComponents={allTypesInputComponents}
                title="GST Return Compliance Check"
                accessKeys="gst_return_check"
                serviceName="GSTIN"
            />
        );

        expect(screen.getByTestId('text-input-pan')).toBeInTheDocument();
        expect(screen.getByTestId('date-input-date_of_birth')).toBeInTheDocument();
        expect(screen.getByTestId('select-input-state_code')).toBeInTheDocument();
        // The 'dropdown' type renders a start/end year SelectInput pair.
        expect(screen.getByTestId('select-input-fy_start')).toBeInTheDocument();
        expect(screen.getByTestId('select-input-fy_end')).toBeInTheDocument();
        expect(
            screen.getByText('Click or drag file to this area to upload')
        ).toBeInTheDocument();
    });

    it('generateYupSchema requires required fields and accepts valid values', async () => {
        const schema = generateYupSchema([
            {
                type: 'input',
                name: 'pan',
                label: 'PAN',
                placeholder: '',
                min: 10,
                max: 10,
                required: true,
            },
            {
                type: 'input',
                name: 'name',
                label: 'Name',
                placeholder: '',
                min: 3,
                max: 50,
                required: true,
            },
        ] as any);

        await expect(schema.validate({ pan: '', name: '' })).rejects.toThrow();
        await expect(
            schema.validate({ pan: 'ABCDE1234F', name: 'John Doe' })
        ).resolves.toBeTruthy();
    });

    it('submits via verifyBank for a plain verify service and opens SuccessModal with the response', async () => {
        mockVerifyBank.mockResolvedValue({ panStatus: 'VALID', corporateFinalBalance: '4990' });
        mockSubmitValues = { pan: 'ABCDE1234F', name: 'John Doe', date_of_birth: '01/01/1990' };

        render(
            <PanVerifyModal
                open
                handleCancel={vi.fn()}
                inputComponents={allTypesInputComponents}
                title="PAN Verification"
                accessKeys="pan_verify"
                serviceName="PAN"
            />
        );

        fireEvent.click(screen.getByText('Submit'));

        await waitFor(() => {
            expect(mockVerifyBank).toHaveBeenCalledWith({
                pan: 'ABCDE1234F',
                name: 'John Doe',
                date_of_birth: '01/01/1990',
                title: 'PAN Verification',
            });
        });

        await waitFor(() => {
            expect(screen.getByTestId('success-modal')).toBeInTheDocument();
        });
        expect(screen.getByTestId('success-modal').textContent).toContain('pan_verify');
        expect(screen.getByTestId('success-modal').textContent).toContain('VALID');
    });

    it('routes aadhar_verify submissions through generateLink/AadhaarConsentModal instead of verifyBank', async () => {
        mockGenerateLink.mockResolvedValue({
            link: 'https://digilocker.example/abc',
            reference_number: 'REF1',
            transaction_id: 'TXN1',
        });
        mockSubmitValues = {
            name: 'Test User',
            email: 'test@example.com',
            mobile: '9876543210',
        };

        render(
            <PanVerifyModal
                open
                handleCancel={vi.fn()}
                inputComponents={allTypesInputComponents}
                title="Aadhaar OKYC Verification"
                accessKeys="aadhar_verify"
                serviceName="Aadhaar"
            />
        );

        fireEvent.click(screen.getByText('Submit'));

        await waitFor(() => {
            expect(mockGenerateLink).toHaveBeenCalledWith({
                name: 'Test User',
                email: 'test@example.com',
                mobile: '9876543210',
            });
        });

        expect(mockVerifyBank).not.toHaveBeenCalled();
        await waitFor(() => {
            expect(screen.getByTestId('aadhaar-consent-modal')).toBeInTheDocument();
        });
        expect(screen.getByTestId('aadhaar-consent-modal').textContent).toBe(
            'https://digilocker.example/abc'
        );
    });
});
