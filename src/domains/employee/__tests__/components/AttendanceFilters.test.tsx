import { fireEvent, render, screen } from '@testing-library/react';
import dayjs from 'dayjs';
import { describe, expect, it, vi } from 'vitest';

import AttendanceFilters from '../../components/AttendanceFilters';

const statusOptions = [
    { label: 'All', value: 'all' },
    { label: 'Present', value: 'present' },
    { label: 'Absent', value: 'absent' },
];

const renderFilters = (overrides: Partial<Parameters<typeof AttendanceFilters>[0]> = {}) => {
    const props = {
        statusValue: 'all',
        statusOptions,
        onStatusChange: vi.fn(),
        range: null,
        onRangeChange: vi.fn(),
        search: '',
        onSearchChange: vi.fn(),
        ...overrides,
    };
    render(<AttendanceFilters {...props} />);
    return props;
};

describe('AttendanceFilters', () => {
    it('renders the status select, date range and search input', () => {
        renderFilters();

        expect(screen.getByRole('combobox')).toBeInTheDocument();
        expect(screen.getByPlaceholderText('From date')).toBeInTheDocument();
        expect(screen.getByPlaceholderText('To date')).toBeInTheDocument();
        expect(screen.getByPlaceholderText('Search')).toBeInTheDocument();
    });

    it('shows the currently selected status label', () => {
        renderFilters({ statusValue: 'present' });

        expect(screen.getByText('Present')).toBeInTheDocument();
    });

    it('calls onStatusChange with the selected option value', async () => {
        const onStatusChange = vi.fn();
        renderFilters({ onStatusChange });

        fireEvent.mouseDown(screen.getByRole('combobox'));
        const option = await screen.findByText('Absent', {
            selector: 'div.ant-select-item-option-content',
        });
        fireEvent.click(option);

        // antd's Select onChange forwards (value, option) — the option arg passes through too.
        expect(onStatusChange).toHaveBeenCalledWith('absent', expect.anything());
    });

    it('calls onSearchChange with the typed value', () => {
        const onSearchChange = vi.fn();
        renderFilters({ onSearchChange });

        fireEvent.change(screen.getByPlaceholderText('Search'), {
            target: { value: 'John' },
        });

        expect(onSearchChange).toHaveBeenCalledWith('John');
    });

    it('strips emoji characters from the search input before calling onSearchChange', () => {
        const onSearchChange = vi.fn();
        renderFilters({ onSearchChange });

        fireEvent.change(screen.getByPlaceholderText('Search'), {
            target: { value: 'John😀' },
        });

        expect(onSearchChange).toHaveBeenCalledWith('John');
    });

    it('calls onRangeChange when the selected date range is cleared', () => {
        const onRangeChange = vi.fn();
        const range: [dayjs.Dayjs, dayjs.Dayjs] = [dayjs('2024-06-01'), dayjs('2024-06-30')];
        const { container } = render(
            <AttendanceFilters
                statusValue="all"
                statusOptions={statusOptions}
                onStatusChange={vi.fn()}
                range={range}
                onRangeChange={onRangeChange}
                search=""
                onSearchChange={vi.fn()}
            />
        );

        const clearBtn = container.querySelector('.ant-picker-clear');
        expect(clearBtn).not.toBeNull();
        fireEvent.click(clearBtn as Element);

        // antd's RangePicker onChange forwards (dates, dateStrings) — the dateStrings arg passes through too.
        expect(onRangeChange).toHaveBeenCalledWith(null, expect.anything());
    });
});
