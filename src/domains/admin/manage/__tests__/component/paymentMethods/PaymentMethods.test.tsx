import '@testing-library/jest-dom/vitest';
import { act, fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { beforeEach, describe, expect, it, Mock, vi } from 'vitest';

import PaymentMethods from '../../../component/paymentMethods/PaymentMethods';
import useGetPaymentMethods from '../../../hooks/paymentMethods/useGetPaymentMethods';
import useGlobalPaymentSettings from '../../../hooks/paymentMethods/useGlobalPaymentSettings';
import useUpdatePaymentMethodStatus from '../../../hooks/paymentMethods/useUpdatePaymentMethodStatus';
import { PaymentMethod } from '../../../types/paymentMethods';

const tableProps = vi.hoisted(() => ({ current: {} as Record<string, any> }));
const settingsProps = vi.hoisted(() => ({ current: {} as Record<string, any> }));
const drawerProps = vi.hoisted(() => ({ current: null as Record<string, any> | null }));
const updateStatus = vi.fn();
const refetchRowsInPlace = vi.fn();
const reload = vi.fn();

vi.mock('../../../hooks/paymentMethods/useGetPaymentMethods', () => ({ default: vi.fn() }));
vi.mock('../../../hooks/paymentMethods/useGlobalPaymentSettings', () => ({ default: vi.fn() }));
vi.mock('../../../hooks/paymentMethods/useUpdatePaymentMethodStatus', () => ({
    default: vi.fn(),
}));
vi.mock('../../../hooks/paymentMethods/usePaymentMethodLookups', () => ({
    default: () => ({
        partnerOptions: [{ value: 'default', label: 'Default' }],
        partnersLoading: false,
        gatewayOptions: [{ value: 'cashfree_pg', label: 'Cashfree' }],
        gatewayLoading: false,
        serviceOptions: [],
        servicesLoading: false,
        serviceNameById: new Map(),
    }),
}));
vi.mock('../../../component/paymentMethods/GlobalPaymentSettings', () => ({
    default: (props: Record<string, any>) => {
        settingsProps.current = props;
        return null;
    },
}));
vi.mock('../../../component/paymentMethods/PaymentMethodsModal', () => ({
    default: (props: Record<string, any>) => {
        drawerProps.current = props;
        return <div data-testid="payment-method-drawer">{props.record?.id ?? 'new'}</div>;
    },
}));
vi.mock('../../../component/paymentMethods/DisableGatewayModal', () => ({
    default: ({ paymentMethod, onConfirm, onCancel }: any) =>
        paymentMethod ? (
            <div role="dialog" aria-label="Disable the last payment gateway?">
                <p>{paymentMethod.pgProviderName}</p>
                <button type="button" onClick={onConfirm}>
                    Disable gateway
                </button>
                <button type="button" onClick={onCancel}>
                    Cancel
                </button>
            </div>
        ) : null,
}));
vi.mock('@components/atomic/GenericTable', () => ({
    default: (props: any) => {
        tableProps.current = props;
        const { columns, dataSource, locale, onRow } = props;
        if (!dataSource.length) return <div data-testid="empty-state">{locale?.emptyText}</div>;
        return (
            <div>
                {dataSource.map((row: any) => (
                    <div key={row.id} data-testid={`row-${row.id}`} {...onRow?.(row)}>
                        {columns.map((col: any) => (
                            <div key={col.key} data-testid={`cell-${col.key}-${row.id}`}>
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

const row = (overrides: Partial<PaymentMethod>): PaymentMethod => ({
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

const rows = [
    row({ id: 1 }),
    row({
        id: 2,
        pgProvider: 'ccavenue_pg',
        pgProviderName: 'CC Avenue',
        hasOtherActiveGateway: true,
    }),
    row({ id: 3, paymentMethod: 'WALLET', pgProvider: null, pgProviderName: null }),
    row({ id: 4, isActive: false }),
];

const mockPaymentMethods = (tableData: PaymentMethod[]) =>
    (useGetPaymentMethods as Mock).mockReturnValue({
        globalSettings: null,
        tableData,
        count: tableData.length,
        isLoading: false,
        reload,
        refetchRowsInPlace,
    });

const globalSettings = {
    settings: {
        isGatewayPaymentAvailable: true,
        isWalletPaymentAvailable: true,
        isCouponApplicable: false,
    },
    isDirty: true,
    isSaving: false,
    toggleSetting: vi.fn(),
    discardChanges: vi.fn(),
    saveChanges: vi.fn(),
};

const toggleStatus = (id: number) =>
    fireEvent.click(within(screen.getByTestId(`cell-isActive-${id}`)).getByRole('switch'));

const warningModal = () =>
    screen.findByRole('dialog', { name: 'Disable the last payment gateway?' });
const queryWarningModal = () =>
    screen.queryByRole('dialog', { name: 'Disable the last payment gateway?' });

const lastFilters = () => (useGetPaymentMethods as Mock).mock.calls.at(-1)?.[0];

const filterTable = (tableFilters: Record<string, (string | number)[] | null>) =>
    act(() =>
        tableProps.current.onChange(
            {},
            { paymentMethod: null, name: null, isActive: null, ...tableFilters },
            {},
            { action: 'filter' }
        )
    );

beforeEach(() => {
    vi.clearAllMocks();
    drawerProps.current = null;
    updateStatus.mockResolvedValue(true);
    mockPaymentMethods(rows);
    (useGlobalPaymentSettings as Mock).mockReturnValue(globalSettings);
    (useUpdatePaymentMethodStatus as Mock).mockReturnValue({ updateStatus, updatingId: null });
});

describe('PaymentMethods status', () => {
    it("warns before disabling the partner's only active payment gateway", async () => {
        render(<PaymentMethods />);

        toggleStatus(1);

        expect(updateStatus).not.toHaveBeenCalled();
        expect(within(await warningModal()).getByText('Cashfree')).toBeInTheDocument();

        await act(async () => {
            fireEvent.click(screen.getByRole('button', { name: 'Disable gateway' }));
        });

        expect(updateStatus).toHaveBeenCalledWith(1, false);
        await waitFor(() => expect(queryWarningModal()).not.toBeInTheDocument());
    });

    it('keeps the payment gateway on when the warning is declined', async () => {
        render(<PaymentMethods />);

        toggleStatus(1);
        fireEvent.click(await screen.findByRole('button', { name: 'Cancel' }));

        expect(updateStatus).not.toHaveBeenCalled();
        expect(queryWarningModal()).not.toBeInTheDocument();
    });

    it('keeps the warning open when disabling fails', async () => {
        updateStatus.mockResolvedValue(false);
        render(<PaymentMethods />);

        toggleStatus(1);
        await act(async () => {
            fireEvent.click(await screen.findByRole('button', { name: 'Disable gateway' }));
        });

        expect(queryWarningModal()).toBeInTheDocument();
    });

    it.each([
        ['a gateway when the partner has another active one', 2],
        ['a wallet payment method', 3],
    ])('disables %s without a warning', (_label, id) => {
        render(<PaymentMethods />);

        toggleStatus(id);

        expect(updateStatus).toHaveBeenCalledWith(id, false);
        expect(queryWarningModal()).not.toBeInTheDocument();
    });

    it('enables a payment method without a warning', () => {
        render(<PaymentMethods />);

        toggleStatus(4);

        expect(updateStatus).toHaveBeenCalledWith(4, true);
        expect(queryWarningModal()).not.toBeInTheDocument();
    });

    it('refreshes the rows in place after a status change', () => {
        render(<PaymentMethods />);

        expect(useUpdatePaymentMethodStatus).toHaveBeenCalledWith({
            onUpdated: refetchRowsInPlace,
        });
    });
});

describe('PaymentMethods table filters', () => {
    it('lists the selected partner from the first page', () => {
        render(<PaymentMethods />);

        filterTable({ name: [1854] });

        expect(lastFilters()).toMatchObject({ partnerId: 1854, page: 1 });
    });

    it('lists the selected gateway', () => {
        render(<PaymentMethods />);

        filterTable({ paymentMethod: ['ccavenue_pg'] });

        expect(lastFilters()).toMatchObject({ pgProvider: 'ccavenue_pg', paymentMethod: '' });
    });

    it('lists only wallet payment methods', () => {
        render(<PaymentMethods />);

        filterTable({ paymentMethod: ['WALLET'] });

        expect(lastFilters()).toMatchObject({ paymentMethod: 'WALLET', pgProvider: '' });
    });

    it('lists only the selected status', () => {
        render(<PaymentMethods />);

        filterTable({ isActive: ['false'] });

        expect(lastFilters()).toMatchObject({ isActive: 'false', page: 1 });
    });

    it('keeps sorting with the shared sort handler', () => {
        render(<PaymentMethods />);

        act(() =>
            tableProps.current.onChange(
                {},
                {},
                { field: 'name', order: 'ascend' },
                { action: 'sort' }
            )
        );

        expect(lastFilters()).toMatchObject({ sortField: 'name', sort: 'ASC' });
    });

    it('clears every filter at once', () => {
        render(<PaymentMethods />);

        filterTable({ name: [1854], paymentMethod: ['cashfree_pg'], isActive: ['true'] });
        fireEvent.click(screen.getByRole('button', { name: 'Clear filters' }));

        expect(lastFilters()).toMatchObject({
            partnerId: '',
            pgProvider: '',
            paymentMethod: '',
            isActive: '',
            page: 1,
        });
        expect(screen.queryByRole('button', { name: 'Clear filters' })).not.toBeInTheDocument();
    });

    it('counts the payment methods listed', () => {
        render(<PaymentMethods />);

        expect(screen.getByText('4 payment methods')).toBeInTheDocument();
    });
});

describe('PaymentMethods add and edit', () => {
    it('opens an empty drawer to add a payment method', () => {
        render(<PaymentMethods />);

        fireEvent.click(screen.getByRole('button', { name: /Add payment method/ }));

        expect(screen.getByTestId('payment-method-drawer')).toHaveTextContent('new');
    });

    it('opens the drawer with the row to edit from its Edit button', () => {
        render(<PaymentMethods />);

        fireEvent.click(
            within(screen.getByTestId('row-1')).getByRole('button', {
                name: 'Edit Cashfree for Mswipe BOS',
            })
        );

        expect(screen.getByTestId('payment-method-drawer')).toHaveTextContent('1');
    });

    it('opens the drawer with the row that was clicked', () => {
        render(<PaymentMethods />);

        fireEvent.click(within(screen.getByTestId('row-3')).getByText('Wallet payments'));

        expect(screen.getByTestId('payment-method-drawer')).toHaveTextContent('3');
    });

    it('does not open the drawer when the status switch is clicked', () => {
        render(<PaymentMethods />);

        toggleStatus(2);

        expect(screen.queryByTestId('payment-method-drawer')).not.toBeInTheDocument();
    });

    it('closes the drawer and refreshes the rows in place once saved', () => {
        render(<PaymentMethods />);
        fireEvent.click(screen.getByRole('button', { name: /Add payment method/ }));

        act(() => drawerProps.current?.onSaved());

        expect(screen.queryByTestId('payment-method-drawer')).not.toBeInTheDocument();
        expect(refetchRowsInPlace).toHaveBeenCalled();
    });
});

describe('PaymentMethods global settings', () => {
    it('hands the settings and a retry to the settings card', () => {
        render(<PaymentMethods />);

        expect(settingsProps.current).toMatchObject({
            settings: globalSettings.settings,
            isDirty: true,
            onToggle: globalSettings.toggleSetting,
            onSave: globalSettings.saveChanges,
            onDiscard: globalSettings.discardChanges,
            onRetry: reload,
        });
    });
});

describe('PaymentMethods empty state', () => {
    beforeEach(() => {
        mockPaymentMethods([]);
    });

    it('offers to add the first payment method', () => {
        render(<PaymentMethods />);

        const emptyState = screen.getByTestId('empty-state');
        expect(within(emptyState).getByText('No payment methods yet.')).toBeInTheDocument();
        fireEvent.click(within(emptyState).getByRole('button', { name: /Add payment method/ }));
        expect(screen.getByTestId('payment-method-drawer')).toBeInTheDocument();
    });

    it('offers to clear filters that match nothing', () => {
        render(<PaymentMethods />);

        filterTable({ paymentMethod: ['ccavenue_pg'] });

        const emptyState = screen.getByTestId('empty-state');
        expect(
            within(emptyState).getByText('No payment methods match these filters.')
        ).toBeInTheDocument();
        fireEvent.click(within(emptyState).getByRole('button', { name: 'Clear filters' }));
        expect(lastFilters()).toMatchObject({ pgProvider: '' });
    });
});
