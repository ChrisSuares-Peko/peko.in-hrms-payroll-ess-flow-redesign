import React from 'react';

import { render, screen } from '@testing-library/react';
import { vi, describe, it, expect } from 'vitest';

import RankingPanel from '../../../components/shared/RankingPanel';

vi.mock('../../../components/shared/CardRowsSkeleton', () => ({
    default: () => <div data-testid="skeleton" />,
}));

describe('RankingPanel', () => {
    it('renders skeleton when isLoading', () => {
        render(<RankingPanel title="Top" data={[]} variant="paying" isLoading />);

        expect(screen.getByTestId('skeleton')).toBeInTheDocument();
    });

    it('renders empty state when data is empty', () => {
        render(<RankingPanel title="Top" data={[]} variant="paying" />);

        // Antd Empty renders the description as text and also inside a <title> SVG element.
        expect(screen.getAllByText('No data').length).toBeGreaterThan(0);
    });

    it('renders one row per item with the title and ranks', () => {
        const data: any = [
            { id: '1', name: 'Acme', totalRevenue: 1000 },
            { id: '2', name: 'Beta', totalRevenue: 500 },
        ];
        render(<RankingPanel title="Top" data={data} variant="paying" />);

        expect(screen.getByText('Top')).toBeInTheDocument();
        expect(screen.getByText('Acme')).toBeInTheDocument();
        expect(screen.getByText('Beta')).toBeInTheDocument();
        expect(screen.getByText('#1')).toBeInTheDocument();
        expect(screen.getByText('#2')).toBeInTheDocument();
    });

    it('renders activity badge dot for activity variant', () => {
        const data: any = [{ id: '1', name: 'Acme', subtitle: 'paid', amount: 100 }];
        const { container } = render(<RankingPanel title="Activity" data={data} variant="activity" />);

        // Antd Badge renders .ant-badge.
        expect(container.querySelectorAll('.ant-badge').length).toBeGreaterThan(0);
    });
});
