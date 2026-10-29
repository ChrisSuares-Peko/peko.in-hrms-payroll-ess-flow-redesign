import '@testing-library/jest-dom/vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import getPaymentMethodColumns from '../../../component/columns/PaymentMethodColumns';
import { PaymentMethod } from '../../../types/paymentMethods';

const onStatusChange = vi.fn();
const onEdit = vi.fn();

const gatewayRow = (overrides: Partial<PaymentMethod> = {}): PaymentMethod => ({
    id: 1,
    partnerId: 1854,
    name: 'Mswipe BOS',
    paymentMethod: 'PAYMENT_GATEWAY',
    pgProvider: 'cashfree_pg',
    pgProviderName: 'Cashfree',
    isActive: true,
    hasOtherActiveGateway: false,
    createdAt: '2026-10-27T10:00:00.000Z',
    updatedAt: '2026-10-27T10:00:00.000Z',
    limits: { limitPerTransaction: 0, limitPerDay: 0, limitPerMonth: 0 },
    serviceList: [],
    ...overrides,
});

const noFilters = { partnerId: '', pgProvider: '', paymentMethod: '', isActive: '' } as const;

const getColumns = (
    options: {
        updatingId?: number | null;
        filters?: Parameters<typeof getPaymentMethodColumns>[0]['filters'];
    } = {}
) =>
    getPaymentMethodColumns({
        filters: options.filters ?? noFilters,
        partnerOptions: [
            { value: 'default', label: 'Default' },
            { value: 1854, label: 'Mswipe BOS' },
        ],
        gatewayOptions: [
            { value: 'cashfree_pg', label: 'Cashfree' },
            { value: 'ccavenue_pg', label: 'CC Avenue' },
        ],
        serviceNameById: new Map([
            [11, 'Mobile Prepaid'],
            [12, 'Electricity Bill'],
        ]),
        servicesLoading: false,
        updatingId: options.updatingId ?? null,
        onStatusChange,
        onEdit,
    });

const getColumn = (key: string, options?: Parameters<typeof getColumns>[0]) =>
    getColumns(options).find(col => col.key === key) as any;

const renderCell = (
    key: string,
    record: PaymentMethod,
    options?: Parameters<typeof getColumns>[0]
) => {
    const column = getColumn(key, options);
    return render(<>{column.render(record[column.dataIndex as keyof PaymentMethod], record)}</>);
};

describe('getPaymentMethodColumns filters', () => {
    it('filters the method column by wallet or a gateway', () => {
        const column = getColumn('paymentMethod');

        expect(column.filters).toEqual([
            { text: 'Wallet', value: 'WALLET' },
            { text: 'Corporate card', value: 'CORPORATE_CARD' },
            { text: 'Cashfree', value: 'cashfree_pg' },
            { text: 'CC Avenue', value: 'ccavenue_pg' },
        ]);
        expect(column.filterMultiple).toBe(false);
        expect(column.filteredValue).toBeNull();
    });

    it.each([
        [{ ...noFilters, pgProvider: 'ccavenue_pg' }, ['ccavenue_pg']],
        [{ ...noFilters, paymentMethod: 'WALLET' as const }, ['WALLET']],
        [{ ...noFilters, paymentMethod: 'CORPORATE_CARD' as const }, ['CORPORATE_CARD']],
    ])('marks the applied method filter', (filters, filteredValue) => {
        expect(getColumn('paymentMethod', { filters }).filteredValue).toEqual(filteredValue);
    });

    it('filters the partner column with a searchable list of partners', () => {
        const column = getColumn('name', { filters: { ...noFilters, partnerId: 1854 } });

        expect(column.filters).toEqual([
            { text: 'Default', value: 'default' },
            { text: 'Mswipe BOS', value: 1854 },
        ]);
        expect(column.filterSearch).toBe(true);
        expect(column.filterMultiple).toBe(false);
        expect(column.filteredValue).toEqual([1854]);
    });

    it('filters the status column by active or inactive', () => {
        const column = getColumn('isActive', { filters: { ...noFilters, isActive: 'false' } });

        expect(column.filters).toEqual([
            { text: 'Active', value: 'true' },
            { text: 'Inactive', value: 'false' },
        ]);
        expect(column.filteredValue).toEqual(['false']);
    });
});

describe('getPaymentMethodColumns cells', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it.each([
        ['a gateway by its name', gatewayRow(), 'Cashfree', 'Payment gateway'],
        [
            'a gateway that has none set',
            gatewayRow({ pgProvider: null, pgProviderName: null }),
            'Gateway not set',
            'Payment gateway',
        ],
        [
            'the wallet',
            gatewayRow({ paymentMethod: 'WALLET', pgProvider: null, pgProviderName: null }),
            'Wallet',
            'Wallet payments',
        ],
        [
            'the corporate card',
            gatewayRow({ paymentMethod: 'CORPORATE_CARD', pgProvider: null, pgProviderName: null }),
            'Corporate card',
            'Corporate card payments',
        ],
    ])('names %s', (_label, record, title, subtitle) => {
        renderCell('paymentMethod', record);

        expect(screen.getByText(title)).toBeInTheDocument();
        expect(screen.getByText(subtitle)).toBeInTheDocument();
    });

    it('names rows without a partner as Default', () => {
        renderCell('name', gatewayRow({ partnerId: null, name: null }));

        expect(screen.getByText('Default')).toBeInTheDocument();
    });

    it('flags a payment method that covers no services', () => {
        renderCell('serviceList', gatewayRow({ serviceList: [] }));

        expect(screen.getByText('No services')).toBeInTheDocument();
    });

    it('lists the covered services by name', async () => {
        renderCell('serviceList', gatewayRow({ serviceList: [12, 11, 99] }));

        fireEvent.click(screen.getByRole('button', { name: '3 services' }));

        expect(await screen.findByText('Electricity Bill')).toBeInTheDocument();
        expect(screen.getByText('Mobile Prepaid')).toBeInTheDocument();
        expect(screen.getByText('Service #99')).toBeInTheDocument();
    });

    it('shows a payment method without any limit as having no limits', () => {
        renderCell('limits', gatewayRow());

        expect(screen.getByText('No limits')).toBeInTheDocument();
    });

    it('shows each limit in rupees and an unset one as no limit', () => {
        renderCell(
            'limits',
            gatewayRow({
                limits: { limitPerTransaction: '25000', limitPerDay: 100000, limitPerMonth: 0 },
            })
        );

        expect(screen.getByText('₹ 25,000')).toBeInTheDocument();
        expect(screen.getByText('₹ 1,00,000')).toBeInTheDocument();
        expect(screen.getByText('No limit')).toBeInTheDocument();
    });

    it('treats missing limits as no limits', () => {
        renderCell('limits', gatewayRow({ limits: null }));

        expect(screen.getByText('No limits')).toBeInTheDocument();
    });

    it('labels the status and reports a toggle', () => {
        const record = gatewayRow();
        renderCell('isActive', record);

        expect(screen.getByText('Active')).toBeInTheDocument();
        fireEvent.click(screen.getByRole('switch', { name: 'Disable Cashfree for Mswipe BOS' }));

        expect(onStatusChange).toHaveBeenCalledWith(record, false);
    });

    it('locks every status switch while one is saving', () => {
        renderCell('isActive', gatewayRow({ isActive: false }), { updatingId: 7 });

        expect(screen.getByText('Inactive')).toBeInTheDocument();
        expect(
            screen.getByRole('switch', { name: 'Enable Cashfree for Mswipe BOS' })
        ).toBeDisabled();
    });

    it('opens the row for editing', () => {
        const record = gatewayRow();
        renderCell('actions', record);

        fireEvent.click(screen.getByRole('button', { name: 'Edit Cashfree for Mswipe BOS' }));

        expect(onEdit).toHaveBeenCalledWith(record);
    });
});
