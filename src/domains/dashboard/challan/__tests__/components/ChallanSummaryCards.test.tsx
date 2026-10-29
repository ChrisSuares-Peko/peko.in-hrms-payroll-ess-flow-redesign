import { render, screen } from '@testing-library/react';
import { vi, describe, it, expect } from 'vitest';

import ChallanSummaryCards from '../../components/ChallanSummaryCards';

vi.mock('@utils/priceFormat', () => ({
    formatNumberWithLocalString: (n: number) => String(n),
}));

describe('ChallanSummaryCards', () => {
    it('renders the four summary cards with their labels and values', () => {
        render(
            <ChallanSummaryCards
                summary={{ totalOutstanding: 1500, pending: 3, paid: 2, courtMatters: 1 }}
            />
        );

        expect(screen.getByText('Total Outstanding')).toBeInTheDocument();
        expect(screen.getByText('₹ 1500')).toBeInTheDocument();

        expect(screen.getByText('Pending')).toBeInTheDocument();
        expect(screen.getByText('3')).toBeInTheDocument();

        expect(screen.getByText('Paid')).toBeInTheDocument();
        expect(screen.getByText('2')).toBeInTheDocument();

        expect(screen.getByText('Court Matters')).toBeInTheDocument();
        expect(screen.getByText('1')).toBeInTheDocument();
    });
});
