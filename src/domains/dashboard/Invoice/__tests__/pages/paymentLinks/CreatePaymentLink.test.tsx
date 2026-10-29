import React from 'react';

import { configureStore } from '@reduxjs/toolkit';
import { render, screen, fireEvent, cleanup } from '@testing-library/react';
import { JSX } from 'react/jsx-runtime';
import { Provider } from 'react-redux';
import { beforeEach, describe, expect, Mock, test, vi } from 'vitest';

import { useAppDispatch, useAppSelector } from '@src/hooks/store';

import CreatePaymentLink from '../../../pages/paymentLinks/CreatePaymentLink';
import invoiceReducer from '../../../slices/InvoicesSlices';

vi.mock('@src/hooks/store', () => ({
    useAppDispatch: vi.fn(),
    useAppSelector: vi.fn(),
}));
vi.mock('../../../hooks/useGetPaymentlinkApi', () => ({
    default: vi.fn(() => ({
        getPaymentLink: vi.fn(),
        isLoading: false,
    })),
}));

const renderWithStore = (
    component:
        | string
        | number
        | boolean
        | Iterable<React.ReactNode>
        | JSX.Element
        | null
        | undefined
) => {
    const store = configureStore({
        reducer: { invoices: invoiceReducer },
    });
    return render(<Provider store={store}>{component}</Provider>);
};
const mockUseAppSelector = useAppSelector as Mock;

describe('CreatePaymentLink Component', () => {
    const mockDispatch = vi.fn();

    beforeEach(() => {
        vi.clearAllMocks();
        cleanup();
        mockUseAppSelector.mockReturnValue({ role: 'admin', id: '123' });
        (useAppDispatch as any).mockReturnValue(mockDispatch);
    });
    test('renders form fields correctly', () => {
        renderWithStore(<CreatePaymentLink />);
        expect(screen.getByText(/Customer Name/i)).toBeInTheDocument();
        expect(screen.getByText(/Mobile Number/i)).toBeInTheDocument();
        expect(screen.getByText(/Email ID/i)).toBeInTheDocument();
        expect(screen.getByText(/Amount/i)).toBeInTheDocument();
        expect(screen.getByText(/Purpose message/i)).toBeInTheDocument();
        expect(screen.getByText(/Notification To/i)).toBeInTheDocument();
        expect(screen.getByRole('button', { name: /Submit/i })).toBeInTheDocument();
    });

    test('should submit the form and dispatch the action', () => {
        render(<CreatePaymentLink />);

        screen.debug(undefined, 89349463438);
        fireEvent.change(screen.getByPlaceholderText(/Enter Customer Name/i), {
            target: { value: 'John Doe' },
        });
        fireEvent.change(screen.getByPlaceholderText(/Enter Mobile Number/i), {
            target: { value: '9876543210' },
        });
        fireEvent.change(screen.getByPlaceholderText(/Enter Email ID/i), {
            target: { value: 'john@example.com' },
        });
        fireEvent.change(screen.getByPlaceholderText(/Enter Purpose message/i), {
            target: { value: 'good luck' },
        });
        fireEvent.change(screen.getByPlaceholderText(/Enter Amount/i), {
            target: { value: '500' },
        });

        fireEvent.click(screen.getByRole('button', { name: /Submit/i }));
    });

    test('opens the add customer modal', async () => {
        renderWithStore(<CreatePaymentLink />);

        const comboboxes = screen.getAllByRole('combobox');
        fireEvent.mouseDown(comboboxes[0]);
        screen.debug(undefined, 34343434);
        expect(await screen.findByText(/Add Customer/i)).toBeInTheDocument();
    });
});
