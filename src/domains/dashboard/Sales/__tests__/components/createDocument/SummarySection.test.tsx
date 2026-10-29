import React from 'react';

import { render, screen } from '@testing-library/react';
import { Formik } from 'formik';
import { describe, it, expect } from 'vitest';

import SummarySection from '../../../components/createDocument/SummarySection';

const renderWithFormik = (initialValues: any, businessState = '') =>
    render(
        <Formik initialValues={initialValues} onSubmit={() => {}}>
            <SummarySection businessState={businessState} />
        </Formik>
    );

describe('SummarySection', () => {
    const baseValues = {
        buyer: { state: '' },
        document: { type: 'DOMESTIC' as const },
        items: [
            {
                name: 'Item A',
                quantity: '2',
                unitPrice: '100',
                discount: '0',
                taxRate: '18',
            },
        ],
        additional: {
            shippingCost: '0',
            amountPaid: '0',
            paymentMode: 'Cash',
        },
    };

    it('renders subtotal, IGST, discount, total, and payment rows for inter-state DOMESTIC', () => {
        renderWithFormik({ ...baseValues, buyer: { state: 'MH' } }, 'KL');

        expect(screen.getByText('Subtotal')).toBeInTheDocument();
        expect(screen.getByText('IGST')).toBeInTheDocument();
        expect(screen.getByText('Discount')).toBeInTheDocument();
        expect(screen.getByText('Shipping Cost')).toBeInTheDocument();
        expect(screen.getByText('Total Amount')).toBeInTheDocument();
        expect(screen.getByText('Amount Paid')).toBeInTheDocument();
        expect(screen.getByText('Amount Due')).toBeInTheDocument();
        expect(screen.getByText('Payment Mode')).toBeInTheDocument();
    });

    it('renders CGST + SGST rows when buyer.state matches businessState', () => {
        const intraState = {
            ...baseValues,
            buyer: { state: 'KL' },
        };
        renderWithFormik(intraState, 'KL');

        expect(screen.getByText('CGST')).toBeInTheDocument();
        expect(screen.getByText('SGST')).toBeInTheDocument();
        expect(screen.queryByText('IGST')).not.toBeInTheDocument();
    });

    it('renders single Tax row for INTERNATIONAL', () => {
        const intl = {
            ...baseValues,
            document: { type: 'INTERNATIONAL' as const },
        };
        renderWithFormik(intl);

        expect(screen.getByText('Tax')).toBeInTheDocument();
        expect(screen.queryByText('IGST')).not.toBeInTheDocument();
        expect(screen.queryByText('CGST')).not.toBeInTheDocument();
    });

    it('computes subtotal from items', () => {
        renderWithFormik(baseValues);

        // 2 * 100 = 200 → ₹ 200.00
        expect(screen.getByText('₹ 200.00')).toBeInTheDocument();
    });
});
