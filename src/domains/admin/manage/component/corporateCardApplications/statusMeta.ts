import { KybStatus } from '../../types/corporateCardApplications';
import { KybStepState } from '../../types/corporateDocuments';

// Single source of truth for KYB status display — colour/label for tags, plus the Select options.
export const KYB_STATUS_META: Record<KybStatus, { color: string; bg: string; label: string }> = {
    PENDING: { color: '#D97706', bg: '#FFFBEB', label: 'Pending' },
    SUBMITTED: { color: '#D97706', bg: '#FFFBEB', label: 'Submitted' },
    UNDER_REVIEW: { color: '#D97706', bg: '#FFFBEB', label: 'Under review' },
    VERIFIED: { color: '#3AB75E', bg: '#ECFDF3', label: 'Verified' },
    REJECTED: { color: '#DC2626', bg: '#FEF2F2', label: 'Rejected' },
    COMPLETED: { color: '#3AB75E', bg: '#ECFDF3', label: 'Completed' },
};

export const KYB_STATUS_OPTIONS: { label: string; value: KybStatus }[] = (
    Object.keys(KYB_STATUS_META) as KybStatus[]
).map(value => ({ value, label: KYB_STATUS_META[value].label }));

// Same palette as the status tags above, so the journey panel cannot drift from the rest of the screen.
export const KYB_STEP_META: Record<KybStepState, { color: string; bg: string; label: string }> = {
    done: { color: '#3AB75E', bg: '#ECFDF3', label: 'Completed' },
    in_progress: { color: '#D97706', bg: '#FFFBEB', label: 'In progress' },
    pending: { color: '#64748B', bg: '#F1F5F9', label: 'Pending' },
    not_applicable: { color: '#64748B', bg: '#F1F5F9', label: 'Not applicable' },
};
