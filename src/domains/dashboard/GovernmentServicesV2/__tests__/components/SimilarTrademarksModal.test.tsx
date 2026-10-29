import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import { SimilarTrademark } from '../../apis';
import SimilarTrademarksModal from '../../components/SimilarTrademarksModal';

const makeMark = (overrides: Partial<SimilarTrademark>): SimilarTrademark => ({
    tm_applied_for: 'PEKO',
    agent_name: '',
    proprietor_address: '',
    county: '',
    trade_mark_type: '',
    appropriate_office: '',
    proprietor_name: 'Owner',
    application_no: '1',
    tm_status: 'Registered',
    logo: '',
    application_date: '',
    state: '',
    class: '9',
    timestamp: '',
    ...overrides,
});

const results = [
    makeMark({ application_no: '1', tm_applied_for: 'PEKO ONE', class: '9', tm_status: 'Registered', proprietor_name: 'Alpha' }),
    makeMark({ application_no: '2', tm_applied_for: 'PEKO PAY', class: '36', tm_status: 'Opposed', proprietor_name: 'Beta' }),
    makeMark({ application_no: '3', tm_applied_for: 'PEKOX', class: '9', tm_status: 'Abandoned', proprietor_name: 'Gamma' }),
];

const renderModal = (classFilter = 'all') =>
    render(
        <SimilarTrademarksModal
            open
            onClose={vi.fn()}
            searchTerm="Peko"
            results={results}
            classFilter={classFilter}
            onClassFilterChange={vi.fn()}
        />
    );

describe('SimilarTrademarksModal', () => {
    it('shows the search term and all results for the "all" filter', () => {
        renderModal();

        expect(screen.getByText('Similar Trademarks')).toBeInTheDocument();
        expect(screen.getByDisplayValue('Peko')).toBeInTheDocument();
        expect(screen.getByText('PEKO ONE')).toBeInTheDocument();
        expect(screen.getByText('PEKO PAY')).toBeInTheDocument();
        expect(screen.getByText('PEKOX')).toBeInTheDocument();
    });

    it('filters results by the selected class', () => {
        renderModal('9');

        expect(screen.getByText('PEKO ONE')).toBeInTheDocument();
        expect(screen.getByText('PEKOX')).toBeInTheDocument();
        expect(screen.queryByText('PEKO PAY')).not.toBeInTheDocument();
    });

    it('colours statuses by registration state', () => {
        renderModal();

        expect(screen.getByText('Registered')).toHaveStyle({ color: '#16a34a' });
        expect(screen.getByText('Opposed')).toHaveStyle({ color: '#f97316' });
        expect(screen.getByText('Abandoned')).toHaveStyle({ color: '#64748b' });
    });
});
