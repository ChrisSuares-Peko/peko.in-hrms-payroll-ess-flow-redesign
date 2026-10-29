import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';

import TimeComponent from '../../components/TimeComponent';

describe('TimeComponent', () => {
    const mockHandleTimeChange = vi.fn();
    const mockHandleWeekChange = vi.fn();

    beforeEach(() => {
        mockHandleTimeChange.mockClear();
        mockHandleWeekChange.mockClear();
    });

    const renderComponent = (props = {}) =>
        render(
            <TimeComponent
                timeVal="12:30"
                handleTimeChange={mockHandleTimeChange}
                week
                handleWeekChange={mockHandleWeekChange}
                WeekVal="Monday"
                {...props}
            />
        );

    it('renders correctly', () => {
        renderComponent();
        expect(screen.getByText(/Pick Week Day/i)).toBeInTheDocument();
        expect(screen.getByText(/Pick Time/i)).toBeInTheDocument();
    });

    it('calls handleWeekChange when a new week day is selected', async () => {
        renderComponent();
        const select = screen.getByRole('combobox'); // AntD Select component
        fireEvent.mouseDown(select);

        const option = await screen.findByText('Tuesday');
        fireEvent.click(option);

        expect(mockHandleWeekChange).toHaveBeenCalledWith('2', {
            label: 'Tuesday',
            value: '2',
        });
    });

    it('displays default values correctly', () => {
        renderComponent();
        expect(screen.getByText('Monday')).toBeInTheDocument(); // Default week day
    });
});
