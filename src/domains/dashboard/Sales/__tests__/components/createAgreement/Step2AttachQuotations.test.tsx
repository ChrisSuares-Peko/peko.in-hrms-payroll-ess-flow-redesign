import React from 'react';

import { render, screen, fireEvent } from '@testing-library/react';
import { vi, describe, it, beforeEach, expect } from 'vitest';

import Step2AttachQuotations from '../../../components/createAgreement/Step2AttachQuotations';
import useCustomerQuotations from '../../../hooks/agreement/useCustomerQuotations';

vi.mock('../../../hooks/agreement/useCustomerQuotations', () => ({
    default: vi.fn(),
}));
vi.mock('@src/hooks/useDebounce', () => ({
    default: (v: any) => v,
}));
vi.mock('../../../components/createAgreement/QuotationSelectionCard', () => ({
    default: ({ quotation }: any) => <div data-testid="quotation-card">{quotation.displayId}</div>,
}));
vi.mock('../../../components/createAgreement/SelectionCardSkeleton', () => ({
    default: () => <div data-testid="skeleton" />,
}));

beforeEach(() => {
    vi.clearAllMocks();
});

describe('Step2AttachQuotations', () => {
    const sampleQuotations = [
        {
            id: 'q1',
            displayId: 'Q-101',
            customer: 'Acme',
            date: '01 Jan 2026',
            amount: 5000,
            rawId: 101,
            status: 'PENDING',
            subtotal: 4500,
            tax: 500,
            discount: 0,
            items: [],
        },
    ];

    it('renders skeleton while loading', () => {
        (useCustomerQuotations as any).mockReturnValue({ quotations: [], isLoading: true });

        render(
            <Step2AttachQuotations
                confirmedCustomerId="c-1"
                selectedQuotationId=""
                onSelectQuotation={() => {}}
                onSkip={() => {}}
            />
        );

        expect(screen.getByTestId('skeleton')).toBeInTheDocument();
    });

    it('shows empty state when no quotations', () => {
        (useCustomerQuotations as any).mockReturnValue({ quotations: [], isLoading: false });

        render(
            <Step2AttachQuotations
                confirmedCustomerId="c-1"
                selectedQuotationId=""
                onSelectQuotation={() => {}}
                onSkip={() => {}}
            />
        );

        expect(screen.getByText('No quotations found')).toBeInTheDocument();
    });

    it('selects a quotation when clicked', () => {
        (useCustomerQuotations as any).mockReturnValue({
            quotations: sampleQuotations,
            isLoading: false,
        });
        const onSelectQuotation = vi.fn();

        render(
            <Step2AttachQuotations
                confirmedCustomerId="c-1"
                selectedQuotationId=""
                onSelectQuotation={onSelectQuotation}
                onSkip={() => {}}
            />
        );

        fireEvent.click(screen.getAllByText('Q-101')[0]);
        expect(onSelectQuotation).toHaveBeenCalledWith('q1', 101);
    });

    it('clears selection (passes empty id) when clicking the already-selected quotation', () => {
        (useCustomerQuotations as any).mockReturnValue({
            quotations: sampleQuotations,
            isLoading: false,
        });
        const onSelectQuotation = vi.fn();

        render(
            <Step2AttachQuotations
                confirmedCustomerId="c-1"
                selectedQuotationId="q1"
                onSelectQuotation={onSelectQuotation}
                onSkip={() => {}}
            />
        );

        // The list row appears alongside the detail card; click the row.
        fireEvent.click(screen.getAllByText('Q-101')[0]);
        expect(onSelectQuotation).toHaveBeenCalledWith('', undefined);
    });

    it('triggers onSkip when skip link is clicked', () => {
        (useCustomerQuotations as any).mockReturnValue({ quotations: [], isLoading: false });
        const onSkip = vi.fn();

        render(
            <Step2AttachQuotations
                confirmedCustomerId="c-1"
                selectedQuotationId=""
                onSelectQuotation={() => {}}
                onSkip={onSkip}
            />
        );

        fireEvent.click(screen.getByText(/skip this step/i));
        expect(onSkip).toHaveBeenCalled();
    });

    it('renders the selected quotation card when one is selected', () => {
        (useCustomerQuotations as any).mockReturnValue({
            quotations: sampleQuotations,
            isLoading: false,
        });

        render(
            <Step2AttachQuotations
                confirmedCustomerId="c-1"
                selectedQuotationId="q1"
                onSelectQuotation={() => {}}
                onSkip={() => {}}
            />
        );

        expect(screen.getByTestId('quotation-card')).toBeInTheDocument();
    });
});
