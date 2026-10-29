import { fireEvent, render, screen } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { describe, expect, it, vi } from 'vitest';

import ActivityList from '../../../components/Dashboard/ActivityList';
import { TodayAttendanceCounts, activities } from '../../../types/dashboardTypes';

const mockNavigate = vi.fn();

vi.mock('react-router-dom', async importOriginal => {
    const actual = (await importOriginal()) as any;
    return {
        ...actual,
        useNavigate: () => mockNavigate,
    };
});

const renderComponent = ({
    isLoading = false,
    activityList = [] as activities[],
    todayAttendance,
}: {
    isLoading?: boolean;
    activityList?: activities[];
    todayAttendance?: TodayAttendanceCounts;
} = {}) =>
    render(
        <BrowserRouter>
            <ActivityList
                isLoading={isLoading}
                activities={activityList}
                viewCalendarRef={{ current: null }}
                colorPrimary="#ff0000"
                todayAttendance={todayAttendance}
            />
        </BrowserRouter>
    );

describe('ActivityList', () => {
    const counts: TodayAttendanceCounts = { present: 12, late: 3, absent: 2, onLeave: 1 };

    it("renders the 4 today's attendance stat cards with correct counts from props", () => {
        renderComponent({ todayAttendance: counts });

        expect(screen.getByText("Today's Attendance")).toBeInTheDocument();
        expect(screen.getByText('12')).toBeInTheDocument();
        expect(screen.getByText('3')).toBeInTheDocument();
        expect(screen.getByText('2')).toBeInTheDocument();
        expect(screen.getByText('1')).toBeInTheDocument();
        expect(screen.getByText(/Present/)).toBeInTheDocument();
        expect(screen.getByText(/Late/)).toBeInTheDocument();
        expect(screen.getByText(/Absent/)).toBeInTheDocument();
        expect(screen.getByText(/On Leave/)).toBeInTheDocument();
    });

    it('defaults each stat count to 0 when todayAttendance is not provided', () => {
        renderComponent({ todayAttendance: undefined });

        const zeros = screen.getAllByText('0');
        expect(zeros).toHaveLength(4);
    });

    it('renders the activities list items from props', () => {
        const activityList: activities[] = [
            { title: 'New Joiner', body: 'John joined the team', start: '2026-07-10T00:00:00.000Z', type: 'joining' },
            { title: 'Leave Approved', body: "Jane's leave was approved", start: '2026-07-12T00:00:00.000Z', type: 'leave' },
        ];

        renderComponent({ activityList });

        expect(screen.getByText('Activities')).toBeInTheDocument();
        expect(screen.getByText('New Joiner')).toBeInTheDocument();
        expect(screen.getByText('John joined the team')).toBeInTheDocument();
        expect(screen.getByText('2026-07-10')).toBeInTheDocument();
        expect(screen.getByText('Leave Approved')).toBeInTheDocument();
        expect(screen.getByText("Jane's leave was approved")).toBeInTheDocument();
    });

    it('renders a loading skeleton instead of the activities list when isLoading is true', () => {
        const activityList: activities[] = [
            { title: 'New Joiner', body: 'John joined the team', start: '2026-07-10T00:00:00.000Z', type: 'joining' },
        ];

        const { container } = renderComponent({ isLoading: true, activityList });

        expect(screen.queryByText('New Joiner')).not.toBeInTheDocument();
        expect(screen.queryByText('Activities')).not.toBeInTheDocument();
        expect(container.querySelector('.ant-skeleton')).toBeInTheDocument();
    });

    it('navigates to the timesheet page when "View more" is clicked', () => {
        renderComponent({ todayAttendance: counts });

        fireEvent.click(screen.getByText('View more'));

        expect(mockNavigate).toHaveBeenCalledWith('/payroll/timesheet');
    });
});
