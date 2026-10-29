import '@testing-library/jest-dom/vitest';

import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { Mock, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';

import { useAppSelector } from '@src/hooks/store';

import {
    decideApprovals,
    getApprovalGate,
    getApprovalPartners,
    getApprovalReview,
    getPartnerApprovals,
    updateApprovalGate,
} from '../api/approvals';
import { ADMIN_ONLY_TEXT } from '../components/approvals/ApprovalGateCard';
import { GATE_OFF_TITLE } from '../components/approvals/GateConfirmModal';
import { ApprovalGateProvider } from '../context/ApprovalGateContext';
import Approvals from '../pages/Approvals';
import { ApprovalPartner, ApprovalRow } from '../types/approvals';

const { dispatch } = vi.hoisted(() => ({ dispatch: vi.fn() }));

vi.mock('@src/hooks/store', () => ({ useAppSelector: vi.fn(), useAppDispatch: () => dispatch }));

vi.mock('../api/approvals', () => ({
    getApprovalPartners: vi.fn(),
    getPartnerApprovals: vi.fn(),
    getApprovalReview: vi.fn(),
    decideApprovals: vi.fn(),
    getApprovalGate: vi.fn(),
    updateApprovalGate: vi.fn(),
}));

const blob = (update: boolean) => [
    {
        serviceCategory: 'Accounting',
        hasAccess: true,
        services: [
            {
                category: 'Others',
                hasAccess: true,
                services: [
                    { service: 'Approvals', hasAccess: true, view: true, write: update, update },
                ],
            },
        ],
    },
];

const stateWith = ({ update = true, isAdmin = true } = {}) => ({
    reducer: {
        auth: { role: 'system_user', id: 7 },
        services: { services: { data: blob(update) }, isAdmin },
    },
});

const partner = (overrides: Partial<ApprovalPartner> = {}): ApprovalPartner => ({
    partnerPermissionId: 1,
    registeredBy: null,
    partnerName: null,
    treeStatus: true,
    counts: {
        services: 3,
        switchedOn: 2,
        awaiting: 1,
        approved: 17,
        rejected: 0,
        pending: 2,
        drifted: 1,
    },
    ...overrides,
});

const GULF = partner({
    partnerPermissionId: 12,
    registeredBy: '77',
    partnerName: 'Gulf Reach',
    counts: {
        services: 1,
        switchedOn: 1,
        awaiting: 2,
        approved: 5,
        rejected: 1,
        pending: 0,
        drifted: 0,
    },
});

const TOTALS = {
    services: 4,
    switchedOn: 3,
    awaiting: 3,
    approved: 22,
    rejected: 1,
    pending: 2,
    drifted: 1,
};

const gateOn = { enabled: true, reason: null, setById: null, setByName: null, setAt: null };

const row = (overrides: Partial<ApprovalRow>): ApprovalRow => ({
    partnerPermissionId: 1,
    partnerName: null,
    nodeKey: 'bbps_utility_water',
    accessKey: 'bbps_utility_water',
    label: 'Water Bill',
    path: ['Utility Payments', 'Water Bill'],
    group: 'Utility Payments',
    order: 2,
    switchedOn: true,
    status: 'PENDING',
    decidedById: null,
    decidedByName: null,
    decidedAt: null,
    note: null,
    readiness: { passed: 4, total: 5, blocking: ['commission'], warnings: [] },
    drift: null,
    evidence: {
        successOrders: 0,
        recorded: 0,
        failed: 0,
        skipped: 0,
        notRecorded: 0,
        internal: 0,
        lastOrderAt: null,
        lastRecordedAt: null,
    },
    ...overrides,
});

const ROWS: ApprovalRow[] = [
    row({
        nodeKey: 'insurance_desk',
        accessKey: 'insurance_desk',
        label: 'Insurance',
        path: ['Insurance'],
        group: null,
        order: 0,
        readiness: { passed: 0, total: 1, blocking: ['operator'], warnings: [] },
        evidence: null,
    }),
    row({
        nodeKey: 'bbps_utility_electricity',
        accessKey: 'bbps_utility_electricity',
        label: 'Electricity Bill',
        path: ['Utility Payments', 'Electricity Bill'],
        order: 1,
        status: 'APPROVED',
        decidedByName: 'Ibrahim',
        decidedAt: '2026-09-26T05:00:00.000Z',
        readiness: { passed: 5, total: 5, blocking: [], warnings: [] },
        drift: {
            changed: true,
            fields: [
                { field: 'providerCommission', label: 'Commission rate', before: 2.5, after: 0 },
            ],
        },
        evidence: {
            successOrders: 10,
            recorded: 8,
            failed: 1,
            skipped: 0,
            notRecorded: 1,
            internal: 0,
            lastOrderAt: '2026-09-20T00:00:00.000Z',
            lastRecordedAt: '2026-09-19T00:00:00.000Z',
        },
    }),
    row({
        nodeKey: 'bbps_utility_gas',
        accessKey: 'bbps_utility_gas',
        label: 'Gas Bill',
        path: ['Utility Payments', 'Gas Bill'],
        order: 3,
        readiness: { passed: 3, total: 3, blocking: [], warnings: [] },
        evidence: {
            successOrders: 2,
            recorded: 2,
            failed: 0,
            skipped: 0,
            notRecorded: 0,
            internal: 0,
            lastOrderAt: '2026-09-18T00:00:00.000Z',
            lastRecordedAt: '2026-09-18T00:00:00.000Z',
        },
    }),
    row({}),
];

const renderPage = (path = '/system-user/accounting/approvals') =>
    render(
        <MemoryRouter initialEntries={[path]}>
            <ApprovalGateProvider>
                <Approvals />
            </ApprovalGateProvider>
        </MemoryRouter>
    );

describe('Approvals', () => {
    beforeAll(() => {
        Object.defineProperty(window, 'innerWidth', {
            value: 1600,
            writable: true,
            configurable: true,
        });
    });

    const selectFrom = (state: ReturnType<typeof stateWith>) =>
        (useAppSelector as unknown as Mock).mockImplementation((selector: any) => selector(state));

    beforeEach(() => {
        vi.clearAllMocks();
        selectFrom(stateWith());
        (getApprovalGate as Mock).mockResolvedValue(gateOn);
        (getApprovalPartners as Mock).mockResolvedValue({
            partners: [partner(), GULF],
            totals: TOTALS,
            gate: gateOn,
        });
        (getPartnerApprovals as Mock).mockImplementation(({ partnerPermissionId }) =>
            Promise.resolve({
                partner: partnerPermissionId === 12 ? GULF : partner(),
                rows: partnerPermissionId === 12 ? [] : ROWS,
                gate: gateOn,
            })
        );
        (getApprovalReview as Mock).mockResolvedValue({
            row: ROWS[0],
            partner: partner(),
            checklist: [],
            evidence: null,
            history: [],
            siblings: [ROWS[0]],
        });
    });

    it('lists the Default partner’s services as its menu groups them, awaiting first', async () => {
        renderPage();

        expect(await screen.findByText('Electricity Bill')).toBeInTheDocument();
        expect(getPartnerApprovals).toHaveBeenCalledWith({
            userId: 7,
            userType: 'system_user',
            partnerPermissionId: 1,
            status: 'awaiting',
            searchText: '',
        });

        expect(screen.getByText('Services')).toBeInTheDocument();
        expect(screen.getByText('Utility Payments')).toBeInTheDocument();
        expect(screen.getByText('Insurance')).toBeInTheDocument();
        expect(screen.getByText('insurance_desk')).toBeInTheDocument();
        expect(screen.getByText('0/1 checks')).toBeInTheDocument();
        expect(screen.getByText('Service operator')).toBeInTheDocument();
        expect(screen.getByText('5/5 checks')).toBeInTheDocument();
        expect(screen.getByText('8 of 10 recorded')).toBeInTheDocument();
        expect(screen.getByText('Configuration changed since approval')).toBeInTheDocument();
        expect(screen.getByText('by Ibrahim · 26 Sep 2026')).toBeInTheDocument();
        expect(screen.getByText('4/5 checks')).toBeInTheDocument();
        expect(screen.getByText('Commission')).toBeInTheDocument();
        expect(screen.getByText('No orders yet')).toBeInTheDocument();

        expect(screen.getByText('17')).toBeInTheDocument();
        expect(
            screen.getByText('All partners: 3 awaiting · 22 approved · 1 rejected')
        ).toBeInTheDocument();
        expect(screen.getAllByText('Review', { selector: 'span' })).toHaveLength(4);
        expect(screen.getByText('Peko (Default) (1 awaiting)')).toBeInTheDocument();
    });

    it('reads the partner and the status from the url', async () => {
        renderPage('/system-user/accounting/approvals?partner=12&status=approved');

        await waitFor(() =>
            expect(getPartnerApprovals).toHaveBeenCalledWith(
                expect.objectContaining({ partnerPermissionId: 12, status: 'approved' })
            )
        );
        expect(
            await screen.findByText('No services have been approved for this partner yet.')
        ).toBeInTheDocument();
    });

    it('searches within the chosen partner', async () => {
        renderPage();
        await screen.findByText('Electricity Bill');

        fireEvent.change(screen.getByPlaceholderText('Search services'), {
            target: { value: 'water' },
        });

        await waitFor(() =>
            expect(getPartnerApprovals).toHaveBeenLastCalledWith(
                expect.objectContaining({ searchText: 'water' })
            )
        );
    });

    it('offers View rather than Review without the update permission', async () => {
        selectFrom(stateWith({ update: false }));

        renderPage();

        expect(await screen.findByText('Electricity Bill')).toBeInTheDocument();
        expect(screen.getAllByText('View', { selector: 'span' })).toHaveLength(4);
        expect(screen.queryByText('Review', { selector: 'span' })).not.toBeInTheDocument();
    });

    it('opens the review for a row', async () => {
        renderPage();
        await screen.findByText('Electricity Bill');

        fireEvent.click(screen.getAllByText('Review', { selector: 'span' })[0]);

        await waitFor(() =>
            expect(getApprovalReview).toHaveBeenCalledWith({
                userId: 7,
                userType: 'system_user',
                partnerPermissionId: 1,
                nodeKey: 'insurance_desk',
            })
        );
        expect(await screen.findByText('Insurance · Peko (Default)')).toBeInTheDocument();
    });

    it('lets an administrator switch the gate off after confirming, and toasts the change', async () => {
        (updateApprovalGate as Mock).mockResolvedValue({
            ...gateOn,
            enabled: false,
            setByName: 'Ibrahim',
        });
        renderPage();
        await screen.findByText('Electricity Bill');

        expect(screen.getByText('On — enforced')).toBeInTheDocument();
        fireEvent.click(screen.getByRole('switch', { name: 'Approval gate' }));
        expect(await screen.findByText(GATE_OFF_TITLE)).toBeInTheDocument();

        fireEvent.click(screen.getByText('Turn off', { selector: 'span' }));

        await waitFor(() =>
            expect(updateApprovalGate).toHaveBeenCalledWith({
                userId: 7,
                userType: 'system_user',
                enabled: false,
            })
        );
        expect(await screen.findByText('Off — dev mode')).toBeInTheDocument();
        expect(dispatch).toHaveBeenCalledWith(
            expect.objectContaining({
                payload: expect.objectContaining({
                    description: 'Approval gate turned off — dev mode',
                }),
            })
        );
    });

    it('keeps the switch away from anyone who is not an administrator', async () => {
        selectFrom(stateWith({ isAdmin: false }));

        renderPage();

        expect(await screen.findByText('Electricity Bill')).toBeInTheDocument();
        expect(screen.queryByRole('switch', { name: 'Approval gate' })).not.toBeInTheDocument();
        expect(screen.getByText(ADMIN_ONLY_TEXT)).toBeInTheDocument();
    });

    it('approves a ready service for the chosen partner from its row switch', async () => {
        (decideApprovals as Mock).mockResolvedValue({
            results: [{ partnerPermissionId: 1, ok: true, status: 'APPROVED' }],
            decided: 1,
            skipped: 0,
        });
        renderPage();
        await screen.findByText('Gas Bill');
        const before = (getPartnerApprovals as Mock).mock.calls.length;

        expect(screen.getByRole('switch', { name: 'Approve Insurance' })).toBeDisabled();
        expect(screen.getByRole('switch', { name: 'Approve Electricity Bill' })).toBeChecked();
        expect(screen.getByRole('switch', { name: 'Approve Gas Bill' })).not.toBeChecked();
        fireEvent.click(screen.getByRole('switch', { name: 'Approve Gas Bill' }));

        await waitFor(() =>
            expect(decideApprovals).toHaveBeenCalledWith(
                expect.objectContaining({
                    userId: 7,
                    userType: 'system_user',
                    nodeKey: 'bbps_utility_gas',
                    partnerPermissionIds: [1],
                    decision: 'APPROVED',
                })
            )
        );
        expect(dispatch).toHaveBeenCalledWith(
            expect.objectContaining({
                payload: expect.objectContaining({ description: 'Approved for Peko (Default)' }),
            })
        );
        await waitFor(() =>
            expect((getPartnerApprovals as Mock).mock.calls.length).toBeGreaterThan(before)
        );
    });

    it('rejects an approved service from its row switch only once a note is given', async () => {
        (decideApprovals as Mock).mockResolvedValue({
            results: [{ partnerPermissionId: 1, ok: true, status: 'REJECTED' }],
            decided: 1,
            skipped: 0,
        });
        renderPage();
        await screen.findByText('Electricity Bill');

        fireEvent.click(screen.getByRole('switch', { name: 'Approve Electricity Bill' }));

        expect(
            await screen.findByText('Reject Electricity Bill for Peko (Default)?')
        ).toBeInTheDocument();
        const reject = screen.getByRole('button', { name: 'Reject' });
        expect(reject).toBeDisabled();
        fireEvent.change(screen.getByPlaceholderText('Why this service is being rejected'), {
            target: { value: 'wrong vendor' },
        });
        expect(reject).toBeEnabled();
        fireEvent.click(reject);

        await waitFor(() =>
            expect(decideApprovals).toHaveBeenCalledWith(
                expect.objectContaining({
                    nodeKey: 'bbps_utility_electricity',
                    partnerPermissionIds: [1],
                    decision: 'REJECTED',
                    note: 'wrong vendor',
                })
            )
        );
        expect(dispatch).toHaveBeenCalledWith(
            expect.objectContaining({
                payload: expect.objectContaining({ description: 'Rejected for Peko (Default)' }),
            })
        );
    });

    it('shows no row switches without the update permission', async () => {
        selectFrom(stateWith({ update: false }));

        renderPage();

        expect(await screen.findByText('Electricity Bill')).toBeInTheDocument();
        expect(screen.queryByRole('switch', { name: /^Approve / })).not.toBeInTheDocument();
    });
});
