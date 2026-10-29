import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import StatCard from '../../../components/dashboard/StatCard';
import { StatBreakdown } from '../../../types';

vi.mock('recharts', async importOriginal => {
    const actual = (await importOriginal()) as any;
    return {
        ...actual,
        ResponsiveContainer: ({ children }: any) => <div>{children}</div>,
        PieChart: ({ children }: any) => <div data-testid="pie-chart">{children}</div>,
        Pie: () => <div data-testid="pie" />,
        Cell: () => <div data-testid="cell" />,
    };
});

const stat: StatBreakdown = {
    onTime: 120,
    late: 15,
    notPresent: 5,
    total: 140,
    comparison: '12% more than Wednesday',
};

// The legend text is split across a bold <span> (the value) and a sibling text node
// (the label), so `getByText` can't match the concatenated string directly — match on
// the wrapping Typography.Text's full textContent instead.
const legendText = (text: string) => (_content: string, element: Element | null) =>
    Boolean(
        element &&
            element.tagName === 'SPAN' &&
            element.classList.contains('ant-typography') &&
            element.textContent === text
    );

describe('StatCard', () => {
    it('renders the title and default legend labels with values', () => {
        render(<StatCard title="Attendance Overview" stat={stat} />);

        expect(screen.getByText('Attendance Overview')).toBeInTheDocument();
        expect(screen.getByText(legendText('120 on time'))).toBeInTheDocument();
        expect(screen.getByText(legendText('15 Late attendance'))).toBeInTheDocument();
        expect(screen.getByText(legendText('5 not present'))).toBeInTheDocument();
    });

    it('renders the center total as onTime + late over the grand total', () => {
        render(<StatCard title="Attendance Overview" stat={stat} />);

        expect(screen.getByText('135')).toBeInTheDocument();
        expect(screen.getByText('/140')).toBeInTheDocument();
    });

    it('renders custom labels when provided', () => {
        render(
            <StatCard
                title="Attendance Overview"
                stat={stat}
                labels={['Punctual', 'Tardy', 'Missing']}
            />
        );

        expect(screen.getByText(legendText('120 Punctual'))).toBeInTheDocument();
        expect(screen.getByText(legendText('15 Tardy'))).toBeInTheDocument();
        expect(screen.getByText(legendText('5 Missing'))).toBeInTheDocument();
    });

    it('hides a legend entry whose label is an empty string', () => {
        render(
            <StatCard
                title="Attendance Overview"
                stat={{ ...stat, onTime: 77 }}
                labels={['', 'Tardy', 'Missing']}
            />
        );

        expect(screen.queryByText(/77/)).not.toBeInTheDocument();
        expect(screen.getByText(legendText('15 Tardy'))).toBeInTheDocument();
    });

    it('renders the comparison callout, bolding the leading token', () => {
        render(<StatCard title="Attendance Overview" stat={stat} />);

        expect(screen.getByText('12%')).toBeInTheDocument();
        expect(screen.getByText(/more than Wednesday/)).toBeInTheDocument();
    });

    it('does not render the comparison callout when comparison is absent', () => {
        render(
            <StatCard title="Attendance Overview" stat={{ ...stat, comparison: undefined }} />
        );

        expect(screen.queryByText(/more than Wednesday/)).not.toBeInTheDocument();
    });

    it('calls onViewMore when "View more" is clicked', () => {
        const onViewMore = vi.fn();
        render(<StatCard title="Attendance Overview" stat={stat} onViewMore={onViewMore} />);

        fireEvent.click(screen.getByText('View more'));

        expect(onViewMore).toHaveBeenCalledTimes(1);
    });
});
