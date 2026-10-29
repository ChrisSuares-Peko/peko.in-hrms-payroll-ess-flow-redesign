import { render, screen } from '@testing-library/react';
import { Formik } from 'formik';
import { describe, expect, it } from 'vitest';

import SummarySection from '../../../components/createInvoice/SummarySection';

const defaultValues = {
    buyer: { state: 'Karnataka' },
    invoice: { type: 'DOMESTIC' as const },
    items: [{ quantity: 1, unitPrice: 100, discount: 0, taxRate: '18' }],
    additional: { shippingCost: '0', amountPaid: null, paymentMode: '' },
};

const wrap = (values: any = defaultValues, businessState = 'Karnataka') => (
    <Formik initialValues={values} onSubmit={() => {}}>
        <SummarySection businessState={businessState} />
    </Formik>
);

describe('SummarySection', () => {
    it('shows CGST + SGST when buyer state matches business state', () => {
        render(wrap());
        expect(screen.getByText('CGST')).toBeInTheDocument();
        expect(screen.getByText('SGST')).toBeInTheDocument();
        expect(screen.queryByText('IGST')).not.toBeInTheDocument();
    });

    it('shows IGST when buyer state differs from business state', () => {
        render(wrap({ ...defaultValues, buyer: { state: 'Maharashtra' } }));
        expect(screen.getByText('IGST')).toBeInTheDocument();
        expect(screen.queryByText('CGST')).not.toBeInTheDocument();
    });

    it('shows Tax row when invoice is international', () => {
        render(
            wrap({ ...defaultValues, invoice: { type: 'INTERNATIONAL' as const } }, 'Karnataka')
        );
        expect(screen.getByText('Tax')).toBeInTheDocument();
        expect(screen.queryByText('CGST')).not.toBeInTheDocument();
    });
});
