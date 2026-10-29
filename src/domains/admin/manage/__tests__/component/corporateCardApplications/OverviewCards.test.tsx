import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';

import OverviewCards from '../../../component/corporateCardApplications/OverviewCards';
import { ApplicationsSummary } from '../../../types/corporateCardApplications';

const summary: ApplicationsSummary = {
    totalCorporates: 790,
    totalApplications: 2,
    pending: 1,
    completed: 0,
    notProvisioned: 788,
};

describe('OverviewCards', () => {
    it('renders a loading skeleton (no tile text) when loading and there is no summary yet', () => {
        render(<OverviewCards summary={null} loading onSelectStatus={vi.fn()} activeStatus="" />);

        expect(screen.queryByText('Total Corporates')).not.toBeInTheDocument();
    });

    it('renders all four tiles with their labels, values, and captions', () => {
        render(
            <OverviewCards
                summary={summary}
                loading={false}
                onSelectStatus={vi.fn()}
                activeStatus=""
            />
        );

        expect(screen.getByText('Total Corporates')).toBeInTheDocument();
        expect(screen.getByText('790')).toBeInTheDocument();
        expect(screen.getByText('In the system')).toBeInTheDocument();

        expect(screen.getByText('Not Provisioned')).toBeInTheDocument();
        expect(screen.getByText('788')).toBeInTheDocument();

        expect(screen.getByText('Pending')).toBeInTheDocument();
        expect(screen.getByText('1')).toBeInTheDocument();

        expect(screen.getByText('Completed')).toBeInTheDocument();
        expect(screen.getByText('0')).toBeInTheDocument();
    });

    it('defaults every value to 0 when summary is null (and not loading)', () => {
        render(
            <OverviewCards
                summary={null}
                loading={false}
                onSelectStatus={vi.fn()}
                activeStatus=""
            />
        );

        expect(screen.getAllByText('0')).toHaveLength(4);
    });

    it('renders Pending and Completed as clickable buttons, but not Total Corporates/Not Provisioned', () => {
        render(
            <OverviewCards
                summary={summary}
                loading={false}
                onSelectStatus={vi.fn()}
                activeStatus=""
            />
        );

        expect(screen.getByRole('button', { name: /Pending/ })).toBeInTheDocument();
        expect(screen.getByRole('button', { name: /Completed/ })).toBeInTheDocument();
        expect(screen.queryByRole('button', { name: /Total Corporates/ })).not.toBeInTheDocument();
        expect(screen.queryByRole('button', { name: /Not Provisioned/ })).not.toBeInTheDocument();
    });

    it('calls onSelectStatus with the tile status when an inactive tile is clicked', () => {
        const onSelectStatus = vi.fn();
        render(
            <OverviewCards
                summary={summary}
                loading={false}
                onSelectStatus={onSelectStatus}
                activeStatus=""
            />
        );

        screen.getByRole('button', { name: /Pending/ }).click();

        expect(onSelectStatus).toHaveBeenCalledWith('PENDING');
    });

    it('calls onSelectStatus with an empty string when the already-active tile is clicked again', () => {
        const onSelectStatus = vi.fn();
        render(
            <OverviewCards
                summary={summary}
                loading={false}
                onSelectStatus={onSelectStatus}
                activeStatus="PENDING"
            />
        );

        screen.getByRole('button', { name: /Pending/ }).click();

        expect(onSelectStatus).toHaveBeenCalledWith('');
    });

    it('marks the active tile with aria-pressed=true and others false', () => {
        render(
            <OverviewCards
                summary={summary}
                loading={false}
                onSelectStatus={vi.fn()}
                activeStatus="PENDING"
            />
        );

        expect(screen.getByRole('button', { name: /Pending/ })).toHaveAttribute(
            'aria-pressed',
            'true'
        );
        expect(screen.getByRole('button', { name: /Completed/ })).toHaveAttribute(
            'aria-pressed',
            'false'
        );
    });
});
