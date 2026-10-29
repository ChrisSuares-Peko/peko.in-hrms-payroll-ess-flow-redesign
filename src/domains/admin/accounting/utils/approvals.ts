import dayjs from 'dayjs';

import { paths } from '@src/routes/paths';
import { formatNumberWithLocalString } from '@utils/priceFormat';

import { PillMeta } from './commission';
import { joinNames, plural } from './text';
import { SummaryItem } from '../components/serviceDetail/SummaryStrip';
import {
    SERVICE_PARTNER_PARAM,
    accountingLeafPath,
    accountingServicePath,
} from '../config/servicePaths';
import {
    ApprovalDecision,
    ApprovalDecisionResult,
    ApprovalDecisionResultItem,
    ApprovalEvidence,
    ApprovalFix,
    ApprovalRow,
    ApprovalStatus,
    ApprovalStatusFilter,
} from '../types/approvals';

export const DEFAULT_PARTNER_LABEL = 'Peko (Default)';

export const partnerLabel = (partner: { partnerName: string | null } | null | undefined) =>
    partner?.partnerName || DEFAULT_PARTNER_LABEL;

export const APPROVAL_STATUS_FILTERS: ApprovalStatusFilter[] = [
    'awaiting',
    'pending',
    'approved',
    'rejected',
    'all',
];

export const parseStatusFilter = (value: string | null | undefined): ApprovalStatusFilter =>
    APPROVAL_STATUS_FILTERS.includes(value as ApprovalStatusFilter)
        ? (value as ApprovalStatusFilter)
        : 'awaiting';

export const parsePartnerId = (value: string | null | undefined): number | null => {
    const id = Number(value);
    return Number.isInteger(id) && id > 0 ? id : null;
};

const STATUS_PILLS: Record<ApprovalStatus, PillMeta> = {
    PENDING: { label: 'Pending', tone: 'warning' },
    APPROVED: { label: 'Approved', tone: 'success' },
    REJECTED: { label: 'Rejected', tone: 'danger' },
};

export const approvalStatusPill = (status: ApprovalStatus): PillMeta =>
    STATUS_PILLS[status] || STATUS_PILLS.PENDING;

export const switchedOnPill = (switchedOn: boolean): PillMeta =>
    switchedOn ? { label: 'On', tone: 'success' } : { label: 'Off', tone: 'neutral' };

export const CHECK_LABELS: Record<string, string> = {
    classification: 'Service type',
    operator: 'Service operator',
    vendor: 'Vendor',
    commission: 'Commission',
    journalFlag: 'Journal recording',
    partnerShare: 'Partner share',
    cashbackLink: 'Packages',
    platformFee: 'Platform fee',
    chartOfAccounts: 'Chart of accounts',
    journalRecording: 'Journal recording',
    evidence: 'Journal evidence',
};

export const describeBlocking = (blocking: string[]) => {
    const names = blocking.map(key => CHECK_LABELS[key] || key);
    if (!names.length) return '';
    if (names.length <= 2) return names.join(' and ');
    return `${names.slice(0, 2).join(', ')} and ${names.length - 2} more`;
};

export const approvalsQuery = (
    partnerPermissionId?: number | null,
    status?: ApprovalStatusFilter,
    search?: string | null
) => {
    const params = new URLSearchParams();
    if (partnerPermissionId) params.set('partner', String(partnerPermissionId));
    if (status && status !== 'awaiting') params.set('status', status);
    if (search) params.set('search', search);
    const query = params.toString();
    return query ? `?${query}` : '';
};

export const approvalsPath = (
    partnerPermissionId?: number | null,
    status?: ApprovalStatusFilter,
    search?: string | null
) =>
    `${accountingLeafPath(paths.accountingAdmin.approvals)}${approvalsQuery(partnerPermissionId, status, search)}`;

const withPartner = (path: string, partnerId?: string) =>
    partnerId ? `${path}?${SERVICE_PARTNER_PARAM}=${encodeURIComponent(partnerId)}` : path;

export const fixPath = (fix: ApprovalFix): string => {
    switch (fix.screen) {
        case 'service_without_plans':
            return fix.accessKey
                ? withPartner(
                      accountingServicePath('without_plans', fix.accessKey, fix.tab),
                      fix.partnerId
                  )
                : accountingLeafPath(paths.accountingAdmin.serviceWithoutPlans);
        case 'service_with_plans':
            return fix.accessKey
                ? withPartner(
                      accountingServicePath('with_plans', fix.accessKey, fix.tab),
                      fix.partnerId
                  )
                : accountingLeafPath(paths.accountingAdmin.serviceWithPlans);
        case 'chart_of_accounts':
            return accountingLeafPath(paths.accountingAdmin.chartOfAccounts);
        case 'whitelabel_partners':
            return accountingLeafPath(paths.accountingAdmin.whitelabelPartners);
        case 'peko_subscriptions':
            return accountingLeafPath(paths.accountingAdmin.pekoSubscriptions);
        default:
            return accountingLeafPath(paths.accountingAdmin.approvals);
    }
};

const EMPTY_TEXT: Record<ApprovalStatusFilter, string> = {
    awaiting: 'Nothing is waiting for approval for this partner.',
    pending: 'No services are pending for this partner.',
    approved: 'No services have been approved for this partner yet.',
    rejected: 'No services have been rejected for this partner.',
    all: 'This partner’s menu lists no services.',
};

export const emptyTextFor = (status: ApprovalStatusFilter, searchText: string) =>
    searchText.trim() ? 'No services match your search for this partner.' : EMPTY_TEXT[status];

export const EVIDENCE_LABELS = {
    successOrders: 'Successful Orders',
    recorded: 'Journals Recorded',
    failed: 'Failed',
    skipped: 'Skipped',
    notRecorded: 'Not Recorded',
    lastRecordedAt: 'Last Recorded',
} as const;

const count = (value: number) => formatNumberWithLocalString(value, 0, 0);

export const evidenceItems = (evidence: ApprovalEvidence): SummaryItem[] => [
    { label: EVIDENCE_LABELS.successOrders, value: count(evidence.successOrders) },
    { label: EVIDENCE_LABELS.recorded, value: count(evidence.recorded) },
    {
        label: EVIDENCE_LABELS.failed,
        value: count(evidence.failed),
        tone: evidence.failed ? 'warning' : 'default',
    },
    { label: EVIDENCE_LABELS.skipped, value: count(evidence.skipped) },
    {
        label: EVIDENCE_LABELS.notRecorded,
        value: count(evidence.notRecorded),
        tone: evidence.notRecorded ? 'warning' : 'default',
    },
    {
        label: EVIDENCE_LABELS.lastRecordedAt,
        value: evidence.lastRecordedAt ? dayjs(evidence.lastRecordedAt).format('DD MMM YYYY') : '—',
    },
];

export type RowGroup = { group: string | null; rows: ApprovalRow[] };

export const UNGROUPED_HEADING = 'Services';

export const groupRows = (rows: ApprovalRow[]): RowGroup[] => {
    const ordered = [...rows].sort((a, b) => a.order - b.order);
    const groups: RowGroup[] = [];
    const ungrouped = ordered.filter(row => !row.group);
    if (ungrouped.length) groups.push({ group: null, rows: ungrouped });
    ordered
        .filter(row => row.group)
        .forEach(row => {
            const current = groups.find(entry => entry.group === row.group);
            if (current) current.rows.push(row);
            else groups.push({ group: row.group, rows: [row] });
        });
    return groups;
};

export const blockedForApproval = (row: ApprovalRow) =>
    Boolean(row.readiness && row.readiness.blocking.length);

export const eligiblePartners = (siblings: ApprovalRow[], decision: ApprovalDecision) =>
    decision === 'APPROVED'
        ? siblings.filter(row => row.status !== 'APPROVED' || row.drift?.changed)
        : siblings.filter(row => row.status !== 'REJECTED');

export const NOTE_MAX = 500;

export const decisionNoteError = (decision: ApprovalDecision, note: string): string | null => {
    const trimmed = note.trim();
    if (decision === 'REJECTED' && !trimmed) return 'A note is required to reject.';
    if (trimmed.length > NOTE_MAX) return `Keep the note under ${NOTE_MAX} characters.`;
    return null;
};

const REFUSAL_REASONS: Record<string, string> = {
    BLOCKED: 'checks failing',
    STALE: 'changed by someone else, reload',
    UNCHANGED: 'already decided',
    NOT_FOUND: 'not in that partner’s menu',
};

export const refusalReason = (item: ApprovalDecisionResultItem) =>
    (item.code && REFUSAL_REASONS[item.code]) || 'refused';

export const describeDecisionResult = (
    result: ApprovalDecisionResult,
    decision: ApprovalDecision,
    nameOf: (partnerPermissionId: number) => string
): { description: string; variant: 'success' | 'warning' | 'error' } => {
    const verb = decision === 'APPROVED' ? 'Approved' : 'Rejected';
    const done = result.results
        .filter(item => item.ok)
        .map(item => nameOf(item.partnerPermissionId));
    const refused = result.results.filter(item => !item.ok);

    if (done.length && !refused.length) {
        return { description: `${verb} for ${joinNames(done)}`, variant: 'success' };
    }
    if (done.length) {
        return {
            description: `${verb} for ${done.length} ${plural(done.length, 'partner', 'partners')}; not done for ${joinNames(
                refused.map(item => nameOf(item.partnerPermissionId))
            )}`,
            variant: 'warning',
        };
    }
    return {
        description: `Nothing was ${verb.toLowerCase()}: ${refused
            .map(item => `${nameOf(item.partnerPermissionId)} (${refusalReason(item)})`)
            .join(', ')}`,
        variant: 'error',
    };
};

export const offlineWarning = (label: string, partners: string[]) =>
    `Rejecting takes ${label} offline for ${joinNames(partners)}’ corporates the moment you confirm. They will not see it again until it is approved.`;
