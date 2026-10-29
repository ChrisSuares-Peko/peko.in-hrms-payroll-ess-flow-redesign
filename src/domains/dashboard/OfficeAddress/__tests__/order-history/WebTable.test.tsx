import { render, screen, fireEvent } from '@testing-library/react';
import { Provider } from 'react-redux';
import { MemoryRouter } from 'react-router-dom';
import configureStore from 'redux-mock-store';
import { describe, it, expect, vi, beforeEach } from 'vitest';

import OrderHistory from '../../components/order-history/WebTable';

const mockStore = configureStore();
const store = mockStore({
    reducer: {
        auth: { id: 1, role: 'user' }, // Ensure auth exists with necessary properties
        plan: { workspaceId: null },
        basicInfo: { refresh: false, data: {}, isLoading: false, isEditLoading: false },
    },
});

describe('OrderHistory Component', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('renders Order History title', () => {
        render(
            <Provider store={store}>
                <MemoryRouter>
                    <OrderHistory />
                </MemoryRouter>
            </Provider>
        );

        expect(screen.getByText('Order History')).toBeInTheDocument();
    });

    it('updates search input on user typing', () => {
        render(
            <Provider store={store}>
                <MemoryRouter>
                    <OrderHistory />
                </MemoryRouter>
            </Provider>
        );

        const searchInput = screen.getByPlaceholderText('Search');
        fireEvent.change(searchInput, { target: { value: 'Premium' } });
        expect(searchInput).toHaveValue('Premium');
    });

    it('updates date range on selection', () => {
        render(
            <Provider store={store}>
                <MemoryRouter>
                    <OrderHistory />
                </MemoryRouter>
            </Provider>
        );

        const datePickers = screen.getAllByRole('textbox');
        fireEvent.change(datePickers[0], { target: { value: '2024-01-01' } });
        fireEvent.change(datePickers[1], { target: { value: '2024-02-01' } });

        expect(datePickers[0]).toHaveValue('2024-01-01');
        expect(datePickers[1]).toHaveValue('2024-02-01');
    });
});
