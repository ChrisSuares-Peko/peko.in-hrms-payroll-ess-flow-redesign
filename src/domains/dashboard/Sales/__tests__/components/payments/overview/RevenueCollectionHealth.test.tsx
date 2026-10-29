import React from 'react';

import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';

import RevenueCollectionHealth from '../../../../components/payments/overview/RevenueCollectionHealth';

describe('RevenueCollectionHealth', () => {
    const segments = [
        { label: 'Collected', color: '#43B75D', pct: 60, amount: 600 },
        { label: 'Outstanding', color: '#F59E0B', pct: 30, amount: 300 },
        { label: 'Overdue', color: '#EF4444', pct: 10, amount: 100 },
    ];

    it('renders title, total invoiced and segment legend entries', () => {
        render(
            <RevenueCollectionHealth revenueSegments={segments} totalInvoiced={1000} />
        );

        expect(screen.getByText('Revenue Collection Health')).toBeInTheDocument();
        expect(screen.getByText(/Total Invoiced/)).toBeInTheDocument();
        expect(screen.getByText('60% Collection Rate')).toBeInTheDocument();

        // Each legend includes pct and amount; assert presence by scanning the document text.
        expect(screen.getByText(/Collected \(60%\)/)).toBeInTheDocument();
        expect(screen.getByText(/Outstanding \(30%\)/)).toBeInTheDocument();
        expect(screen.getByText(/Overdue \(10%\)/)).toBeInTheDocument();
    });

    it('skips the progress bar segment when its pct is 0', () => {
        const noOverdue = [
            { label: 'Collected', color: '#43B75D', pct: 100, amount: 1000 },
            { label: 'Outstanding', color: '#F59E0B', pct: 0, amount: 0 },
            { label: 'Overdue', color: '#EF4444', pct: 0, amount: 0 },
        ];
        const { container } = render(
            <RevenueCollectionHealth revenueSegments={noOverdue} totalInvoiced={1000} />
        );

        const progressBars = container.querySelectorAll('.ant-progress');
        // Only the collected segment renders a Progress bar.
        expect(progressBars.length).toBe(1);
    });
});
