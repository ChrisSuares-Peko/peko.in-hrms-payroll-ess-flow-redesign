import React from 'react';

import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';

import TransactionTimeline from '../../../../components/payments/paymentTracking/TransactionTimeline';

describe('TransactionTimeline', () => {
    it('renders empty message when no timeline entries', () => {
        render(<TransactionTimeline data={null} />);

        expect(screen.getByText('Transaction Timeline')).toBeInTheDocument();
        expect(screen.getByText('No timeline available')).toBeInTheDocument();
    });

    it('renders one row per timeline step', () => {
        const data: any = {
            timeline: [
                { label: 'Created', time: '2026-01-01T00:00:00' },
                { label: 'Paid', time: 'just now' },
            ],
        };
        render(<TransactionTimeline data={data} />);

        expect(screen.getByText('Created')).toBeInTheDocument();
        expect(screen.getByText('Paid')).toBeInTheDocument();
        expect(screen.getByText('just now')).toBeInTheDocument();
    });
});
