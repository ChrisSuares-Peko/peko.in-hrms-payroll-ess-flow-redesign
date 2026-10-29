import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { Provider } from 'react-redux';
import { MemoryRouter } from 'react-router-dom';
import configureStore from 'redux-mock-store';
import { describe, it, expect, vi } from 'vitest';

import BuyForm from '../../components/BuyForm';

vi.mock('../../hooks/useGetEmployeeApi', () => ({
    useGetEmployee: vi.fn().mockReturnValue({
        data: [],
        generateEmployeesDropdown: vi.fn().mockReturnValue([]),
        isLoading: false,
    }),
}));

// Mock store setup
const mockStore = configureStore();
const store = mockStore({
    reducer: {
        auth: { role: 'admin', id: '123' },
        giftcardCheckout: {
            productDetails: {},
            formDetails: {},
        },
        subscriptions: { services: {} },
    },
});

// Mock product data using the correct mainGiftCard key
const productData = {
    mainGiftCard: {
        id: 1,
        product_id: '123',
        product_name: 'Amazon Gift Card',
        brand_logo: 'https://example.com/image.png',
        brand_code: 'AMZ',
        name: 'Amazon Gift Card',
        image: 'https://example.com/image.png',
        activation_fee: '0',
        terms: 'Terms and conditions apply.',
        description: 'Amazon Gift Card Description',
        is_open_denominnation: false,
        min_price: '100',
        max_price: '1000',
        denominations: [100, 500, 1000],
        country: 'US',
        currency: 'USD',
        expiry: '2023-12-31',
        status: 1,
        redemption_instructions: 'Redeem at checkout',
        createdAt: '2023-01-01T00:00:00Z',
        updatedAt: '2023-01-01T00:00:00Z',
        serviceOperatorId: 1,
        serviceOperator: { id: 1, name: 'Amazon', accessKey: 'some-access-key' },
    },
    relatedGiftCards: [],
};

// Helper function to render component
const renderComponent = () => {
    render(
        <Provider store={store}>
            <MemoryRouter>
                <BuyForm productData={productData} collapsed={false} onToggle={() => {}} />
            </MemoryRouter>
        </Provider>
    );
};

describe('BuyForm Component', () => {
    it('renders the component correctly', () => {
        renderComponent();
        expect(screen.getByText('Amazon Gift Card')).toBeInTheDocument();
        expect(screen.getByRole('button', { name: /Continue/i })).toBeInTheDocument();
    });

    it('displays radio buttons for order type selection', () => {
        renderComponent();
        expect(screen.getByText(/Gift a Friend/i)).toBeInTheDocument();
        expect(screen.getByText(/Bulk purchase/i)).toBeInTheDocument();
    });

    it('changes order type correctly when a radio button is selected', () => {
        renderComponent();
        const bulkPurchaseRadio = screen.getByLabelText(/Bulk purchase/i);
        fireEvent.click(bulkPurchaseRadio);
        expect(bulkPurchaseRadio).toBeChecked();
    });

    it('shows amount field with correct label', () => {
        renderComponent();
        expect(screen.getByText('Amount')).toBeInTheDocument();
    });

    it('shows quantity field only when bulk purchase is selected', async () => {
        renderComponent();
        expect(screen.queryByLabelText(/No. of Cards:/i)).not.toBeInTheDocument();

        fireEvent.click(screen.getByLabelText(/Bulk purchase/i));
        screen.debug(undefined, 200000);

        expect(screen.getByTitle(/No. of Cards:/i)).toBeInTheDocument();
    });

    it('navigates to checkout after successful submission', async () => {
        renderComponent();
        fireEvent.change(screen.getByText('₹ 100.00'));
        fireEvent.click(screen.getByRole('button', { name: /Continue/i }));

        await waitFor(() => {
            expect(window.location.pathname).toBe('/');
        });
    });
});
