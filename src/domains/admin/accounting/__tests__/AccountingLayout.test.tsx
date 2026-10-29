import '@testing-library/jest-dom/vitest';

import { render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { Mock, beforeEach, describe, expect, it, vi } from 'vitest';

import { useAppSelector } from '@src/hooks/store';
import AccountingLayout from '@src/layouts/AccountingLayout';

import { getAccountingGoLiveDate } from '../api/accountingPeriod';
import { getApprovalGate } from '../api/approvals';
import { GATE_BANNER_MESSAGE } from '../components/approvals/ApprovalGateBanner';
import { DrillPanel, useAccountingDrillPanel } from '../context/AccountingShellContext';

vi.mock('@src/hooks/store', () => ({
    useAppSelector: vi.fn(),
    useAppDispatch: () => vi.fn(),
}));

vi.mock('@src/hooks/useUserInfo', () => ({
    default: () => ({ isLoading: false, getUserServicesData: vi.fn(), getUserData: vi.fn() }),
}));

vi.mock('@src/hooks/useScreenSize', () => ({
    default: () => ({ lg: true }),
}));

vi.mock('@src/domains/auth/hooks/usePrivacyAcceptApi', () => ({
    default: () => ({ acceptPrivacyPolicyForUser: vi.fn(), isLoading: false }),
}));

vi.mock('@components/molecular/breadcrumbs/CustomBreadcrumb', () => ({
    default: () => <div data-testid="global-breadcrumb" />,
}));

vi.mock('@components/molecular/nav-section/horizontal/CustomHeader', () => ({
    default: () => <div data-testid="custom-header" />,
}));

vi.mock('@components/molecular/nav-section/horizontal/MobileHeader', () => ({
    default: () => <div />,
}));

vi.mock('../api/accountingPeriod', () => ({
    getAccountingGoLiveDate: vi.fn(),
    updateAccountingGoLiveDate: vi.fn(),
}));

vi.mock('../api/approvals', () => ({
    getApprovalGate: vi.fn(),
    updateApprovalGate: vi.fn(),
}));

vi.mock('@components/molecular/loaders/Spinner', () => ({ default: () => <div /> }));
vi.mock('@components/molecular/footer', () => ({ default: () => <div /> }));
vi.mock('@components/molecular/searchTree/SearchTree', () => ({ default: () => <div /> }));

const PANEL: DrillPanel = {
    backTo: '/system-user/accounting/service-with-plans',
    backLabel: 'All services',
    title: 'Business Emails',
    tabs: [{ key: 'plans', label: 'Plans', icon: <span>P</span> }],
    activeKey: 'plans',
    onTabChange: vi.fn(),
};

const DrillPage = () => {
    useAccountingDrillPanel(PANEL);
    return <div>detail body</div>;
};

const state = {
    reducer: {
        auth: { showPrivacyPolicyModal: false, role: 'system_user', id: 1 },
        services: {
            services: {
                data: [
                    {
                        serviceCategory: 'Accounting',
                        hasAccess: true,
                        services: [
                            {
                                category: 'Operations',
                                hasAccess: true,
                                services: [{ service: 'Service with plans', hasAccess: true }],
                            },
                        ],
                    },
                ],
            },
        },
    },
};

const gateOn = { enabled: true, reason: null, setById: null, setByName: null, setAt: null };

describe('AccountingLayout', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        (useAppSelector as unknown as Mock).mockImplementation((selector: any) => selector(state));
        (getApprovalGate as Mock).mockResolvedValue(gateOn);
        (getAccountingGoLiveDate as Mock).mockResolvedValue({
            date: '2026-09-01',
            configured: true,
        });
    });

    it('shows the full sidebar and global breadcrumb when no drill panel is registered', () => {
        render(
            <MemoryRouter initialEntries={['/system-user/accounting']}>
                <AccountingLayout>
                    <div>list body</div>
                </AccountingLayout>
            </MemoryRouter>
        );

        expect(screen.getByTestId('global-breadcrumb')).toBeInTheDocument();
        expect(screen.queryByTestId('accounting-drill-panel')).not.toBeInTheDocument();
        expect(document.querySelector('.ant-menu-inline-collapsed')).toBeNull();
        expect(screen.getByText('Service with plans')).toBeInTheDocument();
    });

    it('collapses to the icon rail and shows the drill panel while a page registers one', async () => {
        render(
            <MemoryRouter
                initialEntries={[
                    '/system-user/accounting/service-with-plans/email_domain_service/plans',
                ]}
            >
                <AccountingLayout>
                    <DrillPage />
                </AccountingLayout>
            </MemoryRouter>
        );

        await waitFor(() =>
            expect(screen.getByTestId('accounting-drill-panel')).toBeInTheDocument()
        );
        expect(screen.queryByTestId('global-breadcrumb')).not.toBeInTheDocument();
        expect(document.querySelector('.ant-menu-inline-collapsed')).not.toBeNull();
        expect(screen.getByText('Business Emails')).toBeInTheDocument();
        expect(screen.getByText('detail body')).toBeInTheDocument();
    });
});

describe('the go live banner in the shell', () => {
    const renderAt = (path: string) =>
        render(
            <MemoryRouter initialEntries={[path]}>
                <AccountingLayout>
                    <div>list body</div>
                </AccountingLayout>
            </MemoryRouter>
        );

    beforeEach(() => {
        vi.clearAllMocks();
        (useAppSelector as unknown as Mock).mockImplementation((selector: any) => selector(state));
        (getApprovalGate as Mock).mockResolvedValue(gateOn);
    });

    it('says the portal counts nothing, and offers to set the date', async () => {
        (getAccountingGoLiveDate as Mock).mockResolvedValue({ date: null, configured: false });

        renderAt('/system-user/accounting/vendors');

        expect(await screen.findByText('No accounting go live date is set')).toBeInTheDocument();
        expect(
            screen.getByText(
                'Until one is set this portal counts nothing: every list is empty and every figure reads zero. Set the first day it should account for.'
            )
        ).toBeInTheDocument();
        expect(screen.getByRole('button', { name: /Set date/ })).toBeInTheDocument();
    });

    it('stays out of the way once a date is set', async () => {
        (getAccountingGoLiveDate as Mock).mockResolvedValue({
            date: '2026-09-01',
            configured: true,
        });

        renderAt('/system-user/accounting/vendors');

        await waitFor(() => expect(getAccountingGoLiveDate).toHaveBeenCalled());
        expect(screen.queryByText('No accounting go live date is set')).not.toBeInTheDocument();
    });

    it('leaves the dashboard to its own card rather than saying it twice', async () => {
        (getAccountingGoLiveDate as Mock).mockResolvedValue({ date: null, configured: false });

        renderAt('/system-user/accounting');

        await waitFor(() => expect(getAccountingGoLiveDate).toHaveBeenCalled());
        expect(screen.queryByText('No accounting go live date is set')).not.toBeInTheDocument();
    });
});

describe('the approval gate banner in the shell', () => {
    const renderAt = (path: string) =>
        render(
            <MemoryRouter initialEntries={[path]}>
                <AccountingLayout>
                    <div>list body</div>
                </AccountingLayout>
            </MemoryRouter>
        );

    beforeEach(() => {
        vi.clearAllMocks();
        (useAppSelector as unknown as Mock).mockImplementation((selector: any) => selector(state));
        (getAccountingGoLiveDate as Mock).mockResolvedValue({
            date: '2026-09-01',
            configured: true,
        });
    });

    it('warns on the dashboard too while the gate is off', async () => {
        (getApprovalGate as Mock).mockResolvedValue({ ...gateOn, enabled: false });

        renderAt('/system-user/accounting');

        expect(await screen.findByText(GATE_BANNER_MESSAGE)).toBeInTheDocument();
    });

    it('stays silent while the gate is on', async () => {
        (getApprovalGate as Mock).mockResolvedValue(gateOn);

        renderAt('/system-user/accounting/vendors');

        await waitFor(() => expect(getApprovalGate).toHaveBeenCalled());
        expect(screen.queryByText(GATE_BANNER_MESSAGE)).not.toBeInTheDocument();
    });
});
