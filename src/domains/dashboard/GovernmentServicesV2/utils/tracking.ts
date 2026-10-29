// Trademark tracking page data — mirrors BusinessRegistration/utils/tracking.ts, but there's no internal retry-queue here:
// Smart Form submission is synchronous ("filed" = status COMPLETED), so everything after is read straight off the live Engagement API.

import { EngagementStatus, GovernmentServiceApplicationV2Item } from '../apis';

export type TrackingStatus = 'completed' | 'processing' | 'pending' | 'delayed';

export interface TrackingStep {
    title: string;
    description: string;
    date?: string;
    status: TrackingStatus;
    note?: string;
    // Which side it's pending with (Government / RM / Client) — shown above the note.
    pendingWith?: string;
}

export const formatTrackingDate = (value?: string | null) =>
    value
        ? new Date(value).toLocaleDateString('en-IN', {
              year: 'numeric',
              month: 'long',
              day: 'numeric',
          })
        : '';

type ApplicationSummary = Pick<
    GovernmentServiceApplicationV2Item,
    'status' | 'paymentStatus' | 'createdOn'
>;

export const buildTrademarkTrackingSteps = (
    application: ApplicationSummary,
    engagement: EngagementStatus | null
): TrackingStep[] => {
    const submittedOn = formatTrackingDate(application.createdOn);
    const paid = application.paymentStatus === 'COMPLETED';
    const filed = application.status === 'COMPLETED';

    const pendingWith = engagement?.pending_with || undefined;
    const microStatus =
        engagement?.micro_status && engagement.micro_status !== 'Not Updated'
            ? engagement.micro_status
            : undefined;
    const lastNotes =
        engagement?.last_notes && engagement.last_notes !== 'Not Updated'
            ? engagement.last_notes
            : undefined;

    // pending_with present = processing is stuck (same signal Business Registration's vendor chain calls FAILED).
    const statusLabel = engagement?.engagement_status
        ? `Status: ${engagement.engagement_status}`
        : undefined;

    let govStatus: TrackingStatus = 'pending';
    let govNote: string | undefined;
    let govPendingWith: string | undefined;
    if (filed && engagement) {
        if (pendingWith) {
            govStatus = 'delayed';
            const side = pendingWith.replace(/^pending\s+with\s+/i, '').trim();
            govPendingWith =
                [side ? `Pending with ${side}` : undefined, microStatus]
                    .filter(Boolean)
                    .join(' - ') || undefined;
            const reason =
                lastNotes ||
                'Our team is actively working with the concerned authorities to resolve the issue and proceed with the filing.';
            govNote = [statusLabel, reason].filter(Boolean).join(' • ');
        } else {
            govStatus = 'processing';
            govNote = [statusLabel, lastNotes].filter(Boolean).join(' • ') || undefined;
        }
    }

    const rmAssigned = engagement?.rm && engagement.rm !== 'Unassigned';

    return [
        {
            title: 'Application Submitted',
            description: 'Your payment for this service was received.',
            date: submittedOn,
            status: paid ? 'completed' : 'pending',
        },
        {
            title: 'Filed with our filing partner',
            description: filed
                ? 'Your Trademark filing was submitted to our filing partner.'
                : 'Complete the filing form (Applicant, Trademark and Logo details) to submit your application.',
            status: filed ? 'completed' : 'pending',
        },
        {
            title: 'Processing with Government',
            description: rmAssigned
                ? `Handled by ${engagement?.rm}`
                : 'The Trademark Registry reviews your application once it has been filed.',
            status: govStatus,
            note: govNote,
            pendingWith: govPendingWith,
        },
        {
            title: 'Trademark Registered',
            description: 'Registration certificate issued.',
            status: 'pending',
        },
    ];
};

// GST Registration tracking — same generic shape (PPOB smart form is synchronous like Trademark's,
// no internal retry-queue), GST-flavored copy per GST_Registration.pdf §D1 (ARN generated -> GSTIN
// + Certificate issued on approval).
export const buildGstTrackingSteps = (
    application: ApplicationSummary,
    engagement: EngagementStatus | null
): TrackingStep[] => {
    const submittedOn = formatTrackingDate(application.createdOn);
    const paid = application.paymentStatus === 'COMPLETED';
    const filed = application.status === 'COMPLETED';

    const pendingWith = engagement?.pending_with || undefined;
    const microStatus =
        engagement?.micro_status && engagement.micro_status !== 'Not Updated'
            ? engagement.micro_status
            : undefined;
    const lastNotes =
        engagement?.last_notes && engagement.last_notes !== 'Not Updated'
            ? engagement.last_notes
            : undefined;

    const statusLabel = engagement?.engagement_status
        ? `Status: ${engagement.engagement_status}`
        : undefined;

    let govStatus: TrackingStatus = 'pending';
    let govNote: string | undefined;
    let govPendingWith: string | undefined;
    if (filed && engagement) {
        if (pendingWith) {
            govStatus = 'delayed';
            const side = pendingWith.replace(/^pending\s+with\s+/i, '').trim();
            govPendingWith =
                [side ? `Pending with ${side}` : undefined, microStatus]
                    .filter(Boolean)
                    .join(' - ') || undefined;
            const reason =
                lastNotes ||
                'Our team is actively working with the concerned authorities to resolve the issue and proceed with the filing.';
            govNote = [statusLabel, reason].filter(Boolean).join(' • ');
        } else {
            govStatus = 'processing';
            govNote = [statusLabel, lastNotes].filter(Boolean).join(' • ') || undefined;
        }
    }

    const rmAssigned = engagement?.rm && engagement.rm !== 'Unassigned';

    return [
        {
            title: 'Application Submitted',
            description: 'Your payment for this service was received.',
            date: submittedOn,
            status: paid ? 'completed' : 'pending',
        },
        {
            title: 'Filed with our filing partner',
            description: filed
                ? 'Your GST Registration filing was submitted to our filing partner.'
                : 'Complete the filing form (Applicant, Address and GST Information) to submit your application.',
            status: filed ? 'completed' : 'pending',
        },
        {
            title: 'Processing with Government',
            description: rmAssigned
                ? `Handled by ${engagement?.rm}`
                : 'The GST Department reviews your application once it has been filed. An ARN is generated and updated here once available.',
            status: govStatus,
            note: govNote,
            pendingWith: govPendingWith,
        },
        {
            title: 'GSTIN Allotted',
            description: 'GST Registration Certificate with GSTIN issued.',
            status: 'pending',
        },
    ];
};

// GST Cancellation tracking — same generic shape as buildGstTrackingSteps, Cancellation-flavored
// copy (GST_Cancellation_Implementation_Plan.md §5.4). Government-response step copy here is
// intentionally generic ("application is processed") rather than ARN-specific — §3.6's OTP/EVC and
// §3.5's GSTIN-status-source items are still unconfirmed, so this doesn't assume a particular
// government response shape yet.
export const buildGstCancellationTrackingSteps = (
    application: ApplicationSummary,
    engagement: EngagementStatus | null
): TrackingStep[] => {
    const submittedOn = formatTrackingDate(application.createdOn);
    const paid = application.paymentStatus === 'COMPLETED';
    const filed = application.status === 'COMPLETED';

    const pendingWith = engagement?.pending_with || undefined;
    const microStatus =
        engagement?.micro_status && engagement.micro_status !== 'Not Updated'
            ? engagement.micro_status
            : undefined;
    const lastNotes =
        engagement?.last_notes && engagement.last_notes !== 'Not Updated'
            ? engagement.last_notes
            : undefined;

    const statusLabel = engagement?.engagement_status
        ? `Status: ${engagement.engagement_status}`
        : undefined;

    let govStatus: TrackingStatus = 'pending';
    let govNote: string | undefined;
    let govPendingWith: string | undefined;
    if (filed && engagement) {
        if (pendingWith) {
            govStatus = 'delayed';
            const side = pendingWith.replace(/^pending\s+with\s+/i, '').trim();
            govPendingWith =
                [side ? `Pending with ${side}` : undefined, microStatus]
                    .filter(Boolean)
                    .join(' - ') || undefined;
            const reason =
                lastNotes ||
                'Our team is actively working with the concerned authorities to resolve the issue and proceed with the filing.';
            govNote = [statusLabel, reason].filter(Boolean).join(' • ');
        } else {
            govStatus = 'processing';
            govNote = [statusLabel, lastNotes].filter(Boolean).join(' • ') || undefined;
        }
    }

    const rmAssigned = engagement?.rm && engagement.rm !== 'Unassigned';

    return [
        {
            title: 'Application Submitted',
            description: 'Your payment for this service was received.',
            date: submittedOn,
            status: paid ? 'completed' : 'pending',
        },
        {
            title: 'Filed with our filing partner',
            description: filed
                ? 'Your GST Cancellation request was submitted to our filing partner.'
                : 'Complete the cancellation form (Authorized Person and Reason) to submit your request.',
            status: filed ? 'completed' : 'pending',
        },
        {
            title: 'Processing with Government',
            description: rmAssigned
                ? `Handled by ${engagement?.rm}`
                : 'The GST Department reviews your cancellation request once it has been filed.',
            status: govStatus,
            note: govNote,
            pendingWith: govPendingWith,
        },
        {
            title: 'GSTIN Cancelled',
            description: 'GST Registration Cancellation Order issued.',
            status: 'pending',
        },
    ];
};
