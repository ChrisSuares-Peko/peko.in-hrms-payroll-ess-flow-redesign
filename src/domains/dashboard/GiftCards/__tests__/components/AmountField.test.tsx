import { useState } from 'react';

import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { Formik } from 'formik';
import { describe, expect, it, vi } from 'vitest';

import AmountField from '../../components/AmountField';

describe('AmountField Component', () => {
    const mockSetFieldValue = vi.fn();

    // AmountField now derives its displayed/selected value from the real Formik
    // field, not local state, so setFieldValue must actually update that field —
    // spying on it while still delegating to Formik's own setFieldValue.
    const renderComponent = (props = {}) =>
        render(
            <Formik initialValues={{ amount: '' }} onSubmit={vi.fn()}>
                {({ setFieldValue }) => (
                    <AmountField
                        priceType="FLEXI"
                        min_price="100"
                        max_price="5000"
                        setFieldValue={(...args) => {
                            mockSetFieldValue(...args);
                            setFieldValue(...args);
                        }}
                        denominations={[100, 500, 1000, 2000]}
                        {...props}
                    />
                )}
            </Formik>
        );

    it('renders input field when priceType is true', () => {
        renderComponent();
        expect(screen.getByPlaceholderText(/Enter Amount/i)).toBeInTheDocument();
    });

    it('renders price tags when priceType is false', () => {
        renderComponent({ priceType: false });

        const priceTags = screen.getAllByText(/₹ 100\.00/);
        expect(priceTags.length).toBeGreaterThan(0);
        expect(screen.getByText('₹ 500.00')).toBeInTheDocument();
        expect(screen.getByText('₹ 1000.00')).toBeInTheDocument();
        expect(screen.getByText('₹ 2000.00')).toBeInTheDocument();
    });

    it('validates input within min and max price range', async () => {
        renderComponent();
        const input = screen.getByPlaceholderText(/Enter Amount/i);

        fireEvent.change(input, { target: { value: '50' } });
        fireEvent.blur(input);

        await waitFor(() => {
            expect(
                screen.getByText(/Please enter a value between/i)
            ).toBeInTheDocument();
        });

        fireEvent.change(input, { target: { value: '200' } });
        fireEvent.blur(input);

        await waitFor(() => {
            expect(
                screen.queryByText(/Value must be within the min and max prices/i)
            ).not.toBeInTheDocument();
        });
    });

    it('validates selected amount against fixed denominations', async () => {
        renderComponent({ priceType: false });

        fireEvent.click(screen.getByText('₹ 500.00'));

        expect(mockSetFieldValue).toHaveBeenCalledWith('amount', 500);
    });

    it('clears input and does not allow invalid values', async () => {
        renderComponent();
        const input = screen.getByPlaceholderText(/Enter Amount/i);

        fireEvent.change(input, { target: { value: 'abc' } });

        await waitFor(() => {
            expect(input).toHaveValue('');
        });
    });

    it('restricts non-numeric input using keydown event', async () => {
        renderComponent();
        const input = screen.getByPlaceholderText(/Enter Amount/i);

        fireEvent.keyDown(input, { key: 'a' });
        fireEvent.keyDown(input, { key: '!' });

        fireEvent.change(input, { target: { value: '1234' } });
        expect(input).toHaveValue('1234');
    });

    it('keeps the entered amount visible after AmountField unmounts and remounts (card collapse/expand)', () => {
        // Mirrors the real usage: the surrounding Formik stays mounted the whole
        // time — only AmountField itself unmounts/remounts, as it does when
        // BuyForm collapses into its summary row and is re-expanded.
        const CollapsibleWrapper = () => {
            const [collapsed, setCollapsed] = useState(false);
            return (
                <Formik initialValues={{ amount: '' }} onSubmit={vi.fn()}>
                    {({ setFieldValue }) => (
                        <>
                            <button type="button" onClick={() => setCollapsed(current => !current)}>
                                toggle
                            </button>
                            {!collapsed && (
                                <AmountField
                                    priceType="FLEXI"
                                    min_price="100"
                                    max_price="5000"
                                    setFieldValue={setFieldValue}
                                />
                            )}
                        </>
                    )}
                </Formik>
            );
        };

        render(<CollapsibleWrapper />);

        const input = screen.getByPlaceholderText(/Enter Amount/i);
        fireEvent.change(input, { target: { value: '1234' } });
        expect(input).toHaveValue('1234');

        fireEvent.click(screen.getByText('toggle')); // collapse: AmountField unmounts
        expect(screen.queryByPlaceholderText(/Enter Amount/i)).not.toBeInTheDocument();

        fireEvent.click(screen.getByText('toggle')); // expand: AmountField remounts
        expect(screen.getByPlaceholderText(/Enter Amount/i)).toHaveValue('1234');
    });
});
