import { render, screen, fireEvent } from '@testing-library/react';
import { Formik } from 'formik';
import { describe, it, expect, vi, beforeEach } from 'vitest';

import { setFormInitialValues } from '@src/domains/dashboard/billPayments/slices/beneficiary';
import { useAppDispatch } from '@src/hooks/store';

import BeneficiaryForm from '../../../components/forms/BeneficiaryPostpaid';
import useServiceProviderApi from '../../../hooks/useServiceProviderApi';

vi.mock('@src/hooks/store', () => ({
    useAppDispatch: vi.fn(),
}));

vi.mock('../../../hooks/useServiceProviderApi', () => ({
    default: vi.fn(),
}));

vi.mock('@src/domains/dashboard/billPayments/slices/beneficiary', async () => {
    const actual = await vi.importActual<any>(
        '@src/domains/dashboard/billPayments/slices/beneficiary'
    );
    return {
        ...actual,
        setFormInitialValues: vi.fn(),
    };
});

vi.mock('@components/atomic/inputs/TextInput', () => ({
    default: ({ label, name }: any) => <input data-testid={`text-${name}`} placeholder={label} />,
}));

vi.mock('@src/domains/dashboard/billPayments/components/CustomSelectSearch', () => ({
    default: ({ handleChange }: any) => (
        <select
            data-testid="select-provider"
            onChange={e => handleChange(e.target.value, { label: e.target.value })}
        >
            <option value="">Select</option>
            <option value="BILLER_1">Biller One</option>
        </select>
    ),
}));

describe('BeneficiaryForm', () => {
    const mockDispatch = vi.fn();
    const mockSetSelectedBillerData = vi.fn();

    const initialValues = {
        accessKey: '123',
        name: 'Test User',
        billerId: '',
        serviceProvider: '',
    };

    beforeEach(() => {
        vi.clearAllMocks();
        (useAppDispatch as any).mockReturnValue(mockDispatch);

        (useServiceProviderApi as any).mockReturnValue({
            serviceProviderData: [
                {
                    value: 'BILLER_1',
                    label: 'Biller One',
                    customerParams: [
                        {
                            paramName: 'CustomerNumber',
                            dataType: 'NUMERIC',
                            isOptional: 'false',
                            maxLength: 10,
                        },
                    ],
                },
            ],
            isLoading: false,
        });
    });

    const renderComponent = () =>
        render(
            <Formik initialValues={initialValues} onSubmit={() => {}}>
                <BeneficiaryForm
                    selectedBillerData={[]}
                    setSelectedBillerData={mockSetSelectedBillerData}
                    service="postpaid"
                />
            </Formik>
        );

    it('should render form', () => {
        renderComponent();
        expect(screen.getByTestId('beneficiary-form')).toBeInTheDocument();
        expect(screen.getByTestId('select-provider')).toBeInTheDocument();
    });

    it('should update biller and dispatch form values when provider is selected', () => {
        renderComponent();

        const select = screen.getByTestId('select-provider');
        fireEvent.change(select, { target: { value: 'BILLER_1' } });

        expect(mockSetSelectedBillerData).toHaveBeenCalledWith([
            {
                paramName: 'CustomerNumber',
                dataType: 'NUMERIC',
                isOptional: 'false',
                maxLength: 10,
            },
        ]);

        expect(mockDispatch).toHaveBeenCalledWith(
            setFormInitialValues({
                accessKey: '123',
                name: 'Test User',
                billerId: 'BILLER_1',
                serviceProvider: 'BILLER_1',
            })
        );
    });

    it('should render dynamic input fields when selectedBillerData is passed', () => {
        render(
            <Formik initialValues={initialValues} onSubmit={() => {}}>
                <BeneficiaryForm
                    selectedBillerData={[
                        {
                            paramName: 'CustomerNumber',
                            dataType: 'NUMERIC',
                            isOptional: 'false',
                            maxLength: 10,
                            minLength: 0,
                            regex: '',
                            values: null,
                            visibility: false,
                        },
                    ]}
                    setSelectedBillerData={mockSetSelectedBillerData}
                    service="postpaid"
                />
            </Formik>
        );

        expect(screen.getByTestId('text-CustomerNumber')).toBeInTheDocument();
    });
});
