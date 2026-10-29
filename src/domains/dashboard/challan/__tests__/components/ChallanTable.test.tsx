import { render, screen, fireEvent } from '@testing-library/react';
import { vi, describe, it, expect } from 'vitest';

import ChallanTable from '../../components/ChallanTable';
import { ChallanRow } from '../../types/index';

vi.mock('@utils/priceFormat', () => ({
    formatNumberWithLocalString: (n: number) => String(n),
}));

const makeRow = (over: Partial<ChallanRow> = {}): ChallanRow => ({
    challan_number: 'CH1',
    registration_number: 'KA01AB1234',
    offense_details: 'Over speeding',
    challan_place: 'MG Road',
    state: 'KA',
    amount: 500,
    challan_date: '2026-01-01 10:00:00',
    challan_status: 'Pending',
    key: 'CH1',
    isPayable: true,
    ...over,
});

describe('ChallanTable', () => {
    const base = {
        isLoading: false,
        selectedRowKeys: [],
        onSelectChange: vi.fn(),
        onView: vi.fn(),
        onPay: vi.fn(),
    };

    it('renders challan rows with number, offence, amount and status', () => {
        render(<ChallanTable {...base} data={[makeRow()]} />);
        expect(screen.getByText('CH1')).toBeInTheDocument();
        expect(screen.getByText('Over speeding')).toBeInTheDocument();
        expect(screen.getByText('₹ 500')).toBeInTheDocument();
        expect(screen.getByText('Pending')).toBeInTheDocument();
    });

    it('shows a Pay button for payable rows and fires onPay when clicked', () => {
        const onPay = vi.fn();
        render(<ChallanTable {...base} onPay={onPay} data={[makeRow({ isPayable: true })]} />);
        fireEvent.click(screen.getByText('Pay'));
        expect(onPay).toHaveBeenCalledTimes(1);
    });

    it('does not render a Pay button for non-payable rows', () => {
        render(
            <ChallanTable
                {...base}
                data={[makeRow({ isPayable: false, challan_status: 'Paid' })]}
            />
        );
        expect(screen.queryByText('Pay')).not.toBeInTheDocument();
    });

    it('fires onView when the view icon is clicked', () => {
        const onView = vi.fn();
        render(<ChallanTable {...base} onView={onView} data={[makeRow()]} />);
        fireEvent.click(screen.getByRole('img', { name: 'eye' }));
        expect(onView).toHaveBeenCalledTimes(1);
    });
});
