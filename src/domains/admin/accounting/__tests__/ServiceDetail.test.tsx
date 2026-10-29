import '@testing-library/jest-dom/vitest';

import { render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { Mock, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';

import { useAppDispatch, useAppSelector } from '@src/hooks/store';

import { getAccountingService } from '../api/services';
import { AccountingShellProvider, DrillPanel } from '../context/AccountingShellContext';
import ServiceDetail from '../pages/ServiceDetail';
import { AccountingService } from '../types/services';

const navigateMock = vi.fn();

vi.mock('react-router-dom', async () => {
    const actual = await vi.importActual<typeof import('react-router-dom')>('react-router-dom');
    return {
        ...actual,
        useNavigate: () => navigateMock,
        Navigate: ({ to }: { to: string }) => <div data-testid="navigate">{to}</div>,
    };
});

vi.mock('@src/hooks/store', () => ({
    useAppSelector: vi.fn(),
    useAppDispatch: vi.fn(),
}));

vi.mock('../api/services', () => ({
    getAccountingServices: vi.fn(),
    getAccountingService: vi.fn(),
    getServicesTypeConfig: vi.fn(),
}));

const SERVICE: AccountingService = {
    id: 1,
    serviceProvider: 'Business Emails',
    accessKey: 'email_domain_service',
    serviceCategory: 'Software',
    serviceStatus: true,
    serviceImage: null,
    commissionMode: 'MARGIN',
    commissionType: 'PERCENTAGE',
    providerCommission: 12,
    fixedCommissionPerTransaction: 0,
    isCommissionInclGST: false,
    recordJournalEntry: true,
    createdAt: '2026-09-01T00:00:00.000Z',
    vendor: {
        id: 9,
        vendorName: 'Titan Mail',
        state: null,
        gstNo: null,
        address: null,
        vendorEmail: [],
    },
    planType: 'with_plans',
    commissionConfigured: true,
};

const renderDetail = (url: string, kind: 'with_plans' | 'without_plans', setPanel = vi.fn()) => {
    render(
        <AccountingShellProvider value={setPanel}>
            <MemoryRouter initialEntries={[url]}>
                <Routes>
                    <Route
                        path="/system-user/accounting/:slug/:accessKey/:tab?"
                        element={<ServiceDetail kind={kind} />}
                    />
                </Routes>
            </MemoryRouter>
        </AccountingShellProvider>
    );
    return setPanel;
};

const lastPanel = (setPanel: Mock): DrillPanel | null => {
    const calls = setPanel.mock.calls.filter(([value]) => value !== null);
    return calls.length ? calls[calls.length - 1][0] : null;
};

beforeAll(() => {
    // GenericTable folds any column past the viewport into the expandable row, and jsdom
    // is 1024 wide by default, which is narrower than these tables.
    Object.defineProperty(window, 'innerWidth', { value: 1920, writable: true });
});

describe('ServiceDetail', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        (useAppSelector as unknown as Mock).mockImplementation((selector: any) =>
            selector({ reducer: { auth: { role: 'system_user', id: 7 } } })
        );
        (useAppDispatch as unknown as Mock).mockReturnValue(vi.fn());
    });

    it('redirects a missing tab to the default tab for the kind', () => {
        (getAccountingService as Mock).mockResolvedValue(SERVICE);

        renderDetail(
            '/system-user/accounting/service-with-plans/email_domain_service',
            'with_plans'
        );

        expect(screen.getByTestId('navigate')).toHaveTextContent(
            '/system-user/accounting/service-with-plans/email_domain_service/plans'
        );
    });

    it('registers the drill panel with the service header and tabs, and renders the tab body', async () => {
        (getAccountingService as Mock).mockResolvedValue(SERVICE);

        const setPanel = renderDetail(
            '/system-user/accounting/service-with-plans/email_domain_service/vendor',
            'with_plans'
        );

        await waitFor(() => expect(lastPanel(setPanel)).not.toBeNull());
        const panel = lastPanel(setPanel)!;
        expect(panel.title).toBe('Business Emails');
        expect(panel.subtitle).toBe('Titan Mail');
        expect(panel.status).toEqual({ label: 'Configured', tone: 'success' });
        expect(panel.tabs.map(tab => tab.key)).toEqual([
            'plans',
            'platform-fee',
            'cashbacks',
            'vendor',
        ]);
        expect(panel.activeKey).toBe('vendor');
        expect(panel.backTo).toBe('/system-user/accounting/service-with-plans');

        panel.onTabChange('cashbacks');
        expect(navigateMock).toHaveBeenCalledWith(
            '/system-user/accounting/service-with-plans/email_domain_service/cashbacks'
        );

        expect(
            screen.getByText('Vendor of record for Business Emails, used on journals and payables.')
        ).toBeInTheDocument();
        expect(screen.getAllByText('GST Number').length).toBeGreaterThan(0);
    });

    it('says what is left in the header of a service with plans', async () => {
        (getAccountingService as Mock).mockResolvedValue({
            ...SERVICE,
            configuration: {
                plans: { total: 12, notConfigured: 3 },
                serviceCommissionItems: null,
                platformFee: { total: 5, notConfigured: 0 },
            },
        });

        const setPanel = renderDetail(
            '/system-user/accounting/service-with-plans/email_domain_service/vendor',
            'with_plans'
        );

        await waitFor(() => expect(lastPanel(setPanel)).not.toBeNull());
        expect(lastPanel(setPanel)!.status).toEqual({ label: 'Not configured', tone: 'warning' });
    });

    it('uses the commission tab set for services without plans', async () => {
        (getAccountingService as Mock).mockResolvedValue({
            ...SERVICE,
            planType: 'without_plans',
        });

        const setPanel = renderDetail(
            '/system-user/accounting/service-without-plans/email_domain_service/commission',
            'without_plans'
        );

        await waitFor(() => expect(lastPanel(setPanel)).not.toBeNull());
        expect(lastPanel(setPanel)!.tabs.map(tab => tab.key)).toEqual([
            'commission',
            'platform-fee',
            'cashbacks',
            'vendor',
        ]);
        expect(lastPanel(setPanel)!.status).toEqual({ label: 'Configured', tone: 'success' });
        expect(screen.getByText('Current Rate')).toBeInTheDocument();
        expect(screen.getByText('12%')).toBeInTheDocument();
    });

    it('shows a saved zero commission as 0% and prefills the form with 0', async () => {
        (getAccountingService as Mock).mockResolvedValue({
            ...SERVICE,
            planType: 'without_plans',
            providerCommission: 0,
            fixedCommissionPerTransaction: 0,
        });

        renderDetail(
            '/system-user/accounting/service-without-plans/email_domain_service/commission',
            'without_plans'
        );

        expect((await screen.findAllByText('0%')).length).toBeGreaterThan(0);
        expect(screen.queryByText('Not configured')).not.toBeInTheDocument();
        expect(screen.getAllByDisplayValue('0').length).toBeGreaterThan(0);
    });

    it('keeps Not configured for a service whose commission type was never set', async () => {
        (getAccountingService as Mock).mockResolvedValue({
            ...SERVICE,
            planType: 'without_plans',
            commissionType: null,
            providerCommission: 0,
            fixedCommissionPerTransaction: 0,
            commissionConfigured: false,
        });

        renderDetail(
            '/system-user/accounting/service-without-plans/email_domain_service/commission',
            'without_plans'
        );

        expect(await screen.findByText('Not configured')).toBeInTheDocument();
        expect(screen.queryByText('0%')).not.toBeInTheDocument();
    });

    it('shows a not-found state when the service is unmapped or missing', async () => {
        (getAccountingService as Mock).mockResolvedValue(false);

        const setPanel = renderDetail(
            '/system-user/accounting/service-with-plans/ghost/plans',
            'with_plans'
        );

        await waitFor(() => expect(screen.getByText('Service not found')).toBeInTheDocument());
        expect(lastPanel(setPanel)).toBeNull();
    });
});
