import React from 'react';

import { render, screen } from '@testing-library/react';
import { vi, describe, it, expect } from 'vitest';

import AgreementSummaryCard from '../../../components/agreementDetails/AgreementSummaryCard';

vi.mock('../../../components/shared/CopyableRow', () => ({
    default: ({ title, description }: any) => (
        <div data-testid="row">
            <span>{title}</span>
            <span>{description}</span>
        </div>
    ),
}));

describe('AgreementSummaryCard', () => {
    it('renders all five summary fields', () => {
        render(
            <AgreementSummaryCard
                displayId="AGR-001"
                customerName="Acme"
                linkedQuotation="Q-5"
                startDate="January 1, 2026"
                contractType="Service"
            />
        );

        expect(screen.getByText('Agreement Summary')).toBeInTheDocument();
        expect(screen.getByText('AGR-001')).toBeInTheDocument();
        expect(screen.getByText('Acme')).toBeInTheDocument();
        expect(screen.getByText('Q-5')).toBeInTheDocument();
        expect(screen.getByText('January 1, 2026')).toBeInTheDocument();
        expect(screen.getByText('Service')).toBeInTheDocument();
        expect(screen.getAllByTestId('row')).toHaveLength(5);
    });
});
