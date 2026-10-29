import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { vi, describe, it, expect, beforeEach, Mock } from 'vitest';

import CorporateCardApplications from '../../../component/corporateCardApplications/CorporateCardApplications';
import useCorporateCardApplications from '../../../hooks/useCorporateCardApplications';
import { CorporateCardApplicationRow } from '../../../types/corporateCardApplications';

const mockNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
    const actual = await vi.importActual<typeof import('react-router-dom')>('react-router-dom');
    return { ...actual, useNavigate: () => mockNavigate };
});

vi.mock('../../../hooks/useCorporateCardApplications', () => ({
    default: vi.fn(),
}));

vi.mock('../../../component/corporateCardApplications/OverviewCards', () => ({
    default: ({ summary, loading, activeStatus, onSelectStatus }: any) => (
        <div data-testid="overview-cards">
            <span data-testid="overview-loading">{String(loading)}</span>
            <span data-testid="overview-active-status">{activeStatus}</span>
            <span data-testid="overview-total">{summary?.totalCorporates ?? 'none'}</span>
            <button type="button" onClick={() => onSelectStatus('PENDING')}>
                filter-pending
            </button>
        </div>
    ),
}));

vi.mock('../../../component/corporateCardApplications/ManageApplicationDrawer', () => ({
    default: ({ open, mode, row, onSaved }: any) =>
        open ? (
            <div data-testid="drawer">
                <span data-testid="drawer-mode">{mode}</span>
                <span data-testid="drawer-row">{row?.corporateId ?? 'none'}</span>
                <button type="button" onClick={onSaved}>
                    trigger-saved
                </button>
            </div>
        ) : null,
}));

vi.mock('@components/atomic/GenericTable', () => ({
    default: ({ columns, dataSource, loading, locale }: any) => {
        if (loading) return <div data-testid="table-loading" />;
        if (!dataSource?.length) return <div data-testid="empty-state">{locale?.emptyText}</div>;
        return (
            <div data-testid="generic-table">
                {dataSource.map((row: any) => (
                    <div key={row.corporateId} data-testid={`row-${row.corporateId}`}>
                        {columns.map((col: any) => (
                            <div key={col.key} data-testid={`cell-${col.key}-${row.corporateId}`}>
                                {col.render
                                    ? col.render(row[col.dataIndex], row)
                                    : row[col.dataIndex]}
                            </div>
                        ))}
                    </div>
                ))}
            </div>
        );
    },
}));

const baseRow: CorporateCardApplicationRow = {
    corporateId: 42,
    companyName: 'Steel & Co',
    entityName: null,
    fullName: 'Jane Doe',
    pekoAccountNumber: '100000726',
    email: 'jane@example.com',
    kybStatus: 'REJECTED',
    kybReference: 'KYB3F9A2B7C1D',
    cardSchemeId: null,
    svcCardNumberLast4: null,
    beneficiaryName: null,
    virtualAccountNumberLast4: null,
    virtualAccountIfsc: null,
    bankName: null,
    vendorEmailStatus: null,
    updatedAt: '2026-07-10T10:00:00.000Z',
};

const mockHook = (overrides: Partial<ReturnType<typeof useCorporateCardApplications>> = {}) => {
    (useCorporateCardApplications as Mock).mockReturnValue({
        isLoading: false,
        tableData: [],
        count: 0,
        summary: null,
        refetch: vi.fn(),
        ...overrides,
    });
};

describe('CorporateCardApplications', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    describe('the Corporate cell', () => {
        const cellText = (row: Partial<CorporateCardApplicationRow>) => {
            mockHook({ tableData: [{ ...baseRow, ...row }], count: 1 });
            render(<CorporateCardApplications />);
            return screen.getByTestId('cell-companyName-42').textContent ?? '';
        };

        it('leads with the entity name from the agreement, not the corporate name', () => {
            const text = cellText({ entityName: 'AJ Entity Pvt Ltd' });

            expect(text.indexOf('AJ Entity Pvt Ltd')).toBeLessThan(text.indexOf('Steel & Co'));
        });

        it('keeps the corporate name on the row rather than dropping it', () => {
            expect(cellText({ entityName: 'AJ Entity Pvt Ltd' })).toContain('Steel & Co');
        });

        it('falls back to the corporate name when no agreement has been filled', () => {
            expect(cellText({ entityName: null })).toContain('Steel & Co');
        });

        it('does not repeat a name that is both the entity and the corporate', () => {
            const text = cellText({ entityName: 'Steel & Co' });

            expect(text.match(/Steel & Co/g)).toHaveLength(1);
        });

        it('still names a corporate that has neither an entity nor a company name', () => {
            expect(cellText({ entityName: null, companyName: null, fullName: null })).toContain(
                'Unnamed corporate'
            );
        });
    });

    it('renders the page header', () => {
        mockHook();
        render(<CorporateCardApplications />);

        expect(screen.getByText('Corporate Card Applications')).toBeInTheDocument();
        expect(
            screen.getByText(
                'Provision the card scheme, SVC card, and virtual account each corporate tops up into.'
            )
        ).toBeInTheDocument();
    });

    it('opens the drawer in create mode when "Add Application" is clicked', () => {
        // Non-empty tableData so only the header's "Add Application" button is present —
        // the Empty state renders its own duplicate button when there are no active filters.
        mockHook({ tableData: [baseRow], count: 1 });
        render(<CorporateCardApplications />);

        expect(screen.queryByTestId('drawer')).not.toBeInTheDocument();
        fireEvent.click(screen.getByRole('button', { name: /Add Application/i }));

        expect(screen.getByTestId('drawer-mode')).toHaveTextContent('create');
        expect(screen.getByTestId('drawer-row')).toHaveTextContent('none');
    });

    it('shows the empty state with the "no filters" message when there are no active filters', () => {
        mockHook();
        render(<CorporateCardApplications />);

        expect(screen.getByTestId('empty-state')).toBeInTheDocument();
    });

    it('renders a row with "Not set" fallbacks for card scheme, SVC card, and virtual account', () => {
        mockHook({ tableData: [baseRow], count: 1 });
        render(<CorporateCardApplications />);

        const row = screen.getByTestId('row-42');
        expect(row.querySelectorAll('.italic').length).toBeGreaterThanOrEqual(3);
    });

    describe('KYB reference column', () => {
        it('shows the same reference the corporate is given on submit', () => {
            mockHook({ tableData: [baseRow], count: 1 });
            render(<CorporateCardApplications />);

            expect(screen.getByTestId('cell-kybReference-42')).toHaveTextContent('KYB3F9A2B7C1D');
        });

        it('offers the reference for copying, so it can be pasted into a support thread', () => {
            mockHook({ tableData: [baseRow], count: 1 });
            render(<CorporateCardApplications />);

            const cell = screen.getByTestId('cell-kybReference-42');
            expect(cell.querySelector('.ant-typography-copy')).toBeInTheDocument();
        });

        it('falls back to "Not set" before the corporate has submitted', () => {
            mockHook({ tableData: [{ ...baseRow, kybReference: null }], count: 1 });
            render(<CorporateCardApplications />);

            const cell = screen.getByTestId('cell-kybReference-42');
            expect(cell).toHaveTextContent('Not set');
            expect(cell.querySelector('.ant-typography-copy')).not.toBeInTheDocument();
        });
    });

    it('navigates to the documents page with the row context when "View" is clicked', () => {
        mockHook({ tableData: [baseRow], count: 1 });
        render(<CorporateCardApplications />);

        fireEvent.click(screen.getByRole('button', { name: /View documents for Steel & Co/i }));

        expect(mockNavigate).toHaveBeenCalledWith(
            expect.stringContaining('/42/documents'),
            expect.objectContaining({
                state: expect.objectContaining({
                    companyName: 'Steel & Co',
                    pekoAccountNumber: '100000726',
                }),
            })
        );
    });

    it('opens the drawer in edit mode with the row when "Manage" is clicked', () => {
        mockHook({ tableData: [baseRow], count: 1 });
        render(<CorporateCardApplications />);

        fireEvent.click(screen.getByRole('button', { name: /Manage Steel & Co/i }));

        expect(screen.getByTestId('drawer-mode')).toHaveTextContent('edit');
        expect(screen.getByTestId('drawer-row')).toHaveTextContent('42');
    });

    it('closes the drawer and refetches when the drawer reports onSaved', () => {
        const refetch = vi.fn();
        mockHook({ tableData: [baseRow], count: 1, refetch });
        render(<CorporateCardApplications />);

        fireEvent.click(screen.getByRole('button', { name: /Manage Steel & Co/i }));
        fireEvent.click(screen.getByText('trigger-saved'));

        expect(refetch).toHaveBeenCalled();
        expect(screen.queryByTestId('drawer')).not.toBeInTheDocument();
    });

    it('updates the searchText filter passed to the hook after the debounce delay', async () => {
        mockHook();
        render(<CorporateCardApplications />);

        fireEvent.change(
            screen.getByPlaceholderText('Search by name, full name or account number'),
            {
                target: { value: 'steel' },
            }
        );

        await waitFor(
            () =>
                expect(useCorporateCardApplications).toHaveBeenLastCalledWith(
                    expect.objectContaining({ searchText: 'steel', page: 1 })
                ),
            { timeout: 1000 }
        );
    });

    it('updates the status filter passed to the hook when a status tile is selected', () => {
        mockHook();
        render(<CorporateCardApplications />);

        fireEvent.click(screen.getByText('filter-pending'));

        expect(useCorporateCardApplications).toHaveBeenLastCalledWith(
            expect.objectContaining({ status: 'PENDING', page: 1 })
        );
    });

    it('does not render pagination when count is 0', () => {
        mockHook({ tableData: [], count: 0 });
        render(<CorporateCardApplications />);

        expect(document.querySelector('.ant-pagination')).not.toBeInTheDocument();
    });

    it('renders pagination when count is greater than 0', () => {
        mockHook({ tableData: [baseRow], count: 25 });
        render(<CorporateCardApplications />);

        expect(document.querySelector('.ant-pagination')).toBeInTheDocument();
    });
});
