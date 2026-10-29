import React from 'react';

import { render, screen, fireEvent } from '@testing-library/react';
import dayjs from 'dayjs';
import { beforeEach, describe, expect, test, vi } from 'vitest';

import useScreenSize from '@src/hooks/useScreenSize';

import OrderHistory from '../../../components/OrderHistory/OrderHistory';

vi.mock('@src/hooks/store', () => ({
    useAppDispatch: () => vi.fn(),
    useAppSelector: vi.fn(() => ({
        reducer: {
            user: { username: 'testUser' },
        },
    })),
}));
// Mock custom hooks
vi.mock('@src/hooks/useDebounce', () => ({
    default: (value: string) => value,
}));

vi.mock('@src/hooks/useScreenSize', () => ({
    default: vi.fn(() => ({ xs: true })),
}));
vi.mock('../../../components/OrderHistory/HistoryTable', () => ({
    default: () => <div data-testid="history-table">HistoryTable</div>,
}));

vi.mock('../../../components/OrderHistory/HistoryTableMobile', () => ({
    default: () => <div data-testid="history-table-mobile">HistoryTableMobile</div>,
}));

describe('OrderHistory Component', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    test('renders mobile table when screen size is small', () => {
        render(<OrderHistory />);
        expect(screen.getByTestId('history-table-mobile')).toBeInTheDocument();
    });

    test('renders component correctly', () => {
        (useScreenSize as any).mockReturnValue({ xs: false });
        render(<OrderHistory />);
        expect(screen.getByText('Order History')).toBeInTheDocument();
        expect(screen.getByPlaceholderText('Search')).toBeInTheDocument();
        screen.debug(undefined, 200000);
        expect(screen.getByTestId('history-table')).toBeInTheDocument();
    });

    test('default date range is set correctly', () => {
        render(<OrderHistory />);

        const today = dayjs().format('YYYY-MM-DD');
        const oneMonthBefore = dayjs().subtract(1, 'month').format('YYYY-MM-DD');

        const datePickers = screen.getAllByRole('textbox');

        expect(datePickers[0]).toHaveValue(oneMonthBefore);
        expect(datePickers[1]).toHaveValue(today);
    });

    test('updates search input when typed', () => {
        render(<OrderHistory />);

        const searchInput = screen.getByPlaceholderText('Search');
        fireEvent.change(searchInput, { target: { value: 'test search' } });

        expect(searchInput).toHaveValue('test search');
    });

    test('updates date range when changed', () => {
        render(<OrderHistory />);

        const datePickers = screen.getAllByRole('textbox');

        const newFromDate = dayjs().subtract(2, 'months').format('YYYY-MM-DD');
        const newToDate = dayjs().subtract(15, 'days').format('YYYY-MM-DD');

        fireEvent.change(datePickers[0], { target: { value: newFromDate } });
        fireEvent.change(datePickers[1], { target: { value: newToDate } });

        expect(datePickers[0]).toHaveValue(newFromDate);
        expect(datePickers[1]).toHaveValue(newToDate);
    });
});
