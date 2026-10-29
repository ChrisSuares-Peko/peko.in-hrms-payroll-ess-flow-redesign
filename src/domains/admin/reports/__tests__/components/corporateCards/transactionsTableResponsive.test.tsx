import { render, act } from '@testing-library/react';
import { describe, it, expect, beforeEach } from 'vitest';

import GenericTable from '@components/atomic/GenericTable';

const PHONE_PRIMARY_COLUMN = 'displayId';
const PHONE_COLLAPSED_WIDTH = 480;
const PHONE_WIDTH = 393;
const LARGE_PHONE_WIDTH = 575;
const DESKTOP_WIDTH = 1440;

const desktopColumns = [
    { title: 'Date', dataIndex: 'createdAt', key: 'createdAt', width: 120 },
    { title: 'Transaction', dataIndex: 'displayId', key: 'displayId', width: 190 },
    { title: 'Corporate', dataIndex: 'corporateName', key: 'corporateName', width: 180 },
    { title: 'Cardholder', dataIndex: 'cardholderName', key: 'cardholderName', width: 170 },
    { title: 'Merchant', dataIndex: 'merchantName', key: 'merchantName', width: 190 },
    { title: 'Amount', dataIndex: 'transactionAmount', key: 'transactionAmount', width: 130 },
    { title: 'Status', dataIndex: 'status', key: 'status', width: 140 },
];

const phoneColumns = [
    desktopColumns.find(column => column.key === PHONE_PRIMARY_COLUMN)!,
    ...desktopColumns
        .filter(column => column.key !== PHONE_PRIMARY_COLUMN)
        .map(column => ({ ...column, width: PHONE_COLLAPSED_WIDTH })),
];

const rows = [
    {
        id: 1,
        createdAt: '2026-09-16',
        displayId: 'CC000087',
        corporateName: 'Acme Pvt Ltd',
        cardholderName: 'Aarav Sharma',
        merchantName: 'PinePerk Test',
        transactionAmount: 50,
        status: 'Completed',
    },
];

const renderAt = (width: number, columns: typeof desktopColumns) => {
    Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: width,
    });
    const result = render(
        <GenericTable
            rowKey={(record: { id: number }) => record.id}
            columns={columns}
            dataSource={rows}
            pagination={false}
        />
    );
    act(() => {
        window.dispatchEvent(new Event('resize'));
    });
    return result;
};

const headerLabels = (container: HTMLElement) =>
    [...container.querySelectorAll('thead th')].map(th => th.textContent?.trim()).filter(Boolean);

describe('Corporate card transactions — responsive columns', () => {
    beforeEach(() => {
        document.body.innerHTML = '';
    });

    it('keeps only the transaction column inline on a phone', () => {
        const { container } = renderAt(PHONE_WIDTH, phoneColumns);

        expect(headerLabels(container)).toEqual(['Transaction']);
    });

    it('still keeps only the transaction column on the widest phone', () => {
        const { container } = renderAt(LARGE_PHONE_WIDTH, phoneColumns);

        expect(headerLabels(container)).toEqual(['Transaction']);
    });

    it('offers every other column behind the row expander on a phone', () => {
        const { container } = renderAt(PHONE_WIDTH, phoneColumns);

        expect(container.querySelector('.ant-table-row-expand-icon')).toBeTruthy();
    });

    it('shows every column on a desktop', () => {
        const { container } = renderAt(DESKTOP_WIDTH, desktopColumns);

        expect(headerLabels(container)).toEqual([
            'Date',
            'Transaction',
            'Corporate',
            'Cardholder',
            'Merchant',
            'Amount',
            'Status',
        ]);
    });

    it('never sizes the table to a width the viewport cannot show', () => {
        const { container } = renderAt(PHONE_WIDTH, phoneColumns);
        const table = container.querySelector('.ant-table table') as HTMLElement | null;

        expect(table).toBeTruthy();
        expect(table?.style.minWidth).toBe('');
        expect(table?.style.width).not.toBe('1200px');
    });
});
