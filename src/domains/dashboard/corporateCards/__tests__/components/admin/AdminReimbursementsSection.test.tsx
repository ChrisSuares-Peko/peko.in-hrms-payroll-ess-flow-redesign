import React from 'react';

import { render, screen, fireEvent } from '@testing-library/react';
import { vi, describe, it, expect, beforeEach } from 'vitest';

import AdminReimbursementsSection from '../../../components/admin/AdminReimbursementsSection';

// ---------------------------------------------------------------------------
// SVG asset mocks
// ---------------------------------------------------------------------------

vi.mock('../../../assets/icons/money-tick.svg', () => ({ default: 'money-tick.svg' }));
vi.mock('../../../assets/icons/moneyIn.svg', () => ({ default: 'moneyIn.svg' }));
vi.mock('../../../assets/icons/moneytime.svg', () => ({ default: 'moneytime.svg' }));

// ---------------------------------------------------------------------------
// Ant Design icon mocks
// ---------------------------------------------------------------------------

vi.mock('@ant-design/icons', () => ({
    CloseCircleOutlined: () => <span data-testid="close-circle-icon" />,
    SearchOutlined: () => <span data-testid="search-outlined-icon" />,
}));

// ---------------------------------------------------------------------------
// GenericTable stub â€” exposes dataSource as testable rows
// ---------------------------------------------------------------------------

vi.mock('@components/atomic/GenericTable', () => ({
    default: ({ dataSource }: { dataSource: any[] }) => (
        <div data-testid="generic-table">
            {(dataSource ?? []).map((row: any) => (
                <div key={row.key} data-testid="table-row">
                    <span data-testid="row-member">{row.member}</span>
                    <span data-testid="row-merchant">{row.merchant}</span>
                    <span data-testid="row-amount">{String(row.amount)}</span>
                    <span data-testid="row-status">{row.status}</span>
                    <span data-testid="row-country">{row.country}</span>
                    <span data-testid="row-category">{row.category}</span>
                    <span data-testid="row-receipt">{row.receipt ? 'Attached' : 'Missing'}</span>
                </div>
            ))}
        </div>
    ),
}));

// ---------------------------------------------------------------------------
// Child component stubs
// ---------------------------------------------------------------------------

vi.mock('../../../components/common/StatCard', () => ({
    default: ({ stat }: { stat: any }) => (
        <div data-testid={`stat-card-${stat.key}`}>
            <span data-testid={`stat-label-${stat.key}`}>{stat.label}</span>
            <span data-testid={`stat-value-${stat.key}`}>{stat.value}</span>
        </div>
    ),
}));

vi.mock('../../../components/common/StatusTag', () => ({
    default: ({ status }: { status: string }) => <span data-testid="status-tag">{status}</span>,
}));

// ---------------------------------------------------------------------------
// Antd stubs â€” replace interactive UI components with testable HTML primitives
// ---------------------------------------------------------------------------

vi.mock('antd', () => ({
    Button: ({ onClick, children, icon, className }: any) => (
        <button type="button" onClick={onClick} className={className}>
            {icon}
            {children}
        </button>
    ),
    DatePicker: {
        RangePicker: ({ onChange }: any) => (
            <div data-testid="range-picker">
                <button
                    type="button"
                    data-testid="range-picker-clear"
                    onClick={() => onChange?.(null)}
                >
                    Clear Date
                </button>
            </div>
        ),
    },
    Flex: ({ children }: any) => <div>{children}</div>,
    Input: ({ onChange, value, placeholder, prefix }: any) => (
        <div>
            {prefix}
            <input
                data-testid="merchant-search"
                placeholder={placeholder}
                value={value ?? ''}
                onChange={onChange}
            />
        </div>
    ),
    Select: ({ onChange, placeholder, value, options }: any) => (
        <select
            data-testid={`select-${String(placeholder)}`}
            aria-label={placeholder}
            value={value ?? ''}
            onChange={e => onChange?.(e.target.value || undefined)}
        >
            <option value="">{placeholder ?? 'All'}</option>
            {(options ?? []).map((opt: any) => (
                <option key={opt.value} value={opt.value}>
                    {opt.label}
                </option>
            ))}
        </select>
    ),
    Typography: {
        Title: ({ children, level, className }: any) => {
            const Tag = `h${level ?? 1}` as any;
            return <Tag className={className}>{children}</Tag>;
        },
        Text: ({ children, className }: any) => <span className={className}>{children}</span>,
    },
}));

// ---------------------------------------------------------------------------
// Controlled reimbursements test data (mirrors the real shape)
// ---------------------------------------------------------------------------

vi.mock('../../../utils/reimbursementsData', () => {
    // Use recent dates so the component's default "last month" date filter doesn't hide rows
    const daysAgo = (n: number): string => {
        const d = new Date();
        d.setDate(d.getDate() - n);
        return d.toISOString().split('T')[0];
    };
    return {
        REIMBURSEMENTS: [
            {
                key: '1',
                date: daysAgo(5),
                merchant: 'Auto Rickshaw',
                description: 'Client meeting transport',
                category: 'Travel',
                receipt: true,
                status: 'Approved',
                amount: 2400,
            },
            {
                key: '2',
                date: daysAgo(10),
                merchant: 'Bombay Print Hub',
                description: 'Conference materials',
                category: 'Office',
                receipt: true,
                status: 'Rejected',
                amount: 790.5,
            },
            {
                key: '3',
                date: daysAgo(15),
                merchant: 'Bukhara',
                description: 'Client dinner',
                category: 'Meals',
                receipt: true,
                status: 'Approved',
                amount: 7240.5,
            },
            {
                key: '4',
                date: daysAgo(20),
                merchant: 'Parking Plaza',
                description: 'Off-site meeting parking',
                category: 'Entertainment',
                receipt: true,
                status: 'Pending',
                amount: 5240.5,
            },
            {
                key: '5',
                date: daysAgo(25),
                merchant: 'Gateway CafÃ©',
                description: 'Team brainstorming session',
                category: 'Supplies',
                receipt: true,
                status: 'Pending',
                amount: 3150.75,
            },
        ],
    };
});

// ---------------------------------------------------------------------------
// Helpers stub
// ---------------------------------------------------------------------------

vi.mock('../../../utils/helpers', () => ({
    formatRupeesDecimal: (v: number) => `â‚¹${Number(v).toFixed(2)}`,
    stripEmojis: (v: string) => v,
}));

// ---------------------------------------------------------------------------
// Expected member names (matches MEMBERS array in the component)
// ---------------------------------------------------------------------------

const EXPECTED_MEMBERS = ['Tony Stark', 'Bruce Wayne', 'Reed Richards', 'Lex Luthor', 'Tony Stark'];

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('AdminReimbursementsSection', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    // â”€â”€ Page structure â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

    describe('page structure', () => {
        it('renders the "Reimbursements" heading', () => {
            render(<AdminReimbursementsSection />);
            expect(screen.getByRole('heading', { name: /reimbursements/i })).toBeInTheDocument();
        });

        it('renders the subtitle explaining the approval flow', () => {
            render(<AdminReimbursementsSection />);
            expect(
                screen.getByText(/Reimbursement claims uploaded by members/i)
            ).toBeInTheDocument();
        });

        it('renders the generic table container', () => {
            render(<AdminReimbursementsSection />);
            expect(screen.getByTestId('generic-table')).toBeInTheDocument();
        });

        it('renders the merchant search input', () => {
            render(<AdminReimbursementsSection />);
            expect(screen.getByTestId('merchant-search')).toBeInTheDocument();
        });

        it('renders the country select filter', () => {
            render(<AdminReimbursementsSection />);
            expect(screen.getByTestId('select-Select Country')).toBeInTheDocument();
        });

        it('renders the cardholder select filter', () => {
            render(<AdminReimbursementsSection />);
            expect(screen.getByTestId('select-Select Cardholder')).toBeInTheDocument();
        });

        it('renders the date range picker', () => {
            render(<AdminReimbursementsSection />);
            expect(screen.getByTestId('range-picker')).toBeInTheDocument();
        });

        it('renders the Clear filter button', () => {
            render(<AdminReimbursementsSection />);
            expect(screen.getByText('Clear')).toBeInTheDocument();
        });
    });

    // â”€â”€ Stat cards â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

    describe('stat cards', () => {
        it('renders the pending-approval stat card', () => {
            render(<AdminReimbursementsSection />);
            expect(screen.getByTestId('stat-card-pending')).toBeInTheDocument();
        });

        it('renders the approved stat card', () => {
            render(<AdminReimbursementsSection />);
            expect(screen.getByTestId('stat-card-approved')).toBeInTheDocument();
        });

        it('renders the rejected stat card', () => {
            render(<AdminReimbursementsSection />);
            expect(screen.getByTestId('stat-card-rejected')).toBeInTheDocument();
        });

        it('displays correct labels on all three stat cards', () => {
            render(<AdminReimbursementsSection />);
            expect(screen.getByTestId('stat-label-pending')).toHaveTextContent('Pending approval');
            expect(screen.getByTestId('stat-label-approved')).toHaveTextContent('Approved');
            expect(screen.getByTestId('stat-label-rejected')).toHaveTextContent('Rejected');
        });

        it('displays correct hard-coded counts on all three stat cards', () => {
            render(<AdminReimbursementsSection />);
            expect(screen.getByTestId('stat-value-pending')).toHaveTextContent('3');
            expect(screen.getByTestId('stat-value-approved')).toHaveTextContent('2');
            expect(screen.getByTestId('stat-value-rejected')).toHaveTextContent('4');
        });
    });

    // â”€â”€ Default data rendering â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

    describe('default data rendering', () => {
        it('renders all 5 reimbursement rows when no filter is active', () => {
            render(<AdminReimbursementsSection />);
            expect(screen.getAllByTestId('table-row')).toHaveLength(5);
        });

        it('displays each merchant name in the table', () => {
            render(<AdminReimbursementsSection />);
            expect(screen.getByText('Auto Rickshaw')).toBeInTheDocument();
            expect(screen.getByText('Bombay Print Hub')).toBeInTheDocument();
            expect(screen.getByText('Bukhara')).toBeInTheDocument();
            expect(screen.getByText('Parking Plaza')).toBeInTheDocument();
            expect(screen.getByText('Gateway CafÃ©')).toBeInTheDocument();
        });

        it('assigns member names from the MEMBERS array in order', () => {
            render(<AdminReimbursementsSection />);
            const memberCells = screen.getAllByTestId('row-member');
            expect(memberCells.map(el => el.textContent)).toEqual(EXPECTED_MEMBERS);
        });

        it('shows all three statuses across the rows', () => {
            render(<AdminReimbursementsSection />);
            const statusCells = screen.getAllByTestId('row-status');
            const texts = statusCells.map(el => el.textContent);
            expect(texts).toContain('Approved');
            expect(texts).toContain('Rejected');
            expect(texts).toContain('Pending');
        });

        it('assigns "India" as the country for every row', () => {
            render(<AdminReimbursementsSection />);
            const countryCells = screen.getAllByTestId('row-country');
            countryCells.forEach(el => expect(el.textContent).toBe('India'));
        });

        it('shows the correct raw amount values for each row', () => {
            render(<AdminReimbursementsSection />);
            const amountCells = screen.getAllByTestId('row-amount');
            const amounts = amountCells.map(el => Number(el.textContent));
            expect(amounts).toContain(2400);
            expect(amounts).toContain(790.5);
            expect(amounts).toContain(7240.5);
            expect(amounts).toContain(5240.5);
            expect(amounts).toContain(3150.75);
        });

        it('shows "Attached" for rows with a receipt', () => {
            render(<AdminReimbursementsSection />);
            const receiptCells = screen.getAllByTestId('row-receipt');
            receiptCells.forEach(el => expect(el.textContent).toBe('Attached'));
        });
    });

    // â”€â”€ Merchant search filter â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

    describe('merchant search filter', () => {
        it('filters to a single row when the full merchant name is entered', () => {
            render(<AdminReimbursementsSection />);
            fireEvent.change(screen.getByTestId('merchant-search'), {
                target: { value: 'Bukhara' },
            });
            expect(screen.getAllByTestId('table-row')).toHaveLength(1);
            expect(screen.getByText('Bukhara')).toBeInTheDocument();
        });

        it('applies case-insensitive matching', () => {
            render(<AdminReimbursementsSection />);
            fireEvent.change(screen.getByTestId('merchant-search'), {
                target: { value: 'bukhara' },
            });
            expect(screen.getAllByTestId('table-row')).toHaveLength(1);
            expect(screen.getByText('Bukhara')).toBeInTheDocument();
        });

        it('shows no rows when the search term matches no merchant', () => {
            render(<AdminReimbursementsSection />);
            fireEvent.change(screen.getByTestId('merchant-search'), {
                target: { value: 'xyzNonExistentMerchant' },
            });
            expect(screen.queryAllByTestId('table-row')).toHaveLength(0);
        });

        it('filters using a partial merchant name', () => {
            render(<AdminReimbursementsSection />);
            fireEvent.change(screen.getByTestId('merchant-search'), {
                target: { value: 'parking' },
            });
            expect(screen.getAllByTestId('table-row')).toHaveLength(1);
            expect(screen.getByText('Parking Plaza')).toBeInTheDocument();
        });

        it('restores all rows when the search field is cleared manually', () => {
            render(<AdminReimbursementsSection />);
            const input = screen.getByTestId('merchant-search');
            fireEvent.change(input, { target: { value: 'Bukhara' } });
            expect(screen.getAllByTestId('table-row')).toHaveLength(1);

            fireEvent.change(input, { target: { value: '' } });
            expect(screen.getAllByTestId('table-row')).toHaveLength(5);
        });
    });

    // â”€â”€ Country filter â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

    describe('country filter', () => {
        it('shows all rows when no country is selected (empty value)', () => {
            render(<AdminReimbursementsSection />);
            expect(screen.getAllByTestId('table-row')).toHaveLength(5);
        });

        it('retains all rows when "India" is selected (every row has country=India)', () => {
            render(<AdminReimbursementsSection />);
            fireEvent.change(screen.getByTestId('select-Select Country'), {
                target: { value: 'India' },
            });
            expect(screen.getAllByTestId('table-row')).toHaveLength(5);
        });

        it('shows no rows when a non-matching country is selected', () => {
            render(<AdminReimbursementsSection />);
            fireEvent.change(screen.getByTestId('select-Select Country'), {
                target: { value: 'USA' },
            });
            expect(screen.queryAllByTestId('table-row')).toHaveLength(0);
        });

        it('shows no rows when "UK" is selected (no UK rows in data)', () => {
            render(<AdminReimbursementsSection />);
            fireEvent.change(screen.getByTestId('select-Select Country'), {
                target: { value: 'UK' },
            });
            expect(screen.queryAllByTestId('table-row')).toHaveLength(0);
        });
    });

    // â”€â”€ Clear filters button â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

    describe('clear filters button', () => {
        it('resets the merchant search and restores all rows', () => {
            render(<AdminReimbursementsSection />);
            fireEvent.change(screen.getByTestId('merchant-search'), {
                target: { value: 'Bukhara' },
            });
            expect(screen.getAllByTestId('table-row')).toHaveLength(1);

            fireEvent.click(screen.getByText('Clear'));
            expect(screen.getAllByTestId('table-row')).toHaveLength(5);
        });

        it('resets the country filter and restores all rows', () => {
            render(<AdminReimbursementsSection />);
            fireEvent.change(screen.getByTestId('select-Select Country'), {
                target: { value: 'USA' },
            });
            expect(screen.queryAllByTestId('table-row')).toHaveLength(0);

            fireEvent.click(screen.getByText('Clear'));
            expect(screen.getAllByTestId('table-row')).toHaveLength(5);
        });

        it('resets both merchant and country filters together', () => {
            render(<AdminReimbursementsSection />);
            fireEvent.change(screen.getByTestId('merchant-search'), {
                target: { value: 'Bukhara' },
            });
            fireEvent.change(screen.getByTestId('select-Select Country'), {
                target: { value: 'USA' },
            });
            expect(screen.queryAllByTestId('table-row')).toHaveLength(0);

            fireEvent.click(screen.getByText('Clear'));
            expect(screen.getAllByTestId('table-row')).toHaveLength(5);
        });
    });

    // â”€â”€ Combined merchant + country filtering â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

    describe('combined merchant and country filtering', () => {
        it('applies both filters simultaneously and returns the intersection', () => {
            render(<AdminReimbursementsSection />);
            fireEvent.change(screen.getByTestId('select-Select Country'), {
                target: { value: 'India' },
            });
            fireEvent.change(screen.getByTestId('merchant-search'), {
                target: { value: 'bukhara' },
            });

            expect(screen.getAllByTestId('table-row')).toHaveLength(1);
            expect(screen.getByText('Bukhara')).toBeInTheDocument();
        });

        it('returns an empty table when the merchant matches but the country does not', () => {
            render(<AdminReimbursementsSection />);
            fireEvent.change(screen.getByTestId('select-Select Country'), {
                target: { value: 'USA' },
            });
            fireEvent.change(screen.getByTestId('merchant-search'), {
                target: { value: 'Bukhara' },
            });

            expect(screen.queryAllByTestId('table-row')).toHaveLength(0);
        });

        it('returns an empty table when the country matches but the merchant does not', () => {
            render(<AdminReimbursementsSection />);
            fireEvent.change(screen.getByTestId('select-Select Country'), {
                target: { value: 'India' },
            });
            fireEvent.change(screen.getByTestId('merchant-search'), {
                target: { value: 'xyzNonExistentMerchant' },
            });

            expect(screen.queryAllByTestId('table-row')).toHaveLength(0);
        });
    });
});
