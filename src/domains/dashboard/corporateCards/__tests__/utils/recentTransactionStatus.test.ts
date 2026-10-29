import { describe, it, expect } from 'vitest';

import { recentTransactionStatus } from '../../utils/helpers';

describe('recentTransactionStatus', () => {
    it.each([['Completed'], ['Declined'], ['Processing'], ['Reversed'], ['Refunded']])(
        'passes %p through as the transaction status the server reported',
        status => {
            expect(recentTransactionStatus(status)).toBe(status);
        }
    );

    // 'Pending' belongs to the approval vocabulary, not the transaction one — a reversed or refunded
    // transaction rendered as "Pending" reads as an approval state that was never asked for.
    it.each([['Reversed'], ['Refunded']])('never reports %p as Pending', status => {
        expect(recentTransactionStatus(status)).not.toBe('Pending');
    });

    it('falls back to Processing for a status it does not know', () => {
        expect(recentTransactionStatus('Settled')).toBe('Processing');
        expect(recentTransactionStatus('')).toBe('Processing');
    });

    it('does not fall back to an approval word', () => {
        expect(recentTransactionStatus('Settled')).not.toBe('Pending');
        expect(recentTransactionStatus('Settled')).not.toBe('Approved');
    });
});
