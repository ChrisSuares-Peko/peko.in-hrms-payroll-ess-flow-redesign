import { render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import VisaManageBookings from '../../pages/VisaManageBookings';

vi.mock('@src/hooks/store', () => ({
    useAppSelector: (selector: any) =>
        selector({ reducer: { auth: { role: 'user', id: 1 } } }),
}));

vi.mock('../../api/visa', () => ({
    listVisaBookings: vi.fn().mockResolvedValue({ data: [], total: 0 }),
}));

vi.mock('@components/atomic/GenericTable', () => ({
    default: ({ columns, dataSource }: any) => (
        <div data-testid="generic-table">
            {dataSource.length === 0 && <span>No data</span>}
        </div>
    ),
}));

describe('VisaManageBookings Page', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('should render without crashing', () => {
        render(<VisaManageBookings />);
        expect(screen.getByText('Manage Bookings')).toBeInTheDocument();
    });

    it('should render the date range picker', () => {
        render(<VisaManageBookings />);
        expect(document.querySelector('.ant-picker-range')).toBeInTheDocument();
    });

    it('should render the data table', async () => {
        render(<VisaManageBookings />);
        expect(await screen.findByTestId('generic-table')).toBeInTheDocument();
    });
});
