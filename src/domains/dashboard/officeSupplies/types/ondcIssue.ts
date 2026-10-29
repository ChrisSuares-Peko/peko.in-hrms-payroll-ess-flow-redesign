export type OndcIssueCategory = 'ITEM' | 'FULFILLMENT' | 'ORDER' | 'AGENT';

/** Internal issue-status vocabulary — the backend maps ONDC's raw IGM
 *  respondent/complainant actions onto these (see controllers/webhook/ondc.js
 *  mapRespondentAction), so the frontend only ever deals with this set. */
export type OndcIssueStatus =
    | 'OPEN'
    | 'ACKNOWLEDGED'
    | 'INFO_REQUESTED'
    | 'RESPONSE_RECEIVED'
    // IGM 2.0 resolution negotiation — none of these are terminal, because a
    // resolution can be proposed, rejected and re-proposed before anything is final.
    | 'RESOLUTION_PROPOSED'
    | 'RESOLUTION_ACCEPTED'
    | 'RESOLUTION_REJECTED'
    | 'RESOLVED'
    | 'REJECTED'
    | 'ESCALATED'
    | 'CLOSED';

/** ISSUE, or the escalated (grievance) level. IGM 2.0 only. */
export type OndcIssueLevel = 'ISSUE' | 'GRIEVANCE' | 'GREVIENCE' | string;

/** One key/value off a resolution's RESOLUTION_DETAILS tags, e.g. REFUND_AMOUNT. */
export interface OndcIssueResolutionDetail {
    code: string;
    value: string | null;
}

/**
 * A resolution the seller has proposed (IGM 2.0). The server drops the PARENT
 * grouping row and flattens the Beckn tag nesting, so what arrives here is the
 * set of options a buyer could actually be offered.
 */
export interface OndcIssueResolution {
    id: string | null;
    /** REFUND | REPLACEMENT | NO_ACTION | … */
    code: string;
    shortDesc: string | null;
    proposedBy: string | null;
    updatedAt: string | null;
    details: OndcIssueResolutionDetail[];
}

/** One event in an issue's thread. Returned newest-first by the API. */
export interface OndcIssueEvent {
    eventType: OndcIssueStatus | string;
    actorType: 'COMPLAINANT' | 'RESPONDENT' | 'SYSTEM';
    actorName: string;
    message: string;
    /** public image URLs (Firebase) attached to this event — [] when none */
    images?: string[];
    occurredAt: string;
}

/** One issue raised on a confirmed order (Figma 2807-25222). */
export interface OndcIssue {
    id: number;
    /** Peko-minted display code, e.g. "ISS-1005" — not the real ONDC network issue id */
    displayId: string;
    category: OndcIssueCategory | string;
    subCategory: string;
    status: OndcIssueStatus | string;
    /** IGM 2.0 issue.status — OPEN | PROCESSING | RESOLVED | CLOSED */
    wireStatus?: 'OPEN' | 'PROCESSING' | 'RESOLVED' | 'CLOSED' | string;
    /** server-computed one-line summary off the newest event — never fabricated client-side */
    latestUpdateSummary: string;
    /** IGM 2.0 complaint level — null on a 1.0 thread */
    level?: OndcIssueLevel | null;
    /** what the seller has proposed (IGM 2.0) — [] when nothing has been offered */
    resolutions?: OndcIssueResolution[];
    /** newest first */
    events: OndcIssueEvent[];
    /** IGM 2.0 descriptor.short_desc — e.g. "Issue with product quality" */
    shortDesc?: string | null;
    /** IGM 2.0 descriptor.long_desc when it differs from shortDesc */
    longDesc?: string | null;
    /** Prefer longDesc, else shortDesc, else the stored description column */
    description?: string | null;
}
