import '@testing-library/jest-dom/vitest';

import { fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import dayjs from 'dayjs';
import { saveAs } from 'file-saver';
import { Mock, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';

import { useAppSelector } from '@src/hooks/store';

import { downloadAuditTrail, getAuditTrail } from '../api/auditTrail';
import AuditTrail from '../pages/AuditTrail';
import { AuditEntry } from '../types/auditTrail';
import {
    CONFIG_TYPE_OPTIONS,
    describeChange,
    fieldLabel,
    formatChangeValue,
} from '../utils/auditTrail';

vi.mock('@src/hooks/store', () => ({
    useAppSelector: vi.fn(),
    useAppDispatch: () => vi.fn(),
}));

vi.mock('../api/auditTrail', () => ({ getAuditTrail: vi.fn(), downloadAuditTrail: vi.fn() }));

vi.mock('file-saver', () => ({ saveAs: vi.fn() }));

vi.mock('@src/domains/admin/users/hooks/usePartnersForCorporate', () => ({
    default: () => ({
        partnerData: [
            { value: 'default', label: 'Default' },
            { value: 12, label: 'Cent Saarthi' },
        ],
    }),
}));

vi.setConfig({ testTimeout: 20000 });

const STATE = { reducer: { auth: { role: 'system_user', id: 7 } } };

const entry = (overrides: Partial<AuditEntry> = {}): AuditEntry => ({
    id: 1,
    createdAt: '2026-10-07T10:30:00.000Z',
    actorId: 9,
    actorName: 'Asha Menon',
    source: 'ACCOUNTING_PORTAL',
    configType: 'PLATFORM_FEE',
    action: 'UPDATE',
    targetTable: 'cashbacks',
    targetId: 7,
    targetLabel: 'Peko Go › Basic',
    partnerName: 'Cent Saarthi',
    ipAddress: '203.0.113.7',
    changes: [
        { field: 'surcharge', from: 2, to: 5 },
        { field: 'isSurchargeConfigured', from: false, to: true },
    ],
    ...overrides,
});

const page = (entries: AuditEntry[], extra: Record<string, unknown> = {}) => ({
    entries,
    recordsTotal: entries.length,
    page: 1,
    itemsPerPage: 10,
    ...extra,
});

const realGetComputedStyle = window.getComputedStyle.bind(window);

beforeAll(() => {
    window.getComputedStyle = ((el: Element) =>
        realGetComputedStyle(el)) as typeof window.getComputedStyle;
    Object.defineProperty(window, 'innerWidth', { value: 1920, writable: true });
});

beforeEach(() => {
    vi.clearAllMocks();
    (downloadAuditTrail as Mock).mockResolvedValue(new Blob(['x']));
    (useAppSelector as unknown as Mock).mockImplementation((selector: any) => selector(STATE));
    (getAuditTrail as Mock).mockResolvedValue(
        page([
            entry(),
            entry({
                id: 2,
                actorName: 'Ravi Nair',
                source: 'ADMIN_PANEL',
                configType: 'WHITELABEL_SHARE',
                targetLabel: 'Cent Saarthi',
                partnerName: null,
                changes: [{ field: 'sharePercentage', from: 10, to: 12.5 }],
            }),
            entry({
                id: 3,
                actorName: null,
                partnerName: 'Peko (Default)',
                configType: 'CASHBACK',
                action: 'CREATE',
                changes: [{ field: 'cashback', from: null, to: 3 }],
            }),
        ])
    );
});

const comesAfter = (earlier: Element, later: Element) =>
    Math.floor(earlier.compareDocumentPosition(later) / Node.DOCUMENT_POSITION_FOLLOWING) % 2 === 1;

const lastCall = () => (getAuditTrail as Mock).mock.calls.at(-1)?.[0];

const pick = async (placeholder: string, option: string) => {
    fireEvent.mouseDown(screen.getByText(placeholder));
    fireEvent.click(await screen.findByTitle(option));
};

describe('Audit Trail page', () => {
    it('lists who changed what, where from, and the values before and after', async () => {
        render(<AuditTrail />);

        expect(await screen.findByText('Asha Menon')).toBeInTheDocument();
        expect(screen.getAllByText(/^\d{2} Oct 2026, \d{2}:\d{2} [AP]M$/).length).toBe(3);
        expect(screen.getAllByText('Peko Go › Basic').length).toBeGreaterThan(0);
        expect(screen.getByText('Platform fee: 2 → 5')).toBeInTheDocument();
        expect(screen.getByText('Platform fee marked configured: No → Yes')).toBeInTheDocument();
        expect(screen.getByText('Share %: 10 → 12.5')).toBeInTheDocument();
        expect(screen.getByText('Whitelabel share')).toBeInTheDocument();
        expect(screen.getAllByText('Accounting Portal').length).toBeGreaterThan(0);
        expect(screen.getByText('Admin Panel')).toBeInTheDocument();
    });

    it('shows the address a change was made from when the name is hovered, not as a column', async () => {
        render(<AuditTrail />);

        const who = (await screen.findAllByText('Asha Menon'))[0];
        expect(screen.queryByText('IP address')).not.toBeInTheDocument();
        fireEvent.mouseEnter(who);

        expect(await screen.findByText('IP address: 203.0.113.7')).toBeInTheDocument();
    });

    it('names the partner a setting belongs to, and shows a dash where none applies', async () => {
        render(<AuditTrail />);

        expect(await screen.findByText('Peko (Default)')).toBeInTheDocument();
        const partnerCells = screen.getAllByText('Cent Saarthi');
        expect(partnerCells).toHaveLength(2);
        const shareRow = screen.getByText('Share %: 10 → 12.5').closest('tr') as HTMLElement;
        expect(within(shareRow).getByText('—')).toBeInTheDocument();
    });

    it('shows a created row with the values it holds, and a missing person as a dash', async () => {
        render(<AuditTrail />);

        expect(await screen.findByText('Created')).toBeInTheDocument();
        const createdRow = screen.getByText('Cashback: 3').closest('tr') as HTMLElement;
        expect(within(createdRow).getByText('—')).toBeInTheDocument();
    });

    it('asks for the first page of the last month with no other filter', async () => {
        render(<AuditTrail />);

        await screen.findByText('Asha Menon');
        expect(lastCall()).toMatchObject({
            userId: 7,
            userType: 'system_user',
            page: 1,
            itemsPerPage: 10,
            searchText: '',
        });
        expect(lastCall().from).toBe(dayjs().subtract(1, 'month').format('YYYY-MM-DD'));
        expect(lastCall().to).toBe(dayjs().format('YYYY-MM-DD'));
        expect(lastCall().configType).toBeUndefined();
        expect(lastCall().source).toBeUndefined();
    });

    it('filters by where the change was made', async () => {
        render(<AuditTrail />);
        await screen.findByText('Asha Menon');

        await pick('All sources', 'Admin Panel');

        await waitFor(() => expect(lastCall().source).toBe('ADMIN_PANEL'));
    });

    it('filters by partner, with the default partner named the way the history names it', async () => {
        render(<AuditTrail />);
        await screen.findByText('Asha Menon');

        await pick('All partners', 'Cent Saarthi');
        await waitFor(() => expect(lastCall().partnerName).toBe('Cent Saarthi'));

        fireEvent.mouseDown(screen.getAllByText('Cent Saarthi')[0]);
        fireEvent.click(await screen.findByTitle('Peko (Default)'));
        await waitFor(() => expect(lastCall().partnerName).toBe('Peko (Default)'));
    });

    it('filters by the kind of configuration, and lists every kind', async () => {
        render(<AuditTrail />);
        await screen.findByText('Asha Menon');

        fireEvent.mouseDown(screen.getByText('All configurations'));
        await Promise.all(
            [
                'Service commission',
                'Service vendor',
                'Plan commission',
                'Plan price',
                'Platform fee',
                'Cashback',
                'Subscription pricing',
                'Subscription status',
                'Subscription add-on',
                'Whitelabel share',
            ].map(async label => expect(await screen.findByTitle(label)).toBeInTheDocument())
        );
        expect(CONFIG_TYPE_OPTIONS.map(option => option.label)).toEqual(
            expect.arrayContaining([
                'Whitelabel status',
                'Vendor ledger entry',
                'Partner ledger entry',
                'Gateway ledger entry',
            ])
        );
        fireEvent.click(screen.getByTitle('Plan commission'));

        await waitFor(() => expect(lastCall().configType).toBe('PLAN_COMMISSION'));
    });

    it.each([
        ['When', 'createdAt'],
        ['Who', 'actorName'],
        ['Configuration', 'configType'],
        ['Partner', 'partnerName'],
    ])('sorts by %s, lowest first and then highest first', async (title, sortField) => {
        render(<AuditTrail />);
        await screen.findByText('Asha Menon');

        fireEvent.click(screen.getByText(title));
        await waitFor(() => expect(lastCall()).toMatchObject({ sortField, sort: 'ASC' }));

        fireEvent.click(screen.getByText(title));
        await waitFor(() => expect(lastCall()).toMatchObject({ sortField, sort: 'DESC' }));
    });

    it('puts the date range beside the intro text and the export buttons first in the filter row', async () => {
        render(<AuditTrail />);
        await screen.findByText('Asha Menon');

        const intro = screen.getByText(/Every change to a commission/);
        const dates = screen.getByDisplayValue(dayjs().format('YYYY-MM-DD'));
        const exportButton = screen.getByRole('button', { name: /Export Excel/ });
        const configurations = screen.getByText('All configurations');

        expect(comesAfter(intro, dates)).toBe(true);
        expect(comesAfter(dates, exportButton)).toBe(true);
        expect(comesAfter(exportButton, configurations)).toBe(true);
    });

    it.each([
        ['Export Excel', 'excel', 'xlsx'],
        ['Download PDF', 'pdf', 'pdf'],
    ])(
        '%s downloads the rows on screen, with the filters on screen',
        async (button, format, extension) => {
            render(<AuditTrail />);
            await screen.findByText('Asha Menon');
            await pick('All partners', 'Cent Saarthi');
            await waitFor(() => expect(lastCall().partnerName).toBe('Cent Saarthi'));

            fireEvent.click(screen.getByRole('button', { name: new RegExp(button) }));

            const from = dayjs().subtract(1, 'month').format('YYYY-MM-DD');
            const to = dayjs().format('YYYY-MM-DD');
            await waitFor(() =>
                expect(downloadAuditTrail).toHaveBeenCalledWith(
                    expect.objectContaining({
                        userId: 7,
                        userType: 'system_user',
                        format,
                        partnerName: 'Cent Saarthi',
                        from,
                        to,
                    })
                )
            );
            await waitFor(() =>
                expect(saveAs).toHaveBeenCalledWith(
                    expect.any(Blob),
                    `Audit Trail ${from} to ${to}.${extension}`
                )
            );
        }
    );

    it('cannot export when nothing matches', async () => {
        (getAuditTrail as Mock).mockResolvedValue(page([]));
        render(<AuditTrail />);
        await screen.findByText('No configuration changes have been recorded in this period.');

        expect(screen.getByRole('button', { name: /Export Excel/ })).toBeDisabled();
        expect(screen.getByRole('button', { name: /Download PDF/ })).toBeDisabled();
    });

    it('opens a long list of changes a few at a time, then folds it back', async () => {
        (getAuditTrail as Mock).mockResolvedValue(
            page([
                entry({
                    configType: 'SERVICE_COMMISSION',
                    changes: [
                        { field: 'commissionMode', from: 'MARGIN', to: 'AGENT_MARKUP' },
                        { field: 'commissionType', from: 'PERCENTAGE', to: 'FLAT' },
                        { field: 'providerCommission', from: 0, to: 10 },
                        { field: 'fixedCommissionPerTransaction', from: 0, to: 2 },
                        { field: 'isCommissionInclGST', from: true, to: false },
                        { field: 'isCommissionConfigured', from: true, to: false },
                        { field: 'surchargeType', from: 'FLAT', to: 'PERCENTAGE' },
                        { field: 'surcharge', from: 2, to: 5 },
                        { field: 'cashback', from: 1, to: 2 },
                    ],
                }),
            ])
        );
        render(<AuditTrail />);

        expect(
            await screen.findByText('Commission mode: MARGIN → AGENT_MARKUP')
        ).toBeInTheDocument();
        expect(screen.getByText('Commission type: PERCENTAGE → FLAT')).toBeInTheDocument();
        expect(screen.queryByText('Commission: 0 → 10')).not.toBeInTheDocument();

        fireEvent.click(screen.getByRole('button', { name: 'Show more' }));
        expect(screen.getByText('GST included in commission: Yes → No')).toBeInTheDocument();
        expect(
            screen.queryByText('Commission marked configured: Yes → No')
        ).not.toBeInTheDocument();

        fireEvent.click(screen.getByRole('button', { name: 'Show more' }));
        expect(screen.getByText('Platform fee: 2 → 5')).toBeInTheDocument();
        expect(screen.queryByText('Cashback: 1 → 2')).not.toBeInTheDocument();

        fireEvent.click(screen.getByRole('button', { name: 'Show more' }));
        expect(screen.getByText('Cashback: 1 → 2')).toBeInTheDocument();
        expect(screen.queryByRole('button', { name: 'Show more' })).not.toBeInTheDocument();

        fireEvent.click(screen.getByRole('button', { name: 'Show less' }));
        expect(screen.queryByText('Commission: 0 → 10')).not.toBeInTheDocument();
        expect(screen.getByRole('button', { name: 'Show more' })).toBeInTheDocument();
    });

    it('shows up to three changes in full, with no link', async () => {
        (getAuditTrail as Mock).mockResolvedValue(
            page([
                entry({
                    changes: [
                        { field: 'surcharge', from: 2, to: 5 },
                        { field: 'surchargeType', from: 'FLAT', to: 'PERCENTAGE' },
                        { field: 'isSurchargeConfigured', from: false, to: true },
                    ],
                }),
            ])
        );
        render(<AuditTrail />);

        expect(
            await screen.findByText('Platform fee marked configured: No → Yes')
        ).toBeInTheDocument();
        expect(screen.queryByRole('button', { name: /Show/ })).not.toBeInTheDocument();
    });

    it('searches by person or service', async () => {
        render(<AuditTrail />);
        await screen.findByText('Asha Menon');

        fireEvent.change(screen.getByPlaceholderText('Search a person or a service'), {
            target: { value: 'ravi' },
        });

        await waitFor(() => expect(lastCall().searchText).toBe('ravi'));
        expect(lastCall().page).toBe(1);
    });

    it('says so when nothing has been recorded, and when a filter matches nothing', async () => {
        (getAuditTrail as Mock).mockResolvedValue(page([]));
        render(<AuditTrail />);

        expect(
            await screen.findByText('No configuration changes have been recorded in this period.')
        ).toBeInTheDocument();

        fireEvent.change(screen.getByPlaceholderText('Search a person or a service'), {
            target: { value: 'zzz' },
        });

        expect(
            await screen.findByText('No changes match your search or filter.')
        ).toBeInTheDocument();
    });

    it('goes to the next page', async () => {
        (getAuditTrail as Mock).mockResolvedValue(page([entry()], { recordsTotal: 25 }));
        render(<AuditTrail />);
        await screen.findByText('Asha Menon');

        fireEvent.click(screen.getByTitle('2'));

        await waitFor(() => expect(lastCall().page).toBe(2));
    });
});

describe('Audit Trail wording', () => {
    it('names a field the way the screens do, and shows one it does not know as it is', () => {
        expect(fieldLabel('providerCommission')).toBe('Commission');
        expect(fieldLabel('isCommissionInclGST')).toBe('GST included in commission');
        expect(fieldLabel('gatewayCharge')).toBe('Gateway charge');
        expect(fieldLabel('someNewField')).toBe('someNewField');
    });

    it('writes values the way a person reads them', () => {
        expect(formatChangeValue(null)).toBe('—');
        expect(formatChangeValue('')).toBe('—');
        expect(formatChangeValue(true)).toBe('Yes');
        expect(formatChangeValue(false)).toBe('No');
        expect(formatChangeValue(2.50004)).toBe('2.5');
        expect(formatChangeValue('FLAT')).toBe('FLAT');
        expect(formatChangeValue(['a', 'b'])).toBe('a, b');
        expect(formatChangeValue({ monthly: 100, annually: 1000 })).toBe(
            'monthly: 100, annually: 1000'
        );
        expect(formatChangeValue({ tiers: [{ a: 1 }] })).toBe('{"tiers":[{"a":1}]}');
    });

    it('shows an update as before and after, a creation and a deletion as the values held', () => {
        const change = { field: 'surcharge', from: 2, to: 5 };

        expect(describeChange(change)).toBe('Platform fee: 2 → 5');
        expect(describeChange(change, 'CREATE')).toBe('Platform fee: 5');
        expect(describeChange(change, 'DELETE')).toBe('Platform fee: 2');
    });

    it('shows the reason given for a ledger correction as it was typed, whatever the action', () => {
        const reason = { field: 'changeReason', from: null, to: 'Recorded twice' };

        expect(describeChange(reason)).toBe('Reason given: Recorded twice');
        expect(describeChange(reason, 'DELETE')).toBe('Reason given: Recorded twice');
        expect(describeChange({ field: 'againstOrder', from: null, to: 'TXN-9' })).toBe(
            'Against order: — → TXN-9'
        );
    });
});
