import { render, screen } from '@testing-library/react';
import { Formik } from 'formik';
import { Provider } from 'react-redux';
import configureStore from 'redux-mock-store';
import { describe, it, expect, vi, beforeEach } from 'vitest';

import { accessKeys } from '@utils/accessKeys';

import BeneficiaryForm from '../../../components/forms/BeneficiaryForm';
import { Beneficiary } from '../../../types';

const mockStore = configureStore();
const store = mockStore({
    reducer: {
        auth: { role: 'admin', id: '123' },
    },
});

describe('BeneficiaryForm Component', () => {
    const mockSetService = vi.fn();
    const mockSetSelectedBillerData = vi.fn();

    const mockBeneficiary: Beneficiary = {
        name: 'John Doe',
        accessKey: accessKeys.postpaid,
        phoneNo: '9876543210',
        serviceProvider: 'Airtel',
        serviceOperator: {
            serviceProvider: 'Airtel',
            serviceImage: 'https://example.com/airtel.png',
        },
        customerParams: [
            {
                value: '9876543210',
                name: '',
            },
        ],
        id: 0,
        billerId: null,
        providerCircle: '',
        isActive: false,
        createdAt: '',
        updatedAt: '',
        credentialId: 0,
    };

    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('renders the component correctly', () => {
        render(
            <Provider store={store}>
                <Formik initialValues={{ name: '', accessKey: '' }} onSubmit={() => {}}>
                    <BeneficiaryForm
                        service={undefined}
                        setService={mockSetService}
                        accessKeyName={undefined}
                        selectedBillerData={[]}
                        setSelectedBillerData={mockSetSelectedBillerData}
                        editValues={null}
                    />
                </Formik>
            </Provider>
        );
        expect(screen.getByPlaceholderText('Example: JoXXXX')).toBeInTheDocument();
    });

    it('updates service state when service is selected', () => {
        render(
            <Provider store={store}>
                <Formik initialValues={{ name: '', accessKey: '' }} onSubmit={() => {}}>
                    <BeneficiaryForm
                        service={undefined}
                        setService={mockSetService}
                        accessKeyName={undefined}
                        selectedBillerData={[]}
                        setSelectedBillerData={mockSetSelectedBillerData}
                        editValues={null}
                    />
                </Formik>
            </Provider>
        );
    });

    it('renders prepaid form when service is prepaid', () => {
        render(
            <Provider store={store}>
                <Formik
                    initialValues={{ name: '', accessKey: accessKeys.prepaid }}
                    onSubmit={() => {}}
                >
                    <BeneficiaryForm
                        service={accessKeys.prepaid}
                        setService={mockSetService}
                        accessKeyName={undefined}
                        selectedBillerData={[]}
                        setSelectedBillerData={mockSetSelectedBillerData}
                        editValues={null}
                    />
                </Formik>
            </Provider>
        );

        expect(screen.getByText('Mobile Number')).toBeInTheDocument();
        expect(screen.getAllByText('Select Service Provider')).toHaveLength(2);
    });

    it('renders postpaid form when service is postpaid', () => {
        render(
            <Provider store={store}>
                <Formik
                    initialValues={{ name: '', accessKey: accessKeys.postpaid }}
                    onSubmit={() => {}}
                >
                    <BeneficiaryForm
                        service={accessKeys.postpaid}
                        setService={mockSetService}
                        accessKeyName="testAccessKey"
                        selectedBillerData={[]}
                        setSelectedBillerData={mockSetSelectedBillerData}
                        editValues={null}
                    />
                </Formik>
            </Provider>
        );

        expect(screen.getAllByText('Select Service Provider')).toHaveLength(2);
    });

    it('prepopulates form fields when editValues is provided', () => {
        render(
            <Provider store={store}>
                <Formik
                    initialValues={{ name: 'John Doe', accessKey: accessKeys.postpaid }}
                    onSubmit={() => {}}
                >
                    <BeneficiaryForm
                        service={accessKeys.postpaid}
                        setService={mockSetService}
                        accessKeyName="testAccessKey"
                        selectedBillerData={[]}
                        setSelectedBillerData={mockSetSelectedBillerData}
                        editValues={mockBeneficiary}
                    />
                </Formik>
            </Provider>
        );

        expect(screen.getByPlaceholderText('Example: JoXXXX')).toHaveValue('John Doe');
        expect(mockSetService).toHaveBeenCalledWith(accessKeys.postpaid);
    });
});
