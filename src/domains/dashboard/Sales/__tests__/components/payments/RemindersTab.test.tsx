import React from 'react';

import { render, screen } from '@testing-library/react';
import { vi, describe, it, expect } from 'vitest';

import RemindersTab from '../../../components/payments/RemindersTab';

vi.mock('../../../components/payments/reminders/ReminderRulesSection', () => ({
    default: () => <div data-testid="rules-section" />,
}));
vi.mock('../../../components/payments/reminders/ScheduledRemindersTable', () => ({
    default: () => <div data-testid="scheduled-table" />,
}));
vi.mock('../../../components/shared/RankingPanel', () => ({
    default: ({ title }: any) => <div data-testid="ranking-panel">{title}</div>,
}));

describe('RemindersTab', () => {
    it('renders the rules section', () => {
        render(<RemindersTab />);

        expect(screen.getByTestId('rules-section')).toBeInTheDocument();
    });
});
