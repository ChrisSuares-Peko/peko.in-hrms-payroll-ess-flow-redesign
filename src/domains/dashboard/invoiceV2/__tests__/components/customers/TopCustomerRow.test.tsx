import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import TopCustomerRow from '../../../components/customers/TopCustomerRow';

describe('TopCustomerRow', () => {
    it('renders revenue variant with rank, name and transaction count', () => {
        render(
            <TopCustomerRow
                variant="revenue"
                id={1}
                rank={1}
                name="Acme"
                totalRevenue={1000}
                transactionCount={5}
                changePercent={10}
            />
        );
        expect(screen.getByText('#1')).toBeInTheDocument();
        expect(screen.getByText('Acme')).toBeInTheDocument();
        expect(screen.getByText('5 transactions')).toBeInTheDocument();
        expect(screen.getByText('+10%')).toBeInTheDocument();
    });

    it('renders txn variant with orders and % of total', () => {
        render(
            <TopCustomerRow
                variant="txn"
                id={2}
                rank={2}
                name="Peko"
                totalRevenue={500}
                transactionCount={3}
                percentOfTotal={25}
            />
        );
        expect(screen.getByText('#2')).toBeInTheDocument();
        expect(screen.getByText('3 orders')).toBeInTheDocument();
        expect(screen.getByText('+25% of total')).toBeInTheDocument();
    });
});
