import { render, screen } from '@testing-library/react';
import { Formik } from 'formik';
import { Provider } from 'react-redux';
import { vi, describe, it, expect } from 'vitest';

import { store } from '@src/store/store';

import CheckoutForm from '../../components/CheckoutForm';
import { GiftCardOrderTypes } from '../../types/employee';

const renderComponent = (orderType = GiftCardOrderTypes.BUYFOROTHER) => {
    store.dispatch({
        type: 'giftcardCheckout/setFormData',
        payload: { orderType },
    });

    return render(
        <Provider store={store}>
            <Formik
                initialValues={{ employee: '', receiverFirstName: '', receiverEmail: '' }}
                onSubmit={() => {}}
            >
                <CheckoutForm
                    setSelectedEmployees={vi.fn()}
                    setSelectAllChecked={vi.fn()}
                    selectAllChecked={false}
                />
            </Formik>
        </Provider>
    );
};

describe('CheckoutForm Component', () => {
    it('renders the Receiver & Sender Details section', () => {
        renderComponent();
        expect(screen.getByText('Receiver & Sender Details')).toBeInTheDocument();
    });

    it('renders Receiver Name and Email fields for non-employee orders', () => {
        renderComponent(GiftCardOrderTypes.BUYFOROTHER);
        expect(screen.getByText('Receiver Name')).toBeInTheDocument();
        expect(screen.getByText('Receiver Email Address')).toBeInTheDocument();
    });

    it('does not render Receiver Name and Email fields when buying for employees', () => {
        renderComponent(GiftCardOrderTypes.BUYFOREMPLOYEE);
        expect(screen.queryByLabelText(/Receiver Name/i)).not.toBeInTheDocument();
        expect(screen.queryByLabelText(/Receiver Email Address/i)).not.toBeInTheDocument();
    });

    it('renders sender name and message fields for all order types', () => {
        renderComponent();
        expect(screen.getByText('Sender Name')).toBeInTheDocument();
        expect(screen.getByText('Your Message')).toBeInTheDocument();
    });

    it('does not show employee confirmation message when buying for others', () => {
        renderComponent(GiftCardOrderTypes.BUYFOROTHER);
        expect(
            screen.queryByText(
                'Upon successful completion of the purchase, the gift card details will be sent to the employees via email'
            )
        ).not.toBeInTheDocument();
    });
});
