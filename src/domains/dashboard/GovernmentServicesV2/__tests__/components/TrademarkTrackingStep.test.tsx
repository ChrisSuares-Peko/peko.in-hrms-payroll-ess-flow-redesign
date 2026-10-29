import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import TrademarkTrackingStep from '../../components/TrademarkTrackingStep';
import { buildTrademarkTrackingSteps, TrackingStep } from '../../utils/tracking';

// First renders are slow when the suite runs under parallel load.
vi.setConfig({ testTimeout: 30000 });

const makeStep = (overrides: Partial<TrackingStep> = {}): TrackingStep => ({
    title: 'Processing with Government',
    description: 'The Trademark Registry reviews your application.',
    status: 'pending',
    ...overrides,
});

// The vertical connector line is the only w-px element in the step.
const connector = (container: HTMLElement) => container.querySelector('.w-px');

describe('TrademarkTrackingStep', () => {
    it('renders the title, description and date', () => {
        render(<TrademarkTrackingStep step={makeStep({ date: '1 January 2026' })} isLast={false} />);

        expect(screen.getByText('Processing with Government')).toBeInTheDocument();
        expect(screen.getByText('The Trademark Registry reviews your application.')).toBeInTheDocument();
        expect(screen.getByText('1 January 2026')).toBeInTheDocument();
    });

    it.each([
        ['completed', 'Completed', 'check-circle'],
        ['delayed', 'Delayed', 'clock-circle'],
        ['processing', 'Processing', 'loading'],
    ] as const)('renders the %s badge and icon', (status, label, icon) => {
        const { container } = render(<TrademarkTrackingStep step={makeStep({ status })} isLast={false} />);

        expect(screen.getByText(label)).toBeInTheDocument();
        expect(container.querySelector(`[aria-label="${icon}"]`)).toBeInTheDocument();
    });

    it('renders the pending badge with an empty circle and no icon', () => {
        const { container } = render(<TrademarkTrackingStep step={makeStep()} isLast={false} />);

        expect(screen.getByText('Pending')).toBeInTheDocument();
        expect(container.querySelector('[role="img"]')).toBeNull();
        expect(container.querySelector('.rounded-full.border-2')).toBeInTheDocument();
    });

    it('colours the connector green only for completed steps and hides it on the last step', () => {
        const { container, rerender } = render(
            <TrademarkTrackingStep step={makeStep({ status: 'completed' })} isLast={false} />
        );
        expect(connector(container)).toHaveClass('bg-[#22c55e]');

        rerender(<TrademarkTrackingStep step={makeStep({ status: 'processing' })} isLast={false} />);
        expect(connector(container)).toHaveClass('bg-[#e5e7eb]');

        rerender(<TrademarkTrackingStep step={makeStep({ status: 'completed' })} isLast />);
        expect(connector(container)).toBeNull();
    });

    it('omits the date and the "What\'s happening now?" box when absent', () => {
        render(<TrademarkTrackingStep step={makeStep()} isLast />);

        expect(screen.queryByText("What's happening now?")).not.toBeInTheDocument();
    });

    it('shows the note and pending-with side in the "What\'s happening now?" box', () => {
        render(
            <TrademarkTrackingStep
                step={makeStep({ status: 'delayed', note: 'Awaiting documents', pendingWith: 'Pending with Client' })}
                isLast={false}
            />
        );

        expect(screen.getByText("What's happening now?")).toBeInTheDocument();
        expect(screen.getByText('Pending with Client')).toBeInTheDocument();
        expect(screen.getByText('Awaiting documents')).toBeInTheDocument();
    });

    it('shows the box with just a note', () => {
        render(<TrademarkTrackingStep step={makeStep({ status: 'processing', note: 'Status: Filed' })} isLast />);

        expect(screen.getByText("What's happening now?")).toBeInTheDocument();
        expect(screen.getByText('Status: Filed')).toBeInTheDocument();
    });

    it('renders the steps built for a delayed government filing', () => {
        const steps = buildTrademarkTrackingSteps(
            { status: 'COMPLETED', paymentStatus: 'COMPLETED', createdOn: '2026-01-01T00:00:00Z' },
            {
                pending_with: 'Pending with Government',
                micro_status: 'Objection raised',
                last_notes: 'Reply drafted',
                engagement_status: 'In Progress',
                rm: 'Asha',
            } as unknown as Parameters<typeof buildTrademarkTrackingSteps>[1]
        );

        render(
            <>
                {steps.map((step, index) => (
                    <TrademarkTrackingStep key={step.title} step={step} isLast={index === steps.length - 1} />
                ))}
            </>
        );

        expect(screen.getAllByText('Completed')).toHaveLength(2);
        expect(screen.getByText('Delayed')).toBeInTheDocument();
        expect(screen.getByText('Pending')).toBeInTheDocument();
        expect(screen.getByText('Handled by Asha')).toBeInTheDocument();
        expect(screen.getByText('Pending with Government - Objection raised')).toBeInTheDocument();
        expect(screen.getByText('Status: In Progress • Reply drafted')).toBeInTheDocument();
    });
});
