import { describe, expect, it } from 'vitest';

import { EngagementStatus } from '../../apis';
import { buildTrademarkTrackingSteps, formatTrackingDate } from '../../utils/tracking';

const CREATED_ON = '2026-03-15T10:00:00.000Z';

const makeEngagement = (overrides: Partial<EngagementStatus> = {}): EngagementStatus => ({
    eid: 1,
    gid: 2,
    name: 'Varsha',
    business_name: 'Peko Pvt Ltd',
    rm: 'Unassigned',
    rmgid: 0,
    rm_profile: '',
    rm_role: null,
    rmsim: null,
    rmemail: '',
    serviceid: 10,
    service: 'Trademark Registration',
    next_followup: '',
    micro_status: 'Not Updated',
    last_notes: 'Not Updated',
    pending_with: '',
    eng_status: 1,
    engagement_status: '',
    completed_on: '',
    date_started: '',
    ...overrides,
});

const filedApp = { status: 'COMPLETED' as const, paymentStatus: 'COMPLETED' as const, createdOn: CREATED_ON };

describe('formatTrackingDate', () => {
    it('returns an empty string for missing values', () => {
        expect(formatTrackingDate()).toBe('');
        expect(formatTrackingDate(null)).toBe('');
        expect(formatTrackingDate('')).toBe('');
    });

    it('formats an ISO date in en-IN long form', () => {
        const expected = new Date(CREATED_ON).toLocaleDateString('en-IN', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
        });

        expect(formatTrackingDate(CREATED_ON)).toBe(expected);
        expect(formatTrackingDate(CREATED_ON)).toContain('2026');
    });
});

describe('buildTrademarkTrackingSteps', () => {
    it('returns four steps in order', () => {
        const steps = buildTrademarkTrackingSteps(filedApp, null);

        expect(steps.map((s) => s.title)).toEqual([
            'Application Submitted',
            'Filed with our filing partner',
            'Processing with Government',
            'Trademark Registered',
        ]);
    });

    it('marks everything pending for an unpaid draft', () => {
        const steps = buildTrademarkTrackingSteps(
            { status: 'DRAFT', paymentStatus: 'PENDING', createdOn: CREATED_ON },
            null
        );

        expect(steps.map((s) => s.status)).toEqual(['pending', 'pending', 'pending', 'pending']);
        expect(steps[0].date).toBe(formatTrackingDate(CREATED_ON));
        expect(steps[1].description).toMatch(/Complete the filing form/);
        expect(steps[2].description).toMatch(/Trademark Registry reviews/);
    });

    it('marks submitted as completed once paid, but filing pending until COMPLETED', () => {
        const steps = buildTrademarkTrackingSteps(
            { status: 'SUBMITTED', paymentStatus: 'COMPLETED', createdOn: CREATED_ON },
            makeEngagement({ pending_with: 'Pending with Client' })
        );

        expect(steps[0].status).toBe('completed');
        expect(steps[1].status).toBe('pending');
        // Government step stays pending when not filed, even with a pending_with signal.
        expect(steps[2].status).toBe('pending');
        expect(steps[2].note).toBeUndefined();
        expect(steps[2].pendingWith).toBeUndefined();
    });

    it('keeps the government step pending when filed but no engagement is available', () => {
        const steps = buildTrademarkTrackingSteps(filedApp, null);

        expect(steps[1].status).toBe('completed');
        expect(steps[1].description).toMatch(/submitted to our filing partner/);
        expect(steps[2].status).toBe('pending');
        expect(steps[2].note).toBeUndefined();
    });

    it('shows processing with status label and notes when filed and not stuck', () => {
        const steps = buildTrademarkTrackingSteps(
            filedApp,
            makeEngagement({ engagement_status: 'In Progress', last_notes: 'Documents verified' })
        );

        expect(steps[2].status).toBe('processing');
        expect(steps[2].note).toBe('Status: In Progress • Documents verified');
        expect(steps[2].pendingWith).toBeUndefined();
    });

    it('leaves the processing note undefined when there is nothing to say', () => {
        const steps = buildTrademarkTrackingSteps(filedApp, makeEngagement());

        expect(steps[2].status).toBe('processing');
        expect(steps[2].note).toBeUndefined();
    });

    it('marks delayed and strips the "Pending with" prefix from pending_with', () => {
        const steps = buildTrademarkTrackingSteps(
            filedApp,
            makeEngagement({
                pending_with: 'pending with Government',
                micro_status: 'Awaiting examination',
                engagement_status: 'On Hold',
                last_notes: 'Registry backlog',
            })
        );

        expect(steps[2].status).toBe('delayed');
        expect(steps[2].pendingWith).toBe('Pending with Government - Awaiting examination');
        expect(steps[2].note).toBe('Status: On Hold • Registry backlog');
    });

    it('uses the default reason and ignores "Not Updated" placeholders when delayed', () => {
        const steps = buildTrademarkTrackingSteps(filedApp, makeEngagement({ pending_with: 'RM' }));

        expect(steps[2].status).toBe('delayed');
        expect(steps[2].pendingWith).toBe('Pending with RM');
        expect(steps[2].note).toBe(
            'Our team is actively working with the concerned authorities to resolve the issue and proceed with the filing.'
        );
    });

    it('falls back to micro status alone when pending_with has no side after the prefix', () => {
        const steps = buildTrademarkTrackingSteps(
            filedApp,
            makeEngagement({ pending_with: 'Pending with ', micro_status: 'Query raised' })
        );

        expect(steps[2].status).toBe('delayed');
        expect(steps[2].pendingWith).toBe('Query raised');
    });

    it('shows the RM when assigned', () => {
        const steps = buildTrademarkTrackingSteps(filedApp, makeEngagement({ rm: 'Anita Sharma' }));

        expect(steps[2].description).toBe('Handled by Anita Sharma');
    });

    it('never marks the final registered step as completed', () => {
        const steps = buildTrademarkTrackingSteps(filedApp, makeEngagement({ engagement_status: 'Completed' }));

        expect(steps[3].status).toBe('pending');
        expect(steps[3].description).toBe('Registration certificate issued.');
    });
});
