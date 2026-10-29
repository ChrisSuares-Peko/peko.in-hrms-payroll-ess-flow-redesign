import React from 'react';

import { render, screen, fireEvent } from '@testing-library/react';
import { vi, describe, it, expect } from 'vitest';

import ReminderRulesSection from '../../../../components/payments/reminders/ReminderRulesSection';

vi.mock('../../../../hooks/useReminderRules', async () => {
    const { useState } = await import('react');
    function useReminderRulesMock() {
        const [automaticReminders, setAutomaticReminders] = useState(true);
        return {
            rules: [
                { id: 'before_due', title: 'Before due', subtitle: '', timing: 'before_due', days: 3, isEnabled: true, emailEnabled: true, whatsappEnabled: false, emailTemplate: '', whatsappTemplate: '' },
                { id: 'on_due', title: 'On due', subtitle: '', timing: 'on_due', days: 0, isEnabled: true, emailEnabled: true, whatsappEnabled: false, emailTemplate: '', whatsappTemplate: '' },
            ],
            automaticReminders,
            isLoading: false,
            isError: false,
            updateRule: vi.fn(),
            toggleAutomaticReminders: setAutomaticReminders,
        };
    }
    return { default: useReminderRulesMock };
});
vi.mock('../../../../components/payments/reminders/ReminderRuleCard', () => ({
    default: ({ rule, isExpanded, onToggleExpand }: any) => (
        <div data-testid="rule-card">
            <span>{rule.id}</span>
            <span>{isExpanded ? 'expanded' : 'collapsed'}</span>
            <button type="button" onClick={onToggleExpand}>
                toggle-{rule.id}
            </button>
        </div>
    ),
}));
vi.mock('../../../../constants/payments', async () => {
    const actual: any = await vi.importActual('../../../../constants/payments');
    return {
        ...actual,
        INITIAL_REMINDER_RULES: [
            {
                id: 'before_due',
                title: 'Before due',
                subtitle: '',
                timing: 'before_due',
                days: 3,
                isEnabled: true,
                emailEnabled: true,
                whatsappEnabled: false,
                emailTemplate: '',
                whatsappTemplate: '',
            },
            {
                id: 'on_due',
                title: 'On due',
                subtitle: '',
                timing: 'on_due',
                days: 0,
                isEnabled: true,
                emailEnabled: true,
                whatsappEnabled: false,
                emailTemplate: '',
                whatsappTemplate: '',
            },
        ],
    };
});

describe('ReminderRulesSection', () => {
    it('renders all rule cards collapsed by default', () => {
        render(<ReminderRulesSection />);

        expect(screen.getByText('Reminder Rules')).toBeInTheDocument();
        const cards = screen.getAllByTestId('rule-card');
        expect(cards).toHaveLength(2);
        expect(cards[0].textContent).toContain('collapsed');
        expect(cards[1].textContent).toContain('collapsed');
    });

    it('toggles which rule is expanded when toggle button is clicked', () => {
        render(<ReminderRulesSection />);

        fireEvent.click(screen.getByText('toggle-on_due'));
        const cards = screen.getAllByTestId('rule-card');
        expect(cards[0].textContent).toContain('collapsed');
        expect(cards[1].textContent).toContain('expanded');
    });

    it('toggles automatic reminders switch', () => {
        const { container } = render(<ReminderRulesSection />);
        const sw = container.querySelectorAll('.ant-switch')[0] as HTMLElement;

        expect(sw.className).toContain('ant-switch-checked');
        fireEvent.click(sw);
        expect(sw.className).not.toContain('ant-switch-checked');
    });
});
