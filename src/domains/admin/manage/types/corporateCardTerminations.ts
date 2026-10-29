// PENDING = "Requested" (termination requested, external/manual vendor-side closure not yet confirmed).
// APPROVED = "Completed" (the internal team has confirmed the vendor-side closure). There is no
// reject/reinstate path — the only transition is Requested -> Completed.
export type TerminationRequestStatus = 'PENDING' | 'APPROVED';

// A row from GET /termination-requests — cross-corporate queue for the internal team.
export interface TerminationRequestRow {
    id: number;
    corporateId: number;
    companyName: string | null;
    cardholder: string | null;
    holderId: number | null;
    cardIssuanceId: number | null;
    cardLast4: string | null;
    reason: string | null;
    requestedAt: string;
    status: TerminationRequestStatus;
}

export interface TerminationRequestsListPayload {
    status?: TerminationRequestStatus | '';
    page: number;
    itemsPerPage: number;
}

export interface TerminationRequestsListResponse {
    count: number;
    rows: TerminationRequestRow[];
}
