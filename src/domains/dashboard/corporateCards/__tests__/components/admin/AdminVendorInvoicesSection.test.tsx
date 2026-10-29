import React from 'react';

import { render, screen, fireEvent } from '@testing-library/react';
import { vi, describe, it, expect, beforeEach } from 'vitest';

import AdminVendorInvoicesSection from '../../../components/admin/AdminVendorInvoicesSection';

// ---------------------------------------------------------------------------
// Module mocks
// ---------------------------------------------------------------------------

vi.mock('@src/hooks/store', () => ({
    useAppSelector: vi.fn(),
    useAppDispatch: vi.fn(),
}));

// SVG assets imported at the component module level
vi.mock('../../../assets/icons/money-tick.svg', () => ({ default: 'money-tick.svg' }));
vi.mock('../../../assets/icons/moneyIn.svg', () => ({ default: 'moneyIn.svg' }));
vi.mock('../../../assets/icons/moneytime.svg', () => ({ default: 'moneytime.svg' }));

// Use recent dates so the component's default "last month" date filter doesn't hide rows
vi.mock('../../../utils/vendorInvoicesData', () => {
    const daysAgo = (n: number): string => {
        const d = new Date();
        d.setDate(d.getDate() - n);
        return d.toISOString().split('T')[0];
    };
    return {
        VENDOR_INVOICES: [
            {
                key: '1',
                date: daysAgo(5),
                invoice: 'INV-2024-1042',
                vendor: 'AZB & Partners',
                due: '2024-01-12',
                amount: 2400,
                status: 'Approved',
            },
            {
                key: '2',
                date: daysAgo(10),
                invoice: 'INV-2024-1042',
                vendor: 'BrightDesign Studio',
                due: '2024-02-03',
                amount: 790.5,
                status: 'Rejected',
            },
            {
                key: '3',
                date: daysAgo(15),
                invoice: 'INV-2024-1043',
                vendor: 'CrestWave Solutions',
                due: '2024-03-15',
                amount: 7240.5,
                status: 'Approved',
            },
            {
                key: '4',
                date: daysAgo(20),
                invoice: 'INV-2024-1044',
                vendor: 'NovaSphere Creative',
                due: '2024-04-27',
                amount: 5240.5,
                status: 'Pending',
            },
            {
                key: '5',
                date: daysAgo(25),
                invoice: 'INV-2024-1045',
                vendor: 'PixelForge Labs',
                due: '2024-05-09',
                amount: 3150.75,
                status: 'Pending',
            },
        ],
    };
});

// Stub formatRupeesDecimal so amount cells are predictable
vi.mock('../../../utils/helpers', () => ({
    formatRupeesDecimal: (v: number) => `₹${v.toFixed(2)}`,
    formatRupees: (v: number) => `₹${v}`,
    utilisationPercent: vi.fn(() => 0),
    getTabLabel: vi.fn(() => ''),
    getInitials: vi.fn(() => ''),
    stripEmojis: (v: string) => v,
}));

// GenericTable: render each dataSource row as a simple test node so filter
// logic can be verified without antd Table complexity
vi.mock('@components/atomic/GenericTable', () => ({
    default: ({ dataSource }: any) => (
        <div data-testid="generic-table">
            {(dataSource ?? []).map((row: any) => (
                <div key={row.key} data-testid="table-row">
                    <span data-testid="cell-invoice">{row.invoice}</span>
                    <span data-testid="cell-vendor">{row.vendor}</span>
                    <span data-testid="cell-country">{row.country}</span>
                    <span data-testid="cell-date">{row.date}</span>
                    <span data-testid="cell-due">{row.due}</span>
                    <span data-testid="cell-uploadedby">{row.uploadedBy}</span>
                    <span data-testid="cell-amount">{row.amount}</span>
                    <span data-testid="cell-status">{row.status}</span>
                </div>
            ))}
        </div>
    ),
}));

// StatCard: render key fields so label/value assertions work
vi.mock('../../../components/common/StatCard', () => ({
    default: ({ stat }: any) => (
        <div data-testid={`stat-card-${stat.key}`}>
            <span data-testid="stat-label">{stat.label}</span>
            <span data-testid="stat-value">{stat.value}</span>
        </div>
    ),
}));

// StatusTag: render status text directly
vi.mock('../../../components/common/StatusTag', () => ({
    default: ({ status }: any) => <span data-testid="status-tag">{status}</span>,
}));

// Partial antd mock — replace only the interactive filter components so that
// fireEvent works against plain HTML elements. Everything else (Button,
// Typography, Flex, Tag) uses the real antd implementation.
vi.mock('antd', async () => {
    const actual = await vi.importActual<typeof import('antd')>('antd');
    return {
        ...actual,
        DatePicker: {
            ...(actual.DatePicker as any),
            RangePicker: ({ onChange }: any) => (
                <input
                    data-testid="range-picker"
                    type="text"
                    readOnly
                    placeholder="Select date range"
                    // Expose a way to clear the range for reset tests
                    onClick={() => onChange && onChange(null)}
                />
            ),
        },
        Select: ({ placeholder, onChange, value, options }: any) => {
            const testId = `select-${(placeholder ?? 'select').replace(/\s+/g, '-').toLowerCase()}`;
            return (
                <select
                    data-testid={testId}
                    value={value ?? ''}
                    onChange={e => onChange && onChange(e.target.value || undefined)}
                >
                    <option value="">{placeholder}</option>
                    {(options ?? []).map((opt: any) => (
                        <option key={opt.value} value={opt.value}>
                            {opt.label}
                        </option>
                    ))}
                </select>
            );
        },
        Input: ({ placeholder, value, onChange }: any) => (
            <input
                data-testid="search-input"
                placeholder={placeholder}
                value={value ?? ''}
                onChange={onChange}
            />
        ),
    };
});

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('AdminVendorInvoicesSection', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    // -------------------------------------------------------------------------
    // Section header
    // -------------------------------------------------------------------------
    describe('section header', () => {
        it('renders the "Vendor Invoices" section title', () => {
            render(<AdminVendorInvoicesSection />);
            expect(screen.getByText('Vendor Invoices')).toBeInTheDocument();
        });

        it('renders the subtitle describing unpaid vendor invoices', () => {
            render(<AdminVendorInvoicesSection />);
            expect(
                screen.getByText(
                    'Unpaid vendor invoices uploaded by members. Approvals are handled in Approval Requests.'
                )
            ).toBeInTheDocument();
        });
    });

    // -------------------------------------------------------------------------
    // Stat cards
    // -------------------------------------------------------------------------
    describe('stat cards', () => {
        it('renders three stat cards (pending, approved, rejected)', () => {
            render(<AdminVendorInvoicesSection />);
            expect(screen.getByTestId('stat-card-pending')).toBeInTheDocument();
            expect(screen.getByTestId('stat-card-approved')).toBeInTheDocument();
            expect(screen.getByTestId('stat-card-rejected')).toBeInTheDocument();
        });

        it('stat cards display correct labels', () => {
            render(<AdminVendorInvoicesSection />);
            expect(screen.getByTestId('stat-card-pending')).toHaveTextContent('Pending approval');
            expect(screen.getByTestId('stat-card-approved')).toHaveTextContent('Approved');
            expect(screen.getByTestId('stat-card-rejected')).toHaveTextContent('Rejected');
        });

        it('stat cards display correct summary values', () => {
            render(<AdminVendorInvoicesSection />);
            const values = screen.getAllByTestId('stat-value').map(el => el.textContent);
            expect(values).toContain('3'); // pending count
            expect(values).toContain('2'); // approved count
            expect(values).toContain('4'); // rejected count
        });
    });

    // -------------------------------------------------------------------------
    // Vendor table — default render
    // -------------------------------------------------------------------------
    describe('vendor table', () => {
        it('renders the GenericTable', () => {
            render(<AdminVendorInvoicesSection />);
            expect(screen.getByTestId('generic-table')).toBeInTheDocument();
        });

        it('shows all 5 vendor rows by default', () => {
            render(<AdminVendorInvoicesSection />);
            expect(screen.getAllByTestId('table-row')).toHaveLength(5);
        });

        it('renders all vendor names', () => {
            render(<AdminVendorInvoicesSection />);
            expect(screen.getByText('AZB & Partners')).toBeInTheDocument();
            expect(screen.getByText('BrightDesign Studio')).toBeInTheDocument();
            expect(screen.getByText('CrestWave Solutions')).toBeInTheDocument();
            expect(screen.getByText('NovaSphere Creative')).toBeInTheDocument();
            expect(screen.getByText('PixelForge Labs')).toBeInTheDocument();
        });

        it('renders invoice numbers for each row', () => {
            render(<AdminVendorInvoicesSection />);
            const invoiceCells = screen.getAllByTestId('cell-invoice');
            expect(invoiceCells).toHaveLength(5);
            expect(invoiceCells[0]).toHaveTextContent('INV-2024-1042');
        });

        it('renders amount values for each row', () => {
            render(<AdminVendorInvoicesSection />);
            const amountCells = screen.getAllByTestId('cell-amount');
            expect(amountCells).toHaveLength(5);
            // First row: 2400
            expect(amountCells[0]).toHaveTextContent('2400');
        });

        it('renders status values including Approved, Rejected, and Pending', () => {
            render(<AdminVendorInvoicesSection />);
            const statusCells = screen.getAllByTestId('cell-status').map(el => el.textContent);
            expect(statusCells).toContain('Approved');
            expect(statusCells).toContain('Rejected');
            expect(statusCells).toContain('Pending');
        });

        it('renders country as India for every row', () => {
            render(<AdminVendorInvoicesSection />);
            const countryCells = screen.getAllByTestId('cell-country');
            countryCells.forEach(cell => {
                expect(cell).toHaveTextContent('India');
            });
        });

        it('renders uploaded-by members from the MEMBERS list', () => {
            render(<AdminVendorInvoicesSection />);
            const uploadedByCells = screen.getAllByTestId('cell-uploadedby');
            // First member in MEMBERS array is Tony Stark
            expect(uploadedByCells[0]).toHaveTextContent('Tony Stark');
        });

        it('renders due dates in each row', () => {
            render(<AdminVendorInvoicesSection />);
            const dueCells = screen.getAllByTestId('cell-due');
            expect(dueCells).toHaveLength(5);
            expect(dueCells[0]).toHaveTextContent('2024-01-12');
        });
    });

    // -------------------------------------------------------------------------
    // Filter bar — rendering
    // -------------------------------------------------------------------------
    describe('filter bar rendering', () => {
        it('renders the search input with placeholder "Search"', () => {
            render(<AdminVendorInvoicesSection />);
            expect(screen.getByPlaceholderText('Search')).toBeInTheDocument();
        });

        it('renders the country select dropdown', () => {
            render(<AdminVendorInvoicesSection />);
            expect(screen.getByTestId('select-select-country')).toBeInTheDocument();
        });

        it('renders the cardholder select dropdown', () => {
            render(<AdminVendorInvoicesSection />);
            expect(screen.getByTestId('select-select-cardholder')).toBeInTheDocument();
        });

        it('renders a date range picker', () => {
            render(<AdminVendorInvoicesSection />);
            expect(screen.getByTestId('range-picker')).toBeInTheDocument();
        });

        it('renders the Clear button', () => {
            render(<AdminVendorInvoicesSection />);
            expect(screen.getByRole('button', { name: /clear/i })).toBeInTheDocument();
        });

        it('renders the Date filter label', () => {
            render(<AdminVendorInvoicesSection />);
            expect(screen.getByText('Date')).toBeInTheDocument();
        });

        it('renders the Country filter label', () => {
            render(<AdminVendorInvoicesSection />);
            expect(screen.getByText('Country')).toBeInTheDocument();
        });

        it('renders the Merchant filter label', () => {
            render(<AdminVendorInvoicesSection />);
            expect(screen.getByText('Merchant')).toBeInTheDocument();
        });
    });

    // -------------------------------------------------------------------------
    // Vendor search filter
    // -------------------------------------------------------------------------
    describe('vendor search filter', () => {
        it('filters to one row when searching for a specific vendor', () => {
            render(<AdminVendorInvoicesSection />);
            fireEvent.change(screen.getByTestId('search-input'), {
                target: { value: 'AZB' },
            });
            expect(screen.getAllByTestId('table-row')).toHaveLength(1);
            expect(screen.getByText('AZB & Partners')).toBeInTheDocument();
        });

        it('search is case-insensitive', () => {
            render(<AdminVendorInvoicesSection />);
            fireEvent.change(screen.getByTestId('search-input'), {
                target: { value: 'brightdesign' },
            });
            expect(screen.getAllByTestId('table-row')).toHaveLength(1);
            expect(screen.getByText('BrightDesign Studio')).toBeInTheDocument();
        });

        it('shows empty table when search term matches no vendors', () => {
            render(<AdminVendorInvoicesSection />);
            fireEvent.change(screen.getByTestId('search-input'), {
                target: { value: 'NonExistentVendorXYZ' },
            });
            expect(screen.queryAllByTestId('table-row')).toHaveLength(0);
        });

        it('filters by partial vendor name', () => {
            render(<AdminVendorInvoicesSection />);
            fireEvent.change(screen.getByTestId('search-input'), {
                target: { value: 'Pixel' },
            });
            expect(screen.getAllByTestId('table-row')).toHaveLength(1);
            expect(screen.getByText('PixelForge Labs')).toBeInTheDocument();
        });

        it('shows all rows when search term is cleared', () => {
            render(<AdminVendorInvoicesSection />);
            const input = screen.getByTestId('search-input');
            fireEvent.change(input, { target: { value: 'AZB' } });
            expect(screen.getAllByTestId('table-row')).toHaveLength(1);

            fireEvent.change(input, { target: { value: '' } });
            expect(screen.getAllByTestId('table-row')).toHaveLength(5);
        });
    });

    // -------------------------------------------------------------------------
    // Country filter
    // -------------------------------------------------------------------------
    describe('country filter', () => {
        it('shows all 5 rows when no country is selected', () => {
            render(<AdminVendorInvoicesSection />);
            expect(screen.getAllByTestId('table-row')).toHaveLength(5);
        });

        it('keeps all rows when India is selected (all rows are India)', () => {
            render(<AdminVendorInvoicesSection />);
            fireEvent.change(screen.getByTestId('select-select-country'), {
                target: { value: 'India' },
            });
            expect(screen.getAllByTestId('table-row')).toHaveLength(5);
        });

        it('shows no rows when a country with no matching rows is selected', () => {
            render(<AdminVendorInvoicesSection />);
            fireEvent.change(screen.getByTestId('select-select-country'), {
                target: { value: 'USA' },
            });
            expect(screen.queryAllByTestId('table-row')).toHaveLength(0);
        });

        it('restores all rows when country selection is cleared', () => {
            render(<AdminVendorInvoicesSection />);
            const countrySelect = screen.getByTestId('select-select-country');
            fireEvent.change(countrySelect, { target: { value: 'USA' } });
            expect(screen.queryAllByTestId('table-row')).toHaveLength(0);

            // Selecting empty option clears the filter
            fireEvent.change(countrySelect, { target: { value: '' } });
            expect(screen.getAllByTestId('table-row')).toHaveLength(5);
        });
    });

    // -------------------------------------------------------------------------
    // Clear button
    // -------------------------------------------------------------------------
    describe('clear button', () => {
        it('resets the search filter when Clear is clicked', () => {
            render(<AdminVendorInvoicesSection />);
            fireEvent.change(screen.getByTestId('search-input'), {
                target: { value: 'AZB' },
            });
            expect(screen.getAllByTestId('table-row')).toHaveLength(1);

            fireEvent.click(screen.getByRole('button', { name: /clear/i }));
            expect(screen.getAllByTestId('table-row')).toHaveLength(5);
        });

        it('resets the country filter when Clear is clicked', () => {
            render(<AdminVendorInvoicesSection />);
            fireEvent.change(screen.getByTestId('select-select-country'), {
                target: { value: 'USA' },
            });
            expect(screen.queryAllByTestId('table-row')).toHaveLength(0);

            fireEvent.click(screen.getByRole('button', { name: /clear/i }));
            expect(screen.getAllByTestId('table-row')).toHaveLength(5);
        });

        it('resets both search and country filters simultaneously', () => {
            render(<AdminVendorInvoicesSection />);
            fireEvent.change(screen.getByTestId('search-input'), {
                target: { value: 'AZB' },
            });
            fireEvent.change(screen.getByTestId('select-select-country'), {
                target: { value: 'India' },
            });
            expect(screen.getAllByTestId('table-row')).toHaveLength(1);

            fireEvent.click(screen.getByRole('button', { name: /clear/i }));
            expect(screen.getAllByTestId('table-row')).toHaveLength(5);
        });
    });

    // -------------------------------------------------------------------------
    // Combined filters
    // -------------------------------------------------------------------------
    describe('combined filters', () => {
        it('applies search and matching country together (India + CrestWave)', () => {
            render(<AdminVendorInvoicesSection />);
            fireEvent.change(screen.getByTestId('search-input'), {
                target: { value: 'CrestWave' },
            });
            fireEvent.change(screen.getByTestId('select-select-country'), {
                target: { value: 'India' },
            });
            expect(screen.getAllByTestId('table-row')).toHaveLength(1);
            expect(screen.getByText('CrestWave Solutions')).toBeInTheDocument();
        });

        it('shows empty results when vendor matches but country does not', () => {
            render(<AdminVendorInvoicesSection />);
            fireEvent.change(screen.getByTestId('search-input'), {
                target: { value: 'AZB' },
            });
            fireEvent.change(screen.getByTestId('select-select-country'), {
                target: { value: 'USA' },
            });
            expect(screen.queryAllByTestId('table-row')).toHaveLength(0);
        });

        it('multiple vendor results are further narrowed by exact-match country', () => {
            render(<AdminVendorInvoicesSection />);
            // "a" matches several vendors; all rows have country=India
            fireEvent.change(screen.getByTestId('search-input'), {
                target: { value: 'a' },
            });
            const afterSearch = screen.getAllByTestId('table-row').length;
            expect(afterSearch).toBeGreaterThan(1);

            fireEvent.change(screen.getByTestId('select-select-country'), {
                target: { value: 'India' },
            });
            // All remaining rows are still for India, so count stays the same
            expect(screen.getAllByTestId('table-row')).toHaveLength(afterSearch);
        });
    });
});
