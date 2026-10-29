import type { ComplianceStatus } from '../types';

export const complianceStatusLabel: Record<ComplianceStatus, string> = {
    pending: 'Pending',
    processing: 'Processing',
    completed: 'Completed',
};

export const complianceStatusColor: Record<ComplianceStatus, string> = {
    pending: 'warning',
    processing: 'processing',
    completed: 'success',
};
