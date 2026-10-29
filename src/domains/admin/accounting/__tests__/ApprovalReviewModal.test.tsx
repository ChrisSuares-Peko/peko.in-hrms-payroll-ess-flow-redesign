import '@testing-library/jest-dom/vitest';

import { fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { Mock, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';

import { useAppSelector } from '@src/hooks/store';

import { decideApprovals, getApprovalReview } from '../api/approvals';
import ApprovalReviewModal from '../components/approvals/ApprovalReviewModal';
import { ApprovalChecklistItem, ApprovalReview, ApprovalRow } from '../types/approvals';

vi.mock('@src/hooks/store', () => {
    const dispatch = vi.fn();
    return { useAppSelector: vi.fn(), useAppDispatch: () => dispatch };
});

vi.mock('../api/approvals', () => ({
    getApprovalReview: vi.fn(),
    decideApprovals: vi.fn(),
}));

const row = (overrides: Partial<ApprovalRow>): ApprovalRow => ({
    partnerPermissionId: 1,
    partnerName: null,
    nodeKey: 'bbps_utility_electricity',
    accessKey: 'bbps_utility_electricity',
    label: 'Electricity Bill',
    path: ['Utility Payments', 'Electricity Bill'],
    group: 'Utility Payments',
    order: 1,
    switchedOn: true,
    status: 'PENDING',
    decidedById: null,
    decidedByName: null,
    decidedAt: null,
    note: null,
    readiness: { passed: 4, total: 5, blocking: ['commission'], warnings: [] },
    drift: null,
    evidence: null,
    ...overrides,
});

const OK = { passed: 5, total: 5, blocking: [], warnings: [] };

const checklist: ApprovalChecklistItem[] = [
    {
        key: 'classification',
        label: 'Service type',
        required: true,
        status: 'pass',
        detail: 'Listed under Service without plans',
        fix: { screen: 'service_without_plans' },
    },
    {
        key: 'commission',
        label: 'Commission',
        required: true,
        status: 'fail',
        detail: 'No commission configured for this service',
        fix: {
            screen: 'service_without_plans',
            accessKey: 'bbps_utility_electricity',
            tab: 'commission',
        },
    },
    {
        key: 'evidence',
        label: 'Journal evidence',
        required: false,
        status: 'info',
        detail: 'No orders yet',
        fix: null,
    },
];

const EVIDENCE = {
    successOrders: 10,
    recorded: 8,
    failed: 1,
    skipped: 0,
    notRecorded: 1,
    internal: 1,
    lastOrderAt: '2026-09-20T00:00:00.000Z',
    lastRecordedAt: '2026-09-19T00:00:00.000Z',
    recentOrders: [
        {
            id: 9,
            corporateTxnId: 'TXN-9',
            status: 'SUCCESS',
            transactionDate: '2026-09-20T00:00:00.000Z',
            amountInINR: 1180,
            journalState: 'recorded' as const,
            internal: true,
        },
    ],
};

const review = (overrides: Partial<ApprovalReview> = {}): ApprovalReview => ({
    row: row({}),
    partner: {
        partnerPermissionId: 1,
        registeredBy: null,
        partnerName: null,
        treeStatus: true,
        counts: {
            services: 3,
            switchedOn: 2,
            awaiting: 1,
            approved: 1,
            rejected: 0,
            pending: 2,
            drifted: 0,
        },
    },
    checklist,
    evidence: EVIDENCE,
    history: [
        {
            id: 3,
            action: 'REJECTED',
            fromStatus: 'PENDING',
            actorName: 'Ibrahim',
            note: 'no share',
            createdAt: '2026-09-26T05:00:00.000Z',
        },
    ],
    siblings: [
        row({}),
        row({
            partnerPermissionId: 12,
            partnerName: 'Gulf Reach',
            status: 'APPROVED',
            readiness: OK,
            label: 'Electricity',
        }),
        row({
            partnerPermissionId: 13,
            partnerName: 'Alnoor',
            status: 'PENDING',
            readiness: { passed: 3, total: 5, blocking: ['vendor', 'commission'], warnings: [] },
        }),
    ],
    ...overrides,
});

const onClose = vi.fn();
const onDecided = vi.fn();

const renderModal = (canDecide = true) =>
    render(
        <MemoryRouter>
            <ApprovalReviewModal
                open
                target={{ partnerPermissionId: 1, nodeKey: 'bbps_utility_electricity' }}
                canDecide={canDecide}
                onClose={onClose}
                onDecided={onDecided}
            />
        </MemoryRouter>
    );

const button = (label: string) => screen.getByText(label, { selector: 'span' }).closest('button');

const realGetComputedStyle = window.getComputedStyle.bind(window);
beforeAll(() => {
    window.getComputedStyle = ((element: Element) =>
        realGetComputedStyle(element)) as typeof window.getComputedStyle;
});

describe('ApprovalReviewModal', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        (useAppSelector as unknown as Mock).mockImplementation((selector: any) =>
            selector({ reducer: { auth: { role: 'system_user', id: 7 } } })
        );
        (getApprovalReview as Mock).mockResolvedValue(review());
    });

    it('shows the checklist with a fix link, the evidence and the history', async () => {
        renderModal();

        expect(await screen.findByText('Electricity Bill · Peko (Default)')).toBeInTheDocument();
        expect(screen.getByText('1 of 2 required checks pass')).toBeInTheDocument();
        expect(screen.getByText('No commission configured for this service')).toBeInTheDocument();
        expect(screen.getByText('Fix').closest('a')).toHaveAttribute(
            'href',
            '/system-user/accounting/service-without-plans/bbps_utility_electricity/commission'
        );
        expect(screen.getByText('advisory')).toBeInTheDocument();
        expect(screen.getByText('Successful Orders')).toBeInTheDocument();
        expect(screen.getByText('TXN-9')).toBeInTheDocument();
        expect(screen.getByText('Recorded')).toBeInTheDocument();
        expect(screen.getByText('Internal')).toBeInTheDocument();
        expect(screen.getByText('by Ibrahim on 26 Sep 2026 — no share')).toBeInTheDocument();
    });

    it('says why a recent order was skipped, with the stored message on hover', async () => {
        (getApprovalReview as Mock).mockResolvedValue(
            review({
                evidence: {
                    ...EVIDENCE,
                    recentOrders: [
                        {
                            id: 8,
                            corporateTxnId: 'TXN-8',
                            status: 'SUCCESS',
                            transactionDate: '2026-09-19T00:00:00.000Z',
                            amountInINR: 59,
                            journalState: 'skipped' as const,
                            journalNote: 'Recording paused',
                            journalDetail: 'Journal recording is currently paused',
                            internal: false,
                        },
                    ],
                },
            })
        );
        renderModal();

        const orderRow = (await screen.findByText('TXN-8')).closest('tr') as HTMLElement;
        expect(within(orderRow).getByText('Skipped')).toBeInTheDocument();
        expect(within(orderRow).getByText('Recording paused')).toBeInTheDocument();

        fireEvent.mouseEnter(within(orderRow).getByText('Skipped'));
        expect(
            await screen.findByText('Journal recording is currently paused')
        ).toBeInTheDocument();
    });

    it('opens a package fix inside the portal for this partner and offers no fix where Settings owns the setting', async () => {
        (getApprovalReview as Mock).mockResolvedValue(
            review({
                checklist: [
                    {
                        key: 'classification',
                        label: 'Service type',
                        required: true,
                        status: 'fail',
                        detail: 'Not classified as Service with plans or Service without plans. Set the type in Settings › Service Classification.',
                        fix: null,
                    },
                    {
                        key: 'cashbackLink',
                        label: 'Packages',
                        required: false,
                        status: 'warn',
                        detail: 'No package of this partner includes this service yet, so its corporates cannot buy it',
                        fix: {
                            screen: 'service_without_plans',
                            accessKey: 'bbps_utility_electricity',
                            tab: 'cashbacks',
                            partnerId: 'default',
                        },
                    },
                ],
            })
        );
        renderModal();
        await screen.findByText('Electricity Bill · Peko (Default)');

        expect(
            screen.getByText(/Set the type in Settings › Service Classification/)
        ).toBeInTheDocument();
        const fixes = screen.getAllByText('Fix');
        expect(fixes).toHaveLength(1);
        expect(fixes[0].closest('a')).toHaveAttribute(
            'href',
            '/system-user/accounting/service-without-plans/bbps_utility_electricity/cashbacks?partner=default'
        );
    });

    it('keeps Approve disabled while a required check fails', async () => {
        renderModal();
        await screen.findByText('Electricity Bill · Peko (Default)');

        expect(button('Approve')).toBeDisabled();
        expect(button('Reject')).toBeEnabled();
    });

    it('rejects for several partners with one note and warns about the live one', async () => {
        (decideApprovals as Mock).mockResolvedValue({
            results: [
                { partnerPermissionId: 1, ok: true, status: 'REJECTED' },
                { partnerPermissionId: 12, ok: true, status: 'REJECTED' },
            ],
            decided: 2,
            skipped: 0,
        });
        renderModal();
        await screen.findByText('Electricity Bill · Peko (Default)');

        fireEvent.click(button('Reject') as HTMLElement);

        expect(screen.getByText('Reject for')).toBeInTheDocument();
        expect(button('Reject for 1 partner')).toBeDisabled();

        fireEvent.change(screen.getByPlaceholderText('Why this service is being rejected'), {
            target: { value: 'wrong vendor' },
        });
        expect(button('Reject for 1 partner')).toBeEnabled();

        fireEvent.click(screen.getByText('Gulf Reach · shown as “Electricity”'));
        expect(
            screen.getByText(/Rejecting takes Electricity Bill offline for Gulf Reach’ corporates/)
        ).toBeInTheDocument();

        fireEvent.click(button('Reject for 2 partners') as HTMLElement);

        await waitFor(() =>
            expect(decideApprovals).toHaveBeenCalledWith({
                userId: 7,
                userType: 'system_user',
                nodeKey: 'bbps_utility_electricity',
                partnerPermissionIds: [1, 12],
                decision: 'REJECTED',
                note: 'wrong vendor',
            })
        );
        expect(onDecided).toHaveBeenCalledTimes(1);
        expect(onClose).toHaveBeenCalledTimes(1);
    });

    it('approves only eligible partners and leaves blocked ones ticked off', async () => {
        (getApprovalReview as Mock).mockResolvedValue(
            review({
                row: row({ readiness: OK }),
                siblings: [
                    row({ readiness: OK }),
                    row({
                        partnerPermissionId: 12,
                        partnerName: 'Gulf Reach',
                        status: 'APPROVED',
                        readiness: OK,
                    }),
                    row({
                        partnerPermissionId: 13,
                        partnerName: 'Alnoor',
                        readiness: {
                            passed: 3,
                            total: 5,
                            blocking: ['vendor', 'commission'],
                            warnings: [],
                        },
                    }),
                ],
            })
        );
        (decideApprovals as Mock).mockResolvedValue({
            results: [{ partnerPermissionId: 1, ok: true, status: 'APPROVED' }],
            decided: 1,
            skipped: 0,
        });
        renderModal();
        await screen.findByText('Electricity Bill · Peko (Default)');

        fireEvent.click(button('Approve') as HTMLElement);

        expect(screen.getByText('Approve for')).toBeInTheDocument();
        expect(screen.queryByText('Gulf Reach')).not.toBeInTheDocument();
        expect(screen.getByText('2 checks failing: Vendor and Commission')).toBeInTheDocument();
        expect(screen.getByText('Alnoor').closest('label')?.querySelector('input')).toBeDisabled();

        fireEvent.click(button('Approve for 1 partner') as HTMLElement);

        await waitFor(() =>
            expect(decideApprovals).toHaveBeenCalledWith({
                userId: 7,
                userType: 'system_user',
                nodeKey: 'bbps_utility_electricity',
                partnerPermissionIds: [1],
                decision: 'APPROVED',
                note: undefined,
            })
        );
        expect(onClose).toHaveBeenCalledTimes(1);
    });

    it('stays open and names the refused partners after a partial result', async () => {
        (getApprovalReview as Mock).mockResolvedValue(
            review({
                row: row({ readiness: OK }),
                siblings: [
                    row({ readiness: OK }),
                    row({ partnerPermissionId: 13, partnerName: 'Alnoor', readiness: OK }),
                ],
            })
        );
        (decideApprovals as Mock).mockResolvedValue({
            results: [
                { partnerPermissionId: 1, ok: true, status: 'APPROVED' },
                {
                    partnerPermissionId: 13,
                    ok: false,
                    code: 'BLOCKED',
                    blocking: [{ key: 'vendor', label: 'Vendor', detail: 'x' }],
                },
            ],
            decided: 1,
            skipped: 1,
        });
        renderModal();
        await screen.findByText('Electricity Bill · Peko (Default)');

        fireEvent.click(button('Approve') as HTMLElement);
        fireEvent.click(screen.getByText('Alnoor'));
        fireEvent.click(button('Approve for 2 partners') as HTMLElement);

        expect(await screen.findByText('Refused for Alnoor: Vendor')).toBeInTheDocument();
        expect(onDecided).toHaveBeenCalledTimes(1);
        expect(onClose).not.toHaveBeenCalled();
    });

    it('shows no decision buttons to a viewer', async () => {
        renderModal(false);
        await screen.findByText('Electricity Bill · Peko (Default)');

        expect(screen.queryByText('Approve', { selector: 'span' })).not.toBeInTheDocument();
        expect(screen.queryByText('Reject', { selector: 'span' })).not.toBeInTheDocument();
        expect(screen.getByText('Close', { selector: 'span' })).toBeInTheDocument();
    });
});
