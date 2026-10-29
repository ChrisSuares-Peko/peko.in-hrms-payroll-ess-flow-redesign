import React from 'react';

import { render, screen, fireEvent } from '@testing-library/react';
import { vi, describe, it, expect } from 'vitest';

import ReminderRuleCard from '../../../../components/payments/reminders/ReminderRuleCard';

const baseRule: any = {
    id: 'before_due',
    title: '7 days before due',
    subtitle: 'Send a polite nudge',
    timing: 'before_due',
    days: 7,
    isEnabled: true,
    emailEnabled: true,
    whatsappEnabled: false,
    emailTemplate: 'Subject: Hi\n\nHello {customer_name}',
    whatsappTemplate: 'Hi there {customer_name}',
};

describe('ReminderRuleCard', () => {
    it('renders title, subtitle and active tag when enabled', () => {
        render(
            <ReminderRuleCard
                rule={baseRule}
                isExpanded={false}
                onToggleExpand={() => {}}
                onUpdate={() => {}}
            />
        );

        expect(screen.getByText('7 days before due')).toBeInTheDocument();
        expect(screen.getByText('Send a polite nudge')).toBeInTheDocument();
        expect(screen.getByText('Active')).toBeInTheDocument();
    });

    it('renders Disabled tag when not enabled', () => {
        render(
            <ReminderRuleCard
                rule={{ ...baseRule, isEnabled: false }}
                isExpanded={false}
                onToggleExpand={() => {}}
                onUpdate={() => {}}
            />
        );

        expect(screen.getByText('Disabled')).toBeInTheDocument();
    });

    it('toggles isEnabled via the switch', () => {
        const onUpdate = vi.fn();
        const { container } = render(
            <ReminderRuleCard
                rule={baseRule}
                isExpanded={false}
                onToggleExpand={onUpdate}
                onUpdate={onUpdate}
            />
        );

        const sw = container.querySelector('.ant-switch') as HTMLElement;
        fireEvent.click(sw);
        expect(onUpdate).toHaveBeenCalledWith('before_due', { isEnabled: false });
    });

    it('toggles emailEnabled / whatsappEnabled via channel chips', () => {
        const onUpdate = vi.fn();
        render(
            <ReminderRuleCard
                rule={baseRule}
                isExpanded={false}
                onToggleExpand={() => {}}
                onUpdate={onUpdate}
            />
        );

        fireEvent.click(screen.getByText('Email'));
        fireEvent.click(screen.getByText('Whatsapp'));

        expect(onUpdate).toHaveBeenCalledWith('before_due', { emailEnabled: false });
        expect(onUpdate).toHaveBeenCalledWith('before_due', { whatsappEnabled: true });
    });

    it('renders the template editor when expanded', () => {
        render(
            <ReminderRuleCard
                rule={baseRule}
                isExpanded
                onToggleExpand={() => {}}
                onUpdate={() => {}}
            />
        );

        expect(screen.getByText(/email template/i)).toBeInTheDocument();
        expect(screen.getByText(/whatsapp template/i)).toBeInTheDocument();
        // Antd Button with icon includes "save" from icon's accessible name.
        const saveBtn = screen.getByText('Save').closest('button');
        expect(saveBtn).not.toBeNull();
    });

    it('saves the email template on Save click in expanded mode', () => {
        const onUpdate = vi.fn();
        render(
            <ReminderRuleCard
                rule={baseRule}
                isExpanded
                onToggleExpand={() => {}}
                onUpdate={onUpdate}
            />
        );

        const saveBtn = screen.getByText('Save').closest('button') as HTMLElement;
        fireEvent.click(saveBtn);
        expect(onUpdate).toHaveBeenCalledWith(
            'before_due',
            expect.objectContaining({
                emailTemplate: expect.stringContaining('Subject:'),
            })
        );
    });
});
