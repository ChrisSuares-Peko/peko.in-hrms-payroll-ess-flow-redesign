import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { Formik } from 'formik';
import { Provider } from 'react-redux';
import configureStore from 'redux-mock-store';
import { describe, expect, it, vi, beforeEach } from 'vitest';

import PostpaidForm from '../../../components/forms/PostpaidForm';

const mockStore = configureStore();

const serviceProviderMockData = [
    {
        value: '1',
        label: 'Provider 1',
        customerParams: [
            { paramName: 'Account Number', optional: false, maxLength: 15, dataType: 'NUMERIC' },
        ],
    },
];

vi.mock('../../../hooks/useServiceProviderApi', () => ({
    default: () => ({
        serviceProviderData: serviceProviderMockData,
        isLoading: false,
    }),
}));

const mockHandlePostpaidPay = vi.fn();
vi.mock('../../../hooks/usePayment', () => ({
    default: () => ({
        handlePostpaidPay: mockHandlePostpaidPay,
        isLoading: false,
    }),
}));

describe('PostpaidForm Component', () => {
    let store: any;

    beforeEach(() => {
        store = mockStore({
            reducer: {
                billPayments: {
                    bills: {
                        serviceProvider: '1',
                        'Account Number': '',
                    },
                },
            },
        });
    });

    it('renders the component correctly', () => {
        render(
            <Provider store={store}>
                <Formik initialValues={{}} onSubmit={() => {}}>
                    <PostpaidForm />
                </Formik>
            </Provider>
        );

        expect(screen.getByText('View Bill')).toBeInTheDocument();
    });

    it('displays customer parameter fields when provider is selected', () => {
        render(
            <Provider store={store}>
                <Formik initialValues={{}} onSubmit={() => {}}>
                    <PostpaidForm />
                </Formik>
            </Provider>
        );

        expect(screen.getByPlaceholderText(/Account Number/i)).toBeInTheDocument();
    });

    it('submits the form with correct values', async () => {
        render(
            <Provider store={store}>
                <Formik
                    initialValues={{ serviceProvider: '1', 'Account Number': '' }}
                    onSubmit={mockHandlePostpaidPay}
                >
                    <PostpaidForm />
                </Formik>
            </Provider>
        );

        const input = screen.getByPlaceholderText(/Account Number/i);
        fireEvent.change(input, { target: { value: '9876543210' } });

        fireEvent.click(screen.getByText('View Bill'));

        await waitFor(() => {
            expect(mockHandlePostpaidPay).toHaveBeenCalledWith(
                {
                    serviceProvider: '1',
                    'Account Number': '9876543210',
                },
                'Provider 1'
            );
        });
    });
});
