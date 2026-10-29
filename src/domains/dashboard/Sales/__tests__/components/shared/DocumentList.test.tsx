import React from 'react';

import { render, screen, fireEvent } from '@testing-library/react';
import { vi, describe, it, beforeEach, expect } from 'vitest';

import DocumentList from '../../../components/shared/DocumentList';
import useDocumentList from '../../../hooks/documents/useDocumentList';

vi.mock('../../../hooks/documents/useDocumentList', () => ({ default: vi.fn() }));
vi.mock('@src/hooks/useDebounceSearch', () => ({
    default: () => ({ searchText: '', updateSearchText: vi.fn() }),
}));
vi.mock('@components/atomic/GenericTable', () => ({
    default: ({ dataSource }: any) => (
        <div data-testid="document-table">{(dataSource ?? []).length} rows</div>
    ),
}));
vi.mock('@components/molecular/modals/ConfirmationModal', () => ({
    default: ({ isOpen }: any) => (isOpen ? <div data-testid="confirm-modal" /> : null),
}));
vi.mock('../../../components/shared/StatCard', () => ({
    default: ({ label, value }: any) => (
        <div>
            <span>{label}</span>
            <span>{value}</span>
        </div>
    ),
}));

beforeEach(() => {
    vi.clearAllMocks();
    (useDocumentList as any).mockReturnValue({
        list: { DocumentData: [{ id: 'd-1' }, { id: 'd-2' }], recordsTotal: 2 },
        isLoading: false,
        isDeleting: false,
        deleteDocument: vi.fn(),
    });
});

describe('DocumentList', () => {
    const baseProps = {
        documentType: 'INVOICE' as const,
        pageTitle: 'All Invoices',
        createLabel: 'Create Invoice',
        onCreateClick: vi.fn(),
        stats: [
            {
                id: 'a',
                label: 'Total',
                value: '5',
                bgColor: '#fff',
                icon: '/i.svg',
            },
        ] as any,
        listTitle: 'Invoice List',
        searchPlaceholder: 'Search invoices...',
        columns: () => [],
    };

    it('renders header, button, stats, and table', () => {
        render(<DocumentList {...baseProps} />);

        expect(screen.getByText('All Invoices')).toBeInTheDocument();
        expect(screen.getByRole('button', { name: /create invoice/i })).toBeInTheDocument();
        expect(screen.getByText('Total')).toBeInTheDocument();
        expect(screen.getByText('5')).toBeInTheDocument();
        expect(screen.getByText('Invoice List')).toBeInTheDocument();
        expect(screen.getByPlaceholderText('Search invoices...')).toBeInTheDocument();
        expect(screen.getByTestId('document-table')).toHaveTextContent('2 rows');
    });

    it('triggers onCreateClick when the create button is clicked', () => {
        const onCreateClick = vi.fn();
        render(<DocumentList {...baseProps} onCreateClick={onCreateClick} />);

        fireEvent.click(screen.getByRole('button', { name: /create invoice/i }));
        expect(onCreateClick).toHaveBeenCalled();
    });
});
