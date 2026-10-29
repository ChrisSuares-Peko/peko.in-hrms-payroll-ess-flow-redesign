import '@testing-library/jest-dom/vitest';

import { fireEvent, render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { describe, expect, it, vi } from 'vitest';

import AccountingDrillPanel from '../components/AccountingDrillPanel';
import { DrillPanel } from '../context/AccountingShellContext';

const panel = (onTabChange = vi.fn()): DrillPanel => ({
    backTo: '/system-user/accounting/service-with-plans',
    backLabel: 'All services',
    title: 'Business Emails',
    subtitle: 'Titan Mail',
    status: { label: 'Active', tone: 'success' },
    tabs: [
        { key: 'plans', label: 'Plans', icon: <span>P</span> },
        { key: 'vendor', label: 'Vendor', icon: <span>V</span> },
    ],
    activeKey: 'plans',
    onTabChange,
});

describe('AccountingDrillPanel', () => {
    it('renders the header, back link and vertical tabs', () => {
        const onTabChange = vi.fn();
        render(
            <MemoryRouter>
                <AccountingDrillPanel panel={panel(onTabChange)} />
            </MemoryRouter>
        );

        expect(screen.getByText('Business Emails')).toBeInTheDocument();
        expect(screen.getByText('Titan Mail')).toBeInTheDocument();
        expect(screen.getByText('Active')).toBeInTheDocument();
        expect(screen.getByText('All services').closest('a')).toHaveAttribute(
            'href',
            '/system-user/accounting/service-with-plans'
        );

        fireEvent.click(screen.getByText('Vendor'));
        expect(onTabChange).toHaveBeenCalledWith('vendor');
    });

    it('renders a horizontal tab bar in horizontal mode', () => {
        const onTabChange = vi.fn();
        render(
            <MemoryRouter>
                <AccountingDrillPanel panel={panel(onTabChange)} mode="horizontal" />
            </MemoryRouter>
        );

        expect(screen.queryByTestId('accounting-drill-panel')).not.toBeInTheDocument();
        fireEvent.click(screen.getByText('Vendor'));
        expect(onTabChange).toHaveBeenCalledWith('vendor');
    });

    it('lets vendor service subtitles expand and collapse in the side panel', () => {
        const services = ['Bike Insurance', 'Bill Payments', 'Broadband Bill', 'Cable Recharge'];
        render(
            <MemoryRouter>
                <AccountingDrillPanel
                    panel={{ ...panel(), subtitle: services.join(' · '), subtitleExpandable: true }}
                />
            </MemoryRouter>
        );

        expect(
            screen.getByText('Bike Insurance · Bill Payments · Broadband Bill · …')
        ).toBeInTheDocument();
        fireEvent.click(screen.getByRole('button', { name: 'Show more' }));
        expect(screen.getByText(services.join(' · '))).toBeInTheDocument();
        fireEvent.click(screen.getByRole('button', { name: 'Show less' }));
        expect(
            screen.getByText('Bike Insurance · Bill Payments · Broadband Bill · …')
        ).toBeInTheDocument();
    });
});
