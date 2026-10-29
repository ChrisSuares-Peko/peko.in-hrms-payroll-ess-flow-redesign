import { describe, it, expect } from 'vitest';

import { KybApplicationApiShape } from '../../../api/admin/kybStatusApi';
import { resolveStage } from '../../../hooks/admin/useKybStatusApi';

const application = (over: Partial<KybApplicationApiShape> = {}): KybApplicationApiShape => ({
    corporateId: 1,
    kybStatus: 'PENDING',
    kybReference: null,
    businessType: 'PRIVATE_LIMITED',
    rejectionReason: null,
    verifiedAcknowledged: false,
    updatedAt: null,
    ...over,
});

describe('resolveStage', () => {
    it('sends a corporate with no application to the landing page', () => {
        expect(resolveStage(null)).toBe('landing');
    });

    it('sends a fresh application with no business type to the landing page', () => {
        expect(resolveStage(application({ businessType: null }))).toBe('landing');
    });

    it('resumes an in-progress application at the uploads', () => {
        expect(resolveStage(application())).toBe('upload');
    });

    it('shows the submitted screen once a reference is stamped', () => {
        expect(resolveStage(application({ kybReference: 'KYBAAA111' }))).toBe('submitted');
    });

    describe('a rejected application', () => {
        const rejected = (over: Partial<KybApplicationApiShape> = {}) =>
            application({
                kybStatus: 'REJECTED',
                kybReference: 'KYBAAA111',
                rejectionReason: 'Blurred MoA',
                ...over,
            });

        it('shows the rejection until the corporate acts on it', () => {
            expect(resolveStage(rejected())).toBe('rejected');
            expect(resolveStage(rejected({ rejectionAcknowledged: false }))).toBe('rejected');
        });

        // The point of the whole reopen flow: a reload mid-resubmission must not strand them back on
        // the screen they already dismissed, losing their place.
        it('returns them to the uploads once they have asked to resubmit', () => {
            expect(resolveStage(rejected({ rejectionAcknowledged: true }))).toBe('upload');
        });

        it('sends them to the business type first when none is stored', () => {
            expect(
                resolveStage(rejected({ rejectionAcknowledged: true, businessType: null }))
            ).toBe('initiate');
        });

        // Acknowledging the rejection must not leak into the other terminal screens.
        it('still shows verified and complete regardless of the flag', () => {
            expect(
                resolveStage(application({ kybStatus: 'VERIFIED', rejectionAcknowledged: true }))
            ).toBe('verified');
            expect(
                resolveStage(
                    application({
                        kybStatus: 'COMPLETED',
                        verifiedAcknowledged: true,
                        rejectionAcknowledged: true,
                    })
                )
            ).toBe('complete');
        });
    });

    it('owes the corporate the verified screen when COMPLETED was set without it', () => {
        expect(resolveStage(application({ kybStatus: 'COMPLETED' }))).toBe('verified');
    });
});
