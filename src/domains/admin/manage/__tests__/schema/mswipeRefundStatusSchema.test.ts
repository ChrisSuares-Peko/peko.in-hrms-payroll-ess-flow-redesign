import { describe, expect, it } from 'vitest';

import { mswipeRefundStatusSchema } from '../../schema/mswipeRefundStatusSchema';

const errorFor = async (values: Record<string, string>) => {
    try {
        await mswipeRefundStatusSchema.validate(values);
        return null;
    } catch (error) {
        return (error as Error).message;
    }
};

describe('mswipeRefundStatusSchema', () => {
    it('asks for a status', async () => {
        expect(await errorFor({ status: '' })).toBe('Please select the refund status');
    });

    it('accepts moving a refund to in progress without a reference or remarks', async () => {
        expect(
            await errorFor({ status: 'IN_PROGRESS', refundReference: '', remarks: '' })
        ).toBeNull();
    });

    describe('when marking a refund refunded', () => {
        it('asks for the Mswipe refund reference', async () => {
            expect(await errorFor({ status: 'SUCCESS', refundReference: '' })).toBe(
                'Please enter the Mswipe refund reference'
            );
        });

        it('accepts a reference made of letters, numbers and . _ / -', async () => {
            expect(
                await errorFor({ status: 'SUCCESS', refundReference: 'MSW-2026/10_23.1' })
            ).toBeNull();
        });

        it('rejects other characters in the reference', async () => {
            expect(await errorFor({ status: 'SUCCESS', refundReference: 'REF<1>' })).toBe(
                'Refund reference can only contain letters, numbers, spaces and . _ / -'
            );
        });

        it('rejects a reference that starts with whitespace', async () => {
            expect(await errorFor({ status: 'SUCCESS', refundReference: ' REF1' })).toBe(
                'Refund reference cannot start with whitespace'
            );
        });

        it('rejects a reference longer than 128 characters', async () => {
            expect(await errorFor({ status: 'SUCCESS', refundReference: 'A'.repeat(129) })).toBe(
                'Refund reference cannot exceed 128 characters'
            );
        });
    });

    describe('when rejecting a refund', () => {
        it('asks for the reason', async () => {
            expect(await errorFor({ status: 'FAILED', remarks: '' })).toBe(
                'Please enter the reason for rejecting the refund'
            );
        });

        it('rejects remarks longer than 500 characters', async () => {
            expect(await errorFor({ status: 'FAILED', remarks: 'a'.repeat(501) })).toBe(
                'Remarks cannot exceed 500 characters'
            );
        });

        it('rejects remarks that start with whitespace', async () => {
            expect(await errorFor({ status: 'FAILED', remarks: ' declined' })).toBe(
                'Remarks cannot start with whitespace'
            );
        });
    });
});
