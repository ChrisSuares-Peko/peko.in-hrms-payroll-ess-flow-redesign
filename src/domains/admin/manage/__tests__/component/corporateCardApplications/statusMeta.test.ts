import { describe, it, expect } from 'vitest';

import {
    KYB_STATUS_META,
    KYB_STATUS_OPTIONS,
} from '../../../component/corporateCardApplications/statusMeta';
import { KybStatus } from '../../../types/corporateCardApplications';

const ALL_STATUSES: KybStatus[] = [
    'PENDING',
    'SUBMITTED',
    'UNDER_REVIEW',
    'VERIFIED',
    'REJECTED',
    'COMPLETED',
];

describe('KYB_STATUS_META', () => {
    it('has a color/bg/label entry for every KybStatus', () => {
        ALL_STATUSES.forEach(status => {
            expect(KYB_STATUS_META[status]).toEqual(
                expect.objectContaining({
                    color: expect.any(String),
                    bg: expect.any(String),
                    label: expect.any(String),
                })
            );
        });
    });

    it('gives PENDING, SUBMITTED, and UNDER_REVIEW the same in-flight (amber) color', () => {
        expect(KYB_STATUS_META.SUBMITTED.color).toBe(KYB_STATUS_META.PENDING.color);
        expect(KYB_STATUS_META.UNDER_REVIEW.color).toBe(KYB_STATUS_META.PENDING.color);
    });

    it('gives VERIFIED and COMPLETED the same success (green) color', () => {
        expect(KYB_STATUS_META.COMPLETED.color).toBe(KYB_STATUS_META.VERIFIED.color);
    });

    it('gives REJECTED a distinct color from the in-flight and success statuses', () => {
        expect(KYB_STATUS_META.REJECTED.color).not.toBe(KYB_STATUS_META.PENDING.color);
        expect(KYB_STATUS_META.REJECTED.color).not.toBe(KYB_STATUS_META.VERIFIED.color);
    });
});

describe('KYB_STATUS_OPTIONS', () => {
    it('derives one option per status, matching KYB_STATUS_META label', () => {
        expect(KYB_STATUS_OPTIONS).toHaveLength(ALL_STATUSES.length);
        ALL_STATUSES.forEach(status => {
            expect(KYB_STATUS_OPTIONS).toContainEqual({
                value: status,
                label: KYB_STATUS_META[status].label,
            });
        });
    });
});
