import { fireEvent, render, screen } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { beforeEach, describe, expect, it, Mock, vi } from 'vitest';

import { useAppDispatch, useAppSelector } from '@src/hooks/store';
import useGetAddonDetails from '@src/hooks/useSubscriptionAddons';

import { useDashboardActivities } from '../../hooks/dashboardHooks/useDashboardActivities';
import useGetEmployeeCount from '../../hooks/dashboardHooks/useGetEmployeeCount';
import { useSummaryStats } from '../../hooks/dashboardHooks/useSummaryStats';
import { useTodaysAttendance } from '../../hooks/dashboardHooks/useTodaysAttendance';
import Dash from '../../pages/Dash';

vi.mock('@src/hooks/store', () => ({
    useAppSelector: vi.fn(),
    useAppDispatch: vi.fn(),
}));

vi.mock('@src/hooks/useScreenSize', () => ({
    default: vi.fn(() => ({ md: true })),
}));

vi.mock('@src/hooks/useScrollToTop', () => ({
    useScrollToTop: vi.fn(),
}));

vi.mock('@src/hooks/useSubscriptionAddons', () => ({
    default: vi.fn(),
}));

vi.mock('../../../Home/hooks/useEnableProductTour', () => ({
    default: vi.fn(() => ({ handleUpdateTour: vi.fn(), isLoadingTour: false })),
}));

vi.mock('../../hooks/dashboardHooks/useDashboardActivities', () => ({
    useDashboardActivities: vi.fn(),
}));

vi.mock('../../hooks/dashboardHooks/useGetEmployeeCount', () => ({
    default: vi.fn(),
}));

vi.mock('../../hooks/dashboardHooks/useSummaryStats', () => ({
    useSummaryStats: vi.fn(),
}));

vi.mock('../../hooks/dashboardHooks/useTodaysAttendance', () => ({
    useTodaysAttendance: vi.fn(),
}));

vi.mock('@domains/dashboard/Payroll/components/Dashboard/ActivityList', () => ({
    default: (props: any) => (
        <div data-testid="activity-list">
            {JSON.stringify({ isLoading: props.isLoading, activities: props.activities, todayAttendance: props.todayAttendance })}
        </div>
    ),
}));

vi.mock('@domains/dashboard/Payroll/components/Dashboard/DashboardHeader', () => ({
    default: () => <div data-testid="dashboard-header" />,
}));

vi.mock('@domains/dashboard/Payroll/components/Dashboard/InfoCard', () => ({
    default: (props: any) => (
        <div data-testid="info-card">
            {props.title}:{String(props.value)}
            {props.outOf !== undefined ? `/${props.outOf}` : ''}
        </div>
    ),
}));

vi.mock('@domains/dashboard/Payroll/components/Dashboard/NavigationCards', () => ({
    default: (props: any) => (
        <button type="button" data-testid={`nav-card-${props.title}`} onClick={props.onClick}>
            {props.title}
        </button>
    ),
}));

vi.mock('@domains/dashboard/Payroll/components/Dashboard/UpcomingActivityCard', () => ({
    default: () => <div data-testid="upcoming-activity-card" />,
}));

vi.mock('../../components/Dashboard/Chart', () => ({
    default: () => <div data-testid="chart" />,
}));

vi.mock('../../components/Dashboard/DashboardBanner', () => ({
    default: () => <div data-testid="dashboard-banner" />,
}));

vi.mock('../../components/Dashboard/PayrollAccessBanner', () => ({
    default: () => <div data-testid="payroll-access-banner" />,
}));

vi.mock('../../components/modals/DownloadPaySlipModal', () => ({
    default: () => <div data-testid="download-payslip-modal" />,
}));

const mockUser = {
    roleName: 'corporate',
    productTour: { payroll: false },
};

const renderReduxState = ({
    user = mockUser,
    progress = '50%',
}: { user?: any; progress?: string } = {}) => {
    (useAppSelector as Mock).mockImplementation((selector: any) =>
        selector({
            reducer: {
                user: { user },
                payrollAuth: { progress },
            },
        })
    );
};

const renderDash = () =>
    render(
        <BrowserRouter>
            <Dash />
        </BrowserRouter>
    );

beforeEach(() => {
    vi.clearAllMocks();
    (useAppDispatch as Mock).mockReturnValue(vi.fn());
    renderReduxState();
    (useGetAddonDetails as Mock).mockReturnValue({
        addonData: { maxLimit: 100 },
        isLoading: false,
        purchaseData: undefined,
        refresh: vi.fn(),
    });
    (useSummaryStats as Mock).mockReturnValue({
        isLoading: false,
        totalSalary: 500000,
        activeEmployees: 42,
        nextMonthSalary: 600000,
    });
    (useDashboardActivities as Mock).mockReturnValue({
        isLoading: false,
        activities: [
            { title: 'New Joiner', body: 'John joined', start: '2026-07-10T00:00:00.000Z', type: 'joining' },
        ],
    });
    (useGetEmployeeCount as Mock).mockReturnValue({
        isLoading: false,
        count: 30,
        setRefresh: vi.fn(),
        date: '2026-07-01T00:00:00.000Z',
    });
    (useTodaysAttendance as Mock).mockReturnValue({
        isLoading: false,
        counts: { present: 10, late: 2, absent: 1, onLeave: 0 },
    });
});

describe('Dash page', () => {
    it('renders the key layout sections', () => {
        renderDash();

        expect(screen.getByTestId('payroll-access-banner')).toBeInTheDocument();
        expect(screen.getByTestId('dashboard-header')).toBeInTheDocument();
        expect(screen.getByTestId('activity-list')).toBeInTheDocument();
    });

    it('renders the DashboardBanner when progress is not 100%', () => {
        renderReduxState({ progress: '50%' });
        renderDash();

        expect(screen.getByTestId('dashboard-banner')).toBeInTheDocument();
    });

    it('does not render the DashboardBanner when progress is 100%', () => {
        renderReduxState({ progress: '100%' });
        renderDash();

        expect(screen.queryByTestId('dashboard-banner')).not.toBeInTheDocument();
    });

    it('renders InfoCards with the correct values from useSummaryStats and useGetEmployeeCount', () => {
        renderDash();

        const infoCards = screen.getAllByTestId('info-card');
        const infoCardTexts = infoCards.map(el => el.textContent);

        expect(infoCardTexts).toContain('Active Employees:42/30');
        expect(infoCardTexts).toContain('Net Processed Salary:500000');
        expect(infoCardTexts).toContain('Next Month Salary:600000');
    });

    it('renders loading skeletons instead of InfoCards while summary stats are loading', () => {
        (useSummaryStats as Mock).mockReturnValue({
            isLoading: true,
            totalSalary: undefined,
            activeEmployees: undefined,
            nextMonthSalary: undefined,
        });

        const { container } = renderDash();

        expect(screen.queryAllByTestId('info-card')).toHaveLength(0);
        expect(container.querySelectorAll('.ant-skeleton-button').length).toBe(3);
    });

    it('passes activities, isLoading, and today attendance counts down to ActivityList', () => {
        renderDash();

        const activityList = screen.getByTestId('activity-list');
        const payload = JSON.parse(activityList.textContent ?? '{}');

        expect(payload.isLoading).toBe(false);
        expect(payload.todayAttendance).toEqual({ present: 10, late: 2, absent: 1, onLeave: 0 });
        expect(payload.activities).toEqual([
            { title: 'New Joiner', body: 'John joined', start: '2026-07-10T00:00:00.000Z', type: 'joining' },
        ]);
    });

    it('renders a NavigationCard for each of the 9 nav menu entries', () => {
        renderDash();

        [
            'Employees & Departments',
            'Salary',
            'Leaves',
            'Attendance',
            'Reimbursements',
            'Company Documents',
            'Reports & Forms',
            'Announcements',
            'Download Payslip',
        ].forEach(title => {
            expect(screen.getByTestId(`nav-card-${title}`)).toBeInTheDocument();
        });
    });

    it('opens the DownloadPaySlipModal when the "Download Payslip" nav card is clicked', () => {
        renderDash();

        expect(screen.queryByTestId('download-payslip-modal')).not.toBeInTheDocument();

        fireEvent.click(screen.getByTestId('nav-card-Download Payslip'));

        expect(screen.getByTestId('download-payslip-modal')).toBeInTheDocument();
    });

    it('renders the employee count summary and Chart once summary/count data has loaded', () => {
        renderDash();

        expect(screen.getByText(/Number of added employees: 30 Employees/)).toBeInTheDocument();
        expect(screen.getByTestId('chart')).toBeInTheDocument();
    });

    it('does not render the Upgrade button for a corporate sub user', () => {
        renderReduxState({ user: { ...mockUser, roleName: 'corporate sub user' } });
        renderDash();

        expect(screen.queryByRole('button', { name: 'Upgrade' })).not.toBeInTheDocument();
    });

    it('renders the Upgrade button for a non-sub-user role', () => {
        renderDash();

        expect(screen.getByRole('button', { name: 'Upgrade' })).toBeInTheDocument();
    });
});
