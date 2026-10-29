import { describe, expect, it } from 'vitest';

import { ApprovalRow } from '../types/approvals';
import {
    DEFAULT_PARTNER_LABEL,
    EVIDENCE_LABELS,
    approvalStatusPill,
    approvalsPath,
    approvalsQuery,
    blockedForApproval,
    decisionNoteError,
    describeBlocking,
    describeDecisionResult,
    eligiblePartners,
    emptyTextFor,
    evidenceItems,
    fixPath,
    groupRows,
    offlineWarning,
    parsePartnerId,
    parseStatusFilter,
    partnerLabel,
    switchedOnPill,
} from '../utils/approvals';

const row = (overrides: Partial<ApprovalRow>): ApprovalRow => ({
    partnerPermissionId: 1,
    partnerName: null,
    nodeKey: 'esim_tunz',
    accessKey: 'esim_tunz',
    label: 'eSIM',
    path: ['Corporate Travel', 'eSIM'],
    group: 'Corporate Travel',
    order: 0,
    switchedOn: true,
    status: 'PENDING',
    decidedById: null,
    decidedByName: null,
    decidedAt: null,
    note: null,
    readiness: { passed: 5, total: 5, blocking: [], warnings: [] },
    drift: null,
    evidence: null,
    ...overrides,
});

describe('labels and filters', () => {
    it('names the Default tree and reads the url filters with safe defaults', () => {
        expect(partnerLabel(null)).toBe(DEFAULT_PARTNER_LABEL);
        expect(partnerLabel({ partnerName: 'Gulf Reach' })).toBe('Gulf Reach');
        expect(parseStatusFilter('approved')).toBe('approved');
        expect(parseStatusFilter('nonsense')).toBe('awaiting');
        expect(parseStatusFilter(null)).toBe('awaiting');
        expect(parsePartnerId('12')).toBe(12);
        expect(parsePartnerId('0')).toBeNull();
        expect(parsePartnerId('abc')).toBeNull();
    });

    it('maps the three statuses and the switch onto pills', () => {
        expect(approvalStatusPill('PENDING')).toEqual({ label: 'Pending', tone: 'warning' });
        expect(approvalStatusPill('APPROVED')).toEqual({ label: 'Approved', tone: 'success' });
        expect(approvalStatusPill('REJECTED')).toEqual({ label: 'Rejected', tone: 'danger' });
        expect(switchedOnPill(true)).toEqual({ label: 'On', tone: 'success' });
        expect(switchedOnPill(false)).toEqual({ label: 'Off', tone: 'neutral' });
    });

    it('describes failing checks in finance words and shortens long lists', () => {
        expect(describeBlocking([])).toBe('');
        expect(describeBlocking(['commission'])).toBe('Commission');
        expect(describeBlocking(['vendor', 'journalFlag'])).toBe('Vendor and Journal recording');
        expect(describeBlocking(['vendor', 'commission', 'partnerShare', 'classification'])).toBe(
            'Vendor, Commission and 2 more'
        );
        expect(describeBlocking(['mystery'])).toBe('mystery');
    });

    it('builds the approvals link with the partner and any non-default status', () => {
        expect(approvalsQuery()).toBe('');
        expect(approvalsQuery(12)).toBe('?partner=12');
        expect(approvalsQuery(12, 'awaiting')).toBe('?partner=12');
        expect(approvalsQuery(null, 'approved')).toBe('?status=approved');
        expect(approvalsPath()).toBe('/system-user/accounting/approvals');
        expect(approvalsPath(12, 'rejected')).toBe(
            '/system-user/accounting/approvals?partner=12&status=rejected'
        );
        expect(approvalsPath(12, 'rejected', 'eSIM')).toBe(
            '/system-user/accounting/approvals?partner=12&status=rejected&search=eSIM'
        );
        expect(approvalsQuery(12, 'awaiting', 'Water Bill')).toBe('?partner=12&search=Water+Bill');
        expect(approvalsQuery(null, undefined, null)).toBe('');
    });

    it('sends every fix to the screen that owns it', () => {
        expect(
            fixPath({ screen: 'service_with_plans', accessKey: 'esim_tunz', tab: 'plans' })
        ).toBe('/system-user/accounting/service-with-plans/esim_tunz/plans');
        expect(fixPath({ screen: 'service_without_plans', accessKey: 'visa', tab: 'vendor' })).toBe(
            '/system-user/accounting/service-without-plans/visa/vendor'
        );
        expect(fixPath({ screen: 'service_without_plans' })).toBe(
            '/system-user/accounting/service-without-plans'
        );
        expect(
            fixPath({
                screen: 'service_with_plans',
                accessKey: 'esim_tunz',
                tab: 'platform-fee',
                partnerId: '77',
            })
        ).toBe('/system-user/accounting/service-with-plans/esim_tunz/platform-fee?partner=77');
        expect(
            fixPath({
                screen: 'service_without_plans',
                accessKey: 'visa',
                tab: 'cashbacks',
                partnerId: 'default',
            })
        ).toBe('/system-user/accounting/service-without-plans/visa/cashbacks?partner=default');
        expect(fixPath({ screen: 'chart_of_accounts' })).toBe(
            '/system-user/accounting/chart-of-accounts'
        );
        expect(fixPath({ screen: 'whitelabel_partners' })).toBe(
            '/system-user/accounting/whitelabel-partners'
        );
        expect(fixPath({ screen: 'peko_subscriptions' })).toBe(
            '/system-user/accounting/peko-subscriptions'
        );
    });

    it('never sends a fix out of the accounting portal, even for a screen an older server names', () => {
        ['cashback', 'service_operators', 'service_classification'].forEach(screen => {
            expect(fixPath({ screen } as any)).toBe('/system-user/accounting/approvals');
        });
    });

    it('explains an empty list for each filter and for a search', () => {
        expect(emptyTextFor('awaiting', '')).toBe(
            'Nothing is waiting for approval for this partner.'
        );
        expect(emptyTextFor('rejected', '')).toBe(
            'No services have been rejected for this partner.'
        );
        expect(emptyTextFor('all', '')).toBe('This partner’s menu lists no services.');
        expect(emptyTextFor('all', ' water ')).toBe(
            'No services match your search for this partner.'
        );
    });
});

describe('evidence and grouping', () => {
    it('turns the evidence into summary items with a dash for no date', () => {
        const items = evidenceItems({
            successOrders: 10,
            recorded: 8,
            failed: 1,
            skipped: 0,
            notRecorded: 1,
            internal: 2,
            lastOrderAt: '2026-09-20',
            lastRecordedAt: null,
        });

        expect(items.map(item => item.label)).toEqual(Object.values(EVIDENCE_LABELS));
        expect(items.map(item => item.value)).toEqual(['10', '8', '1', '0', '1', '—']);
        expect(items.find(item => item.label === 'Failed')?.tone).toBe('warning');
        expect(items.find(item => item.label === 'Not Recorded')?.tone).toBe('warning');
        expect(items.find(item => item.label === 'Skipped')?.tone).toBeUndefined();
    });

    it('groups rows as the menu does: ungrouped services first, then each group in tree order', () => {
        const groups = groupRows([
            row({ nodeKey: 'a', label: 'Electricity', group: 'Utility Payments', order: 2 }),
            row({ nodeKey: 'b', label: 'Corporate Cards', group: null, order: 0 }),
            row({ nodeKey: 'c', label: 'eSIM', group: 'Corporate Travel', order: 5 }),
            row({ nodeKey: 'd', label: 'Water', group: 'Utility Payments', order: 3 }),
            row({ nodeKey: 'e', label: 'Insurance', group: null, order: 4 }),
        ]);

        expect(groups.map(group => [group.group, group.rows.map(item => item.label)])).toEqual([
            [null, ['Corporate Cards', 'Insurance']],
            ['Utility Payments', ['Electricity', 'Water']],
            ['Corporate Travel', ['eSIM']],
        ]);
    });
});

describe('decisions', () => {
    const siblings = [
        row({ partnerPermissionId: 1, status: 'PENDING' }),
        row({ partnerPermissionId: 12, partnerName: 'Gulf Reach', status: 'APPROVED' }),
        row({
            partnerPermissionId: 13,
            partnerName: 'Drifted',
            status: 'APPROVED',
            drift: { changed: true, fields: [] },
        }),
        row({ partnerPermissionId: 14, partnerName: 'Refused', status: 'REJECTED' }),
        row({
            partnerPermissionId: 15,
            partnerName: 'Blocked',
            status: 'PENDING',
            readiness: { passed: 3, total: 5, blocking: ['vendor', 'commission'], warnings: [] },
        }),
    ];

    it('offers approval to every partner not yet approved or drifted, and rejection to every partner not yet rejected', () => {
        expect(
            eligiblePartners(siblings, 'APPROVED').map(item => item.partnerPermissionId)
        ).toEqual([1, 13, 14, 15]);
        expect(
            eligiblePartners(siblings, 'REJECTED').map(item => item.partnerPermissionId)
        ).toEqual([1, 12, 13, 15]);
        expect(blockedForApproval(siblings[4])).toBe(true);
        expect(blockedForApproval(siblings[0])).toBe(false);
    });

    it('requires a note to reject and caps its length', () => {
        expect(decisionNoteError('REJECTED', '  ')).toBe('A note is required to reject.');
        expect(decisionNoteError('REJECTED', 'wrong vendor')).toBeNull();
        expect(decisionNoteError('APPROVED', '')).toBeNull();
        expect(decisionNoteError('APPROVED', 'x'.repeat(501))).toBe(
            'Keep the note under 500 characters.'
        );
    });

    it('sums up a decision for the toast', () => {
        const nameOf = (id: number) => (id === 1 ? 'Peko (Default)' : 'Gulf Reach');

        expect(
            describeDecisionResult(
                {
                    results: [
                        { partnerPermissionId: 1, ok: true },
                        { partnerPermissionId: 12, ok: true },
                    ],
                    decided: 2,
                    skipped: 0,
                },
                'APPROVED',
                nameOf
            )
        ).toEqual({
            description: 'Approved for Peko (Default) and Gulf Reach',
            variant: 'success',
        });

        expect(
            describeDecisionResult(
                {
                    results: [
                        { partnerPermissionId: 1, ok: true },
                        { partnerPermissionId: 12, ok: false, code: 'BLOCKED' },
                    ],
                    decided: 1,
                    skipped: 1,
                },
                'APPROVED',
                nameOf
            )
        ).toEqual({
            description: 'Approved for 1 partner; not done for Gulf Reach',
            variant: 'warning',
        });

        expect(
            describeDecisionResult(
                {
                    results: [{ partnerPermissionId: 12, ok: false, code: 'STALE' }],
                    decided: 0,
                    skipped: 1,
                },
                'REJECTED',
                nameOf
            )
        ).toEqual({
            description: 'Nothing was rejected: Gulf Reach (changed by someone else, reload)',
            variant: 'error',
        });
    });

    it('spells out what a rejection does to a live service', () => {
        expect(offlineWarning('eSIM', ['Gulf Reach', 'Peko (Default)'])).toBe(
            'Rejecting takes eSIM offline for Gulf Reach and Peko (Default)’ corporates the moment you confirm. They will not see it again until it is approved.'
        );
    });
});
