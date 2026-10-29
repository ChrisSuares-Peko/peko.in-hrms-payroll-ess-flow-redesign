export type DocSubmissionStatus =
    | 'pending'
    | 'due_soon'
    | 'under_review'
    | 'approved'
    | 'rejected'
    | 'reopened';

export interface DocHistoryEntry {
    status: DocSubmissionStatus;
    timestamp: string;
    remarks?: string;
    fileName?: string;
}

export interface ComplianceDocSubmission {
    submissionStatus: DocSubmissionStatus | null;
    rejectionReason?: string;
    lastUploadedFileName?: string;
    submittedDate?: string;
    history: DocHistoryEntry[];
}
