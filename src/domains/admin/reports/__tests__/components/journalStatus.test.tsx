import '@testing-library/jest-dom/vitest';

import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import {
    renderJournalStatus,
    renderJournalStatusSummary,
} from '../../components/OrderJournal/journalStatus';

describe('renderJournalStatusSummary', () => {
    it('tells a journal the worker skipped from one that never ran', () => {
        render(renderJournalStatusSummary(null, null));
        expect(screen.getByText('Not recorded')).toBeInTheDocument();
    });

    it('reads the skip marker off the journal data when no verdict was left', () => {
        render(
            renderJournalStatusSummary(
                {},
                { transaction: { skipped: true, reason: 'Journal recording is currently paused' } }
            )
        );
        expect(screen.getByText('Skipped: 1')).toBeInTheDocument();
    });

    it('counts an entry held back before it was sent as skipped, not failed', () => {
        render(
            renderJournalStatusSummary(
                { transaction: false },
                { transaction: { skipped: true, reason: 'Journal recording is currently paused' } }
            )
        );
        expect(screen.getByText('Skipped: 1')).toBeInTheDocument();
        expect(screen.queryByText(/Failed/)).not.toBeInTheDocument();
    });

    it('counts recorded, refused and held back entries apart', () => {
        render(
            renderJournalStatusSummary(
                { transaction: true, refund: false, adminRefund: false },
                { adminRefund: { skipped: true } }
            )
        );
        expect(screen.getByText('Success: 1')).toBeInTheDocument();
        expect(screen.getByText('Failed: 1')).toBeInTheDocument();
        expect(screen.getByText('Skipped: 1')).toBeInTheDocument();
    });

    it('counts the verdicts when any were left', () => {
        render(renderJournalStatusSummary({ transaction: true, refund: false }, null));
        expect(screen.getByText('Success: 1')).toBeInTheDocument();
        expect(screen.getByText('Failed: 1')).toBeInTheDocument();
    });
});

describe('renderJournalStatus', () => {
    it('labels the transaction line by what actually happened to it', () => {
        const { rerender } = render(renderJournalStatus(true, { skippedOnUndefined: true }));
        expect(screen.getByText('Recorded')).toBeInTheDocument();

        rerender(renderJournalStatus(false, { skippedOnUndefined: true }));
        expect(screen.getByText('Failed')).toBeInTheDocument();

        rerender(renderJournalStatus(undefined, { skippedOnUndefined: true, skipped: true }));
        expect(screen.getByText('Skipped')).toBeInTheDocument();

        rerender(renderJournalStatus(false, { skippedOnUndefined: true, skipped: true }));
        expect(screen.getByText('Skipped')).toBeInTheDocument();
        expect(screen.queryByText('Failed')).not.toBeInTheDocument();

        rerender(renderJournalStatus(true, { skippedOnUndefined: true, skipped: true }));
        expect(screen.getByText('Recorded')).toBeInTheDocument();

        rerender(renderJournalStatus(undefined, { skippedOnUndefined: true }));
        expect(screen.getByText('Not recorded')).toBeInTheDocument();
    });

    it('dashes the other lines rather than calling an absent refund not recorded', () => {
        render(renderJournalStatus(undefined));
        expect(screen.getByText('—')).toBeInTheDocument();
    });
});
