import { render, screen, within } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import AttendanceTable from '../../../components/dashboard/AttendanceTable';
import { DashboardAttendanceRow } from '../../../types';

const records: DashboardAttendanceRow[] = [
    {
        id: '1',
        name: '10 Jun 2024',
        joinDate: '09:02',
        checkout: '18:05',
        hours: '9h 03m',
        status: 'Present',
    },
    {
        id: '2',
        name: '11 Jun 2024',
        joinDate: '09:45',
        checkout: '18:10',
        hours: '8h 25m',
        status: 'Late',
    },
    {
        id: '3',
        name: '12 Jun 2024',
        joinDate: '--:--',
        checkout: '--:--',
        hours: '0h 00m',
        status: 'Absent',
    },
];

describe('AttendanceTable', () => {
    it('renders the column headers', () => {
        const { container } = render(<AttendanceTable records={records} />);

        // antd renders a hidden "measure" row that duplicates header text, so scope to <thead>.
        const thead = within(container.querySelector('thead') as HTMLElement);
        expect(thead.getByText('Date')).toBeInTheDocument();
        expect(thead.getByText('Checkin')).toBeInTheDocument();
        expect(thead.getByText('Checkout')).toBeInTheDocument();
        expect(thead.getByText('Hours')).toBeInTheDocument();
        expect(thead.getByText('Status')).toBeInTheDocument();
    });

    it('renders a row per record with the correct cell values', () => {
        render(<AttendanceTable records={records} />);

        expect(screen.getByText('10 Jun 2024')).toBeInTheDocument();
        expect(screen.getByText('09:02')).toBeInTheDocument();
        expect(screen.getByText('18:05')).toBeInTheDocument();
        expect(screen.getByText('9h 03m')).toBeInTheDocument();

        // header row + 3 data rows
        expect(screen.getAllByRole('row')).toHaveLength(4);
    });

    it.each([
        ['Present', '#008845'],
        ['Late', '#E0A800'],
        ['Absent', '#D92D20'],
    ])('renders the %s status badge with its accent color', (status, color) => {
        render(<AttendanceTable records={records} />);

        const badgeText = screen.getByText(status);
        expect(badgeText).toBeInTheDocument();
        expect(badgeText).toHaveStyle({ color });
    });

    it('renders an empty state when there are no records', () => {
        const { container } = render(<AttendanceTable records={[]} />);

        const thead = within(container.querySelector('thead') as HTMLElement);
        expect(thead.getByText('Date')).toBeInTheDocument();
        // header row + the empty-state placeholder row
        expect(screen.getAllByRole('row')).toHaveLength(2);
        expect(screen.getAllByText(/no data/i).length).toBeGreaterThan(0);
    });
});
