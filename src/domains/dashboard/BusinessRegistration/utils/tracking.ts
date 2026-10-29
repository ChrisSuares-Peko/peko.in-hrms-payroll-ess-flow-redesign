// Tracking page data (Figma 1825:22936). All values derive from the live
// application status API — direct visits without an application redirect to
// My Applications instead of rendering placeholders.

import { ApplicationStatus } from '../api';

export type TrackingStatus = 'completed' | 'processing' | 'pending' | 'delayed';

// The vendor's next_followup can lapse (a follow-up date that has already
// passed). Only surface it when it's today or later — a past "next update" is
// misleading. Accepts DD-MM-YYYY or YYYY-MM-DD.
export const futureFollowup = (value?: string | null): string | undefined => {
    if (!value) return undefined;
    const parts = String(value).split(/[-/]/);
    if (parts.length !== 3) return undefined;
    const [y, m, d] = parts[0].length === 4 ? parts : [parts[2], parts[1], parts[0]];
    const date = new Date(Number(y), Number(m) - 1, Number(d));
    if (Number.isNaN(date.getTime())) return undefined;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return date >= today ? value : undefined;
};

export interface DocReuploadInfo {
    // Failed documents from the vendor's documents-stage result (may be empty when
    // the stage failed without per-document detail).
    failedDocs: Array<{ docType: string; reason?: string }>;
}

// A vendor-FAILED application blocked by a re-uploadable document — the only
// vendor failure the applicant can fix themselves (by replacing the file). Any
// other state (other stages, SENT/SENDING/NOT_SENT) returns null and is untouched.
export const docReuploadInfo = (status: ApplicationStatus): DocReuploadInfo | null => {
    if (status.vendorStatus !== 'FAILED') return null;
    const docStage = status.vendorStages?.documents;
    if (docStage?.status !== 'failed') return null;
    const failedDocs = (docStage.meta?.results ?? [])
        .filter(r => r.status === 'failed')
        .map(r => ({ docType: r.docType, reason: r.reason }));
    return { failedDocs };
};

// "directors_1_bankStatement" -> "Directors 1 Bank Statement" for display.
export const humanizeDocType = (docType: string): string =>
    docType
        .replace(/([a-z])([A-Z])/g, '$1 $2')
        .replace(/_/g, ' ')
        .replace(/\b\w/g, c => c.toUpperCase())
        .trim();

export interface TrackingStep {
    title: string;
    description: string;
    date?: string;
    status: TrackingStatus;
    note?: string;
    // Which side it's pending with (Government / RM / Client) — shown above the note.
    pendingWith?: string;
}

// Product copy (static by design — confirm with product if it should vary).
export const TRACKING_ESTIMATED = '7-10 business days';

export const formatTrackingDate = (value?: string) =>
    value
        ? new Date(value).toLocaleDateString('en-IN', { year: 'numeric', month: 'long', day: 'numeric' })
        : '';

// Derive the timeline from the live status: our persistence + the vendor
// create-chain (vendorStatus/vendorStages) + the vendor engagement.
export const buildTrackingSteps = (status: ApplicationStatus): TrackingStep[] => {
    const submittedOn = formatTrackingDate(status.submittedAt ?? status.createdAt);
    const { vendorStatus, engagement, srn } = status;

    const pendingWith = engagement?.pending_with || undefined;
    const microStatus = engagement?.micro_status || undefined;
    const lastNotes =
        engagement?.last_notes && engagement.last_notes !== 'Not Updated' ? engagement.last_notes : undefined;

    let filingStatus: TrackingStatus = 'pending';
    let filingNote: string | undefined;
    let filingPendingWith: string | undefined;
    if (vendorStatus === 'SENT') filingStatus = 'completed';
    else if (vendorStatus === 'SENDING') {
        filingStatus = 'processing';
        filingNote = 'Sending your application to our filing partner…';
    } else if (vendorStatus === 'FAILED') {
        // A filing hiccup is a delay, not a failure — surface which side it's
        // pending with (+ the specific reason) and the RM's latest note.
        filingStatus = 'delayed';
        // The vendor's pending_with often already reads "Pending with Government" —
        // strip any leading "Pending with" so we add the prefix exactly once, then
        // append the specific reason (micro_status).
        const side = pendingWith?.replace(/^pending\s+with\s+/i, '').trim();
        const pendingLabel = side ? `Pending with ${side}` : undefined;
        filingPendingWith = [pendingLabel, microStatus].filter(Boolean).join(' - ') || undefined;
        filingNote =
            lastNotes ||
            'Our team is working with the concerned authorities to resolve the issue and proceed with the filing.';
    }
    const filingDelayed = filingStatus === 'delayed';

    const engagementStarted = Boolean(engagement);

    return [
        {
            title: 'Application Submitted',
            description: 'Your application and documents were received.',
            date: submittedOn,
            status: 'completed',
        },
        {
            title: 'Filed with our filing partner',
            description: 'Application registered with IndiaFilings for processing.',
            status: filingStatus,
            note: filingNote,
            pendingWith: filingPendingWith,
        },
        {
            title: 'Processing started',
            description: (() => {
                // Prefer the RM's name; fall back to their role. 'Unassigned' means
                // the vendor hasn't allocated one yet.
                const rm = engagement?.rm && engagement.rm !== 'Unassigned' ? engagement.rm : engagement?.rm_role;
                const followup = futureFollowup(engagement?.next_followup);
                return rm
                    ? `Handled by ${rm}${followup ? ` • next update ${followup}` : ''}`
                    : 'A relationship manager takes your application through MCA filing.';
            })(),
            date: engagement?.date_started,
            // The engagement is created at PAYMENT time, before the final
            // submit — never show this step ahead of the filing step.
            status: (() => {
                if (!engagementStarted) return 'pending';
                return filingStatus === 'completed' ? 'completed' : 'processing';
            })(),
            note: (() => {
                const parts = [];
                if (engagement?.engagement_status) parts.push(`Status: ${engagement.engagement_status}`);
                // The RM note is shown on the filing step when it's delayed — don't repeat it here.
                if (!filingDelayed && lastNotes) parts.push(lastNotes);
                return parts.length ? parts.join(' • ') : undefined;
            })(),
        },
        {
            title: 'Certificate of Incorporation',
            description: 'COI, PAN and TAN issued.',
            status: srn ? 'completed' : 'pending',
        },
    ];
};
