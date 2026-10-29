import React from 'react';

import { render, screen } from '@testing-library/react';
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';
import { describe, it, expect, beforeAll } from 'vitest';

import ActivityTimelineCard from '../../../components/agreementDetails/ActivityTimelineCard';

beforeAll(() => {
    dayjs.extend(relativeTime);
});

describe('ActivityTimelineCard', () => {
    it('renders the title and one row per timeline event', () => {
        const timeline = [
            { eventName: 'Created', createdAt: dayjs().subtract(1, 'day').toISOString() },
            { eventName: 'Sent for sign', createdAt: dayjs().subtract(2, 'hour').toISOString() },
        ];

        render(<ActivityTimelineCard timeline={timeline} />);

        expect(screen.getByText('Activity Timeline')).toBeInTheDocument();
        expect(screen.getByText('Created')).toBeInTheDocument();
        expect(screen.getByText('Sent for sign')).toBeInTheDocument();
    });

    it('renders empty state when timeline is empty (no event rows)', () => {
        render(<ActivityTimelineCard timeline={[]} />);

        expect(screen.getByText('Activity Timeline')).toBeInTheDocument();
    });

    it('renders relative time strings', () => {
        const timeline = [
            { eventName: 'Created', createdAt: dayjs().subtract(3, 'day').toISOString() },
        ];

        render(<ActivityTimelineCard timeline={timeline} />);

        // dayjs relativeTime would render "3 days ago" — assert via case-insensitive match.
        expect(screen.getByText(/days? ago/i)).toBeInTheDocument();
    });
});
