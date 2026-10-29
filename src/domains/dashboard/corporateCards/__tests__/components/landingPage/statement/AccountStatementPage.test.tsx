import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, Mock } from 'vitest';

import AccountStatementPage from '../../../../components/landingPage/statement/AccountStatementPage';
import { useStatementApi } from '../../../../hooks/admin/useStatementApi';
import { StatementSummary } from '../../../../utils/types';

vi.mock('../../../../hooks/admin/useStatementApi', () => ({
    useStatementApi: vi.fn(),
}));

const SUMMARY: StatementSummary[] = [
    {
        key: 'opening',
        icon: 'wallet',
        label: 'Opening balance',
        value: '₹1,000.00',
        caption: 'Start of August 2026',
        tone: 'lilac',
    },
    {
        key: 'money-in',
        icon: 'in',
        label: 'Money in',
        value: '₹500.00',
        caption: 'Top-ups, refunds, cashback',
        tone: 'rose',
    },
    {
        key: 'money-out',
        icon: 'out',
        label: 'Money out',
        value: '₹300.00',
        caption: 'Card spend & fees',
        tone: 'mint',
    },
    {
        key: 'closing',
        icon: 'check',
        label: 'Closing balance',
        value: '₹1,200.00',
        caption: 'End of August 2026',
        tone: 'lavender',
    },
];

const TILE_CAPTIONS = SUMMARY.map(tile => tile.caption);

const mockHook = (overrides: Record<string, unknown> = {}) => {
    (useStatementApi as Mock).mockReturnValue({
        summary: SUMMARY,
        rows: [],
        count: 0,
        page: 1,
        setPage: vi.fn(),
        pageSize: 20,
        isLoading: false,
        month: '2026-09',
        setMonth: vi.fn(),
        monthLabel: 'September 2026',
        isCurrentMonth: true,
        exportStatement: vi.fn(),
        exporting: false,
        printStatement: vi.fn(),
        printing: false,
        ...overrides,
    });
};

describe('AccountStatementPage', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    describe('current month', () => {
        it('hides the balance summary tiles', () => {
            mockHook({ isCurrentMonth: true });
            render(<AccountStatementPage />);

            TILE_CAPTIONS.forEach(caption => expect(screen.queryByText(caption)).toBeNull());
            expect(screen.queryByText('₹1,200.00')).toBeNull();
        });

        it('titles the table as the current month transactions', () => {
            mockHook({ isCurrentMonth: true });
            render(<AccountStatementPage />);

            expect(
                screen.getByText('Current Month Transactions - September 2026')
            ).toBeInTheDocument();
        });
    });

    describe('past month', () => {
        it('shows the four balance summary tiles', () => {
            mockHook({ isCurrentMonth: false, monthLabel: 'August 2026', month: '2026-08' });
            render(<AccountStatementPage />);

            TILE_CAPTIONS.forEach(caption => expect(screen.getByText(caption)).toBeInTheDocument());
            expect(screen.getByText('₹1,200.00')).toBeInTheDocument();
        });

        it('titles the table as the statement for that month', () => {
            mockHook({ isCurrentMonth: false, monthLabel: 'August 2026', month: '2026-08' });
            render(<AccountStatementPage />);

            expect(screen.getByText('Statement - August 2026')).toBeInTheDocument();
            expect(screen.queryByText(/Current Month Transactions/)).toBeNull();
        });
    });
});
