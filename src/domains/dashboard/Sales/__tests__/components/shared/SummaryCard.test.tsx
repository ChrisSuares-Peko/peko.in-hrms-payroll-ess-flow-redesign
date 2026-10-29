import React from 'react';

import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';

import SummaryCard from '../../../components/shared/SummaryCard';

describe('SummaryCard', () => {
    it('renders title and rows', () => {
        render(
            <SummaryCard
                title="Payment Summary"
                rows={[
                    { label: 'Amount', value: '₹500' },
                    { label: 'Status', value: 'PENDING' },
                ]}
            />
        );

        expect(screen.getByText('Payment Summary')).toBeInTheDocument();
        expect(screen.getByText('Amount')).toBeInTheDocument();
        expect(screen.getByText('₹500')).toBeInTheDocument();
        expect(screen.getByText('Status')).toBeInTheDocument();
        expect(screen.getByText('PENDING')).toBeInTheDocument();
    });

    it('renders ReactNode values', () => {
        render(
            <SummaryCard
                title="t"
                rows={[
                    { label: 'Tag', value: <span data-testid="tag">tag</span> },
                ]}
            />
        );

        expect(screen.getByTestId('tag')).toBeInTheDocument();
    });
});
