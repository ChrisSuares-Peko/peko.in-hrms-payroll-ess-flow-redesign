import React from 'react';

import { render, screen } from '@testing-library/react';
import { vi, describe, it, expect } from 'vitest';

import ScheduledRemindersTable from '../../../../components/payments/reminders/ScheduledRemindersTable';

vi.mock('@components/atomic/GenericTable', () => ({
    default: ({ dataSource }: any) => (
        <div data-testid="reminder-table">{(dataSource ?? []).length} rows</div>
    ),
}));
vi.mock('../../../../utils/dummyData', () => ({
    DUMMY_DATA: [{ id: 1 }, { id: 2 }],
}));
vi.mock('../../../../utils/table_column/scheduledReminderColumns', () => ({
    scheduledReminderColumns: [],
}));

describe('ScheduledRemindersTable', () => {
    it('renders the title, pending tag and the table', () => {
        render(<ScheduledRemindersTable />);

        expect(screen.getByText('Scheduled Reminders')).toBeInTheDocument();
        expect(screen.getByText(/3 pending/i)).toBeInTheDocument();
        expect(screen.getByTestId('reminder-table')).toHaveTextContent('2 rows');
    });
});
