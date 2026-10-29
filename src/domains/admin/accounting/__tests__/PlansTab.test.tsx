import '@testing-library/jest-dom/vitest';

import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { Mock, beforeEach, describe, expect, it, vi } from 'vitest';

import usePartnersForCorporate from '@src/domains/admin/users/hooks/usePartnersForCorporate';

import PlansTab from '../components/serviceDetail/PlansTab';
import useAccountingServiceAddOns from '../hooks/useAccountingServiceAddOns';
import useAccountingServicePlans from '../hooks/useAccountingServicePlans';
import useCommissionModes from '../hooks/useCommissionModes';
import { AccountingService } from '../types/services';
import { COMMISSION_MODE_OPTIONS } from '../utils/serviceDetailData';

vi.mock('@src/hooks/store', () => ({ useAppSelector: vi.fn(), useAppDispatch: () => vi.fn() }));

vi.mock('@src/domains/admin/users/hooks/usePartnersForCorporate', () => ({ default: vi.fn() }));

vi.mock('../hooks/useAccountingServicePlans', () => ({ default: vi.fn() }));

vi.mock('../hooks/useAccountingServiceAddOns', () => ({ default: vi.fn() }));

vi.mock('../hooks/useCommissionModes', () => ({ default: vi.fn() }));

const SERVICE: AccountingService = {
    id: 7,
    serviceProvider: 'Gift Desk',
    accessKey: 'gift_desk',
    serviceCategory: 'Gifting',
    serviceStatus: true,
    serviceImage: null,
    commissionMode: 'MARGIN',
    commissionType: 'PERCENTAGE',
    providerCommission: 4,
    fixedCommissionPerTransaction: 0,
    isCommissionInclGST: false,
    recordJournalEntry: true,
    createdAt: '2026-09-01T00:00:00.000Z',
    vendor: null,
    planType: 'with_plans',
    commissionConfigured: true,
};

const plansHook = (overrides: Record<string, unknown>) =>
    (useAccountingServicePlans as unknown as Mock).mockReturnValue({
        isLoading: false,
        supported: true,
        plans: [],
        count: 0,
        updatePlanCommission: vi.fn(),
        updatePlanCommissionBulk: vi.fn(),
        ...overrides,
    });

const renderTab = (onSaveCommission = vi.fn().mockResolvedValue(true), service = SERVICE) => {
    render(
        <MemoryRouter>
            <PlansTab
                service={service}
                onSaveCommission={onSaveCommission}
                onToggleCommissionConfigured={vi.fn().mockResolvedValue(true)}
            />
        </MemoryRouter>
    );
    return onSaveCommission;
};

beforeEach(() => {
    vi.clearAllMocks();
    (useCommissionModes as unknown as Mock).mockReturnValue({
        options: COMMISSION_MODE_OPTIONS,
        isLoading: false,
    });
    (usePartnersForCorporate as unknown as Mock).mockReturnValue({
        partnerData: [],
        loading: false,
        categoryDatas: [],
    });
});

describe('PlansTab', () => {
    it('sets the service commission itself when its plans carry none of their own', async () => {
        plansHook({ supported: true });
        const onSaveCommission = renderTab(undefined, {
            ...SERVICE,
            accessKey: 'domain_and_hosting',
        });
        fireEvent.click(screen.getByRole('button', { name: 'Domain' }));

        expect(screen.getByText('Commission')).toBeInTheDocument();

        fireEvent.click(screen.getByText('Save changes').closest('button') as HTMLElement);

        await waitFor(() =>
            expect(onSaveCommission).toHaveBeenCalledWith(
                expect.objectContaining({ commissionType: 'PERCENTAGE', providerCommission: 4 })
            )
        );
    });

    it('asks the service page to refresh its status once a plan is marked configured', async () => {
        const togglePlanCommissionConfigured = vi.fn().mockResolvedValue(true);
        plansHook({
            plans: [
                {
                    id: 3,
                    planName: 'Gold',
                    commissionMode: 'MARGIN',
                    commissionType: 'PERCENTAGE',
                    commission: 4,
                    fixedCommissionPerTransaction: 0,
                    isCommissionInclGST: false,
                    commissionConfigured: false,
                },
            ],
            count: 1,
            togglePlanCommissionConfigured,
        });
        const onConfigurationChange = vi.fn();

        render(
            <MemoryRouter>
                <PlansTab
                    service={SERVICE}
                    onSaveCommission={vi.fn()}
                    onToggleCommissionConfigured={vi.fn()}
                    onConfigurationChange={onConfigurationChange}
                />
            </MemoryRouter>
        );
        fireEvent.click(screen.getByRole('button', { name: 'Expand row' }));
        fireEvent.click(await screen.findByRole('img', { name: 'close' }));

        await waitFor(() => expect(onConfigurationChange).toHaveBeenCalledTimes(1));
        expect(togglePlanCommissionConfigured).toHaveBeenCalledWith(
            expect.objectContaining({ id: 3 })
        );
    });

    it('keeps the plan list for a service whose plans carry their own commission', () => {
        plansHook({ supported: true });
        renderTab();

        expect(screen.getByText('Plans')).toBeInTheDocument();
        expect(screen.queryByText('Save changes')).not.toBeInTheDocument();
    });

    it('gives WhatsApp an Add-ons tab next to its plans, and no other service', () => {
        plansHook({ supported: true });
        (useAccountingServiceAddOns as unknown as Mock).mockReturnValue({
            isLoading: false,
            addOns: [],
            updateAddOn: vi.fn(),
        });

        renderTab(undefined, { ...SERVICE, accessKey: 'whatsApp_for_busines' });
        expect(screen.getByRole('button', { name: 'Plans' })).toBeInTheDocument();
        expect(useAccountingServiceAddOns).not.toHaveBeenCalled();

        fireEvent.click(screen.getByRole('button', { name: 'Add-ons' }));

        expect(
            screen.getByText(/Configure the price and the commission Peko earns on each add-on/)
        ).toBeInTheDocument();
        expect(useAccountingServiceAddOns).toHaveBeenCalledWith('whatsApp_for_busines');
    });

    it('opens on the Add-ons tab when the link asks for it, as the dashboard alert does', () => {
        plansHook({ supported: true });
        (useAccountingServiceAddOns as unknown as Mock).mockReturnValue({
            isLoading: false,
            addOns: [],
            updateAddOn: vi.fn(),
        });

        render(
            <MemoryRouter initialEntries={['/plans?subTab=addOns']}>
                <PlansTab
                    service={{ ...SERVICE, accessKey: 'whatsApp_for_busines' }}
                    onSaveCommission={vi.fn()}
                    onToggleCommissionConfigured={vi.fn()}
                />
            </MemoryRouter>
        );

        expect(useAccountingServiceAddOns).toHaveBeenCalledWith('whatsApp_for_busines');
    });

    it('ignores that request for a service without an Add-ons tab', () => {
        plansHook({ supported: true });

        render(
            <MemoryRouter initialEntries={['/plans?subTab=addOns']}>
                <PlansTab
                    service={SERVICE}
                    onSaveCommission={vi.fn()}
                    onToggleCommissionConfigured={vi.fn()}
                />
            </MemoryRouter>
        );

        expect(useAccountingServiceAddOns).not.toHaveBeenCalled();
    });

    it('shows no Add-ons tab for a service without add-ons', () => {
        plansHook({ supported: true });
        renderTab();

        expect(screen.queryByRole('button', { name: 'Add-ons' })).not.toBeInTheDocument();
    });
});
