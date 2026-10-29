import '@testing-library/jest-dom/vitest';

import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { Mock, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';

import usePartnersForCorporate from '@src/domains/admin/users/hooks/usePartnersForCorporate';
import { useAppDispatch, useAppSelector } from '@src/hooks/store';

import { patchSubscriptionPricing, patchSubscriptionPricingBulk } from '../api/catalog';
import usePekoSubscriptionAddons from '../hooks/usePekoSubscriptionAddons';
import useSubscriptionPackages from '../hooks/useSubscriptionPackages';
import PekoSubscriptions, { OTHERS_INTRO, PLANS_INTRO } from '../pages/PekoSubscriptions';

vi.mock('@src/hooks/store', () => ({
    useAppSelector: vi.fn(),
    useAppDispatch: vi.fn(),
}));

vi.mock('../hooks/useSubscriptionPackages', () => ({ default: vi.fn() }));

vi.mock('@src/domains/admin/users/hooks/usePartnersForCorporate', () => ({ default: vi.fn() }));

vi.mock('../hooks/usePekoSubscriptionAddons', () => ({ default: vi.fn() }));

vi.mock('../api/catalog', () => ({
    patchPartnerShare: vi.fn(),
    patchSubscriptionPricing: vi.fn(),
    patchSubscriptionPricingBulk: vi.fn(),
}));

const stateWith = (update: boolean) => ({
    reducer: {
        auth: { role: 'system_user', id: 7 },
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
                                services: [
                                    { service: 'Peko Subscriptions', hasAccess: true, update },
                                ],
                            },
                        ],
                    },
                ],
            },
        },
    },
});

const rows = [
    {
        id: 11,
        packageName: 'Peko Pro',
        accessCode: 'pro',
        partnerName: '',
        partnerId: null,
        packagePrices: { monthly: '1,499.00', annually: '14,990.00' },
        discount: { monthly: '0', annually: '1,499.00' },
        status: 1,
        type: '1',
        description: '',
        serviceList: '',
        packageLogo: '',
        priorityLevel: null,
    },
];

const addonRows = [
    {
        packageId: 109,
        cashbackId: 583,
        packageName: 'Payroll',
        serviceProvider: 'Payroll',
        accessKey: 'peko_payroll',
        partnerName: '',
        partnerId: null,
        serviceOperatorId: 67,
        cashbackType: 'FLAT',
        cashback: '0',
        surchargeType: 'FLAT',
        surcharge: '0',
        unitPrice: '20.00',
        baseLimit: '10.00',
    },
    {
        packageId: 8,
        cashbackId: null,
        packageName: 'eSign',
        serviceProvider: 'E Sign',
        accessKey: null,
        partnerName: '',
        partnerId: null,
        serviceOperatorId: 64,
        cashbackType: null,
        cashback: null,
        surchargeType: null,
        surcharge: null,
        unitPrice: null,
        baseLimit: null,
    },
];

const otherRows = [
    {
        packageId: 170,
        cashbackId: 2265,
        packageName: 'Corporate cards',
        serviceProvider: 'Corporate Cards',
        accessKey: 'corporate_cards',
        partnerName: '',
        partnerId: null,
        serviceOperatorId: 176,
        cashbackType: 'PERCENTAGE',
        cashback: '0',
        surchargeType: 'PERCENTAGE',
        surcharge: '0',
        unitPrice: '290.00',
        baseLimit: '2.00',
    },
    {
        packageId: 185,
        cashbackId: null,
        packageName: 'Corporate cards',
        serviceProvider: 'Corporate Cards',
        accessKey: 'corporate_cards',
        partnerName: 'Airpay',
        partnerId: 2015,
        serviceOperatorId: 176,
        cashbackType: null,
        cashback: null,
        surchargeType: null,
        surcharge: null,
        unitPrice: null,
        baseLimit: null,
    },
];

const handleRefresh = vi.fn();
const updateActiveStatus = vi.fn();
const saveRow = vi.fn();
const bulkSaveRows = vi.fn();
const saveOtherRow = vi.fn();
const bulkSaveOtherRows = vi.fn();
const dispatch = vi.fn();

const addonListsByKind = () =>
    (usePekoSubscriptionAddons as Mock).mockImplementation((filters: { kind?: string }) =>
        filters.kind === 'others'
            ? {
                  isLoading: false,
                  rows: otherRows,
                  count: 2,
                  saveRow: saveOtherRow,
                  bulkSaveRows: bulkSaveOtherRows,
              }
            : { isLoading: false, rows: addonRows, count: 2, saveRow, bulkSaveRows }
    );

const realGetComputedStyle = window.getComputedStyle.bind(window);
beforeAll(() => {
    window.getComputedStyle = ((element: Element) =>
        realGetComputedStyle(element)) as typeof window.getComputedStyle;
});

const renderPage = (update: boolean) => {
    const state = stateWith(update);
    (useAppSelector as unknown as Mock).mockImplementation((selector: any) => selector(state));
    return render(
        <MemoryRouter>
            <PekoSubscriptions />
        </MemoryRouter>
    );
};

describe('PekoSubscriptions', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        (useAppDispatch as unknown as Mock).mockReturnValue(dispatch);
        (useSubscriptionPackages as Mock).mockReturnValue({
            isLoading: false,
            rows,
            count: 1,
            updateActiveStatus,
            handleRefresh,
        });
        (usePartnersForCorporate as Mock).mockReturnValue({
            partnerData: [
                { value: 'default', label: 'Default' },
                { value: 5, label: 'Gulf Reach' },
            ],
        });
        addonListsByKind();
    });

    it('offers the subscription, add-on and other item tabs, with no tab of their own for Corporate Cards', () => {
        renderPage(true);

        expect(screen.getByText('Peko Subscription')).toBeInTheDocument();
        expect(screen.getByText('Peko Subscription Add-ons')).toBeInTheDocument();
        expect(screen.getByText('Others')).toBeInTheDocument();
        expect(screen.queryByText('Corporate Cards')).not.toBeInTheDocument();
        expect(usePekoSubscriptionAddons).toHaveBeenCalledWith(
            expect.objectContaining({ kind: 'others' })
        );
        expect(
            (usePekoSubscriptionAddons as Mock).mock.calls.some(
                ([filters]) => filters.kind === undefined
            )
        ).toBe(true);
    });

    it('renders subscriptions with rupee pricing and the default partner label', () => {
        renderPage(true);

        expect(screen.getAllByText('Peko Pro').length).toBeGreaterThan(0);
        expect(screen.getAllByText('Default').length).toBeGreaterThan(0);
        expect(screen.getAllByText('₹ 1,499.00').length).toBeGreaterThan(0);
        expect(screen.getAllByText('₹ 14,990.00').length).toBeGreaterThan(0);
        expect(screen.getAllByText('₹ 0.00 / mo · ₹ 1,499.00 / yr').length).toBeGreaterThan(0);
    });

    it('requests the subscription packages with the initial filters', () => {
        renderPage(true);

        expect(useSubscriptionPackages).toHaveBeenCalledWith(
            expect.objectContaining({ page: 1, itemsPerPage: 10, partnerId: '' })
        );
    });

    it('disables configure and status toggles without update permission', () => {
        renderPage(false);

        expect(screen.getAllByRole('button', { name: 'Configure' })[0]).toBeDisabled();
        expect(screen.getAllByRole('switch')[0]).toBeDisabled();
    });

    it('saves prices and discounts as numbers through the partial endpoint', async () => {
        (patchSubscriptionPricing as Mock).mockResolvedValue({ id: 11 });
        renderPage(true);

        fireEvent.click(screen.getAllByRole('button', { name: 'Configure' })[0]);
        const inputs = await screen.findAllByPlaceholderText('0.00');
        fireEvent.change(inputs[0], { target: { value: '1599' } });
        fireEvent.change(inputs[1], { target: { value: '100' } });
        fireEvent.click(screen.getByRole('button', { name: 'Save' }));

        await waitFor(() =>
            expect(patchSubscriptionPricing).toHaveBeenCalledWith({
                userId: 7,
                userType: 'system_user',
                id: 11,
                packagePrices: { monthly: 1599, annually: 14990 },
                discount: { monthly: 100, annually: 1499 },
            })
        );
        await waitFor(() => expect(handleRefresh).toHaveBeenCalled());
    });

    it('bulk-applies pricing to every selected subscription', async () => {
        (patchSubscriptionPricingBulk as Mock).mockResolvedValue({ ids: [11] });
        renderPage(true);

        fireEvent.click(screen.getByRole('button', { name: 'Bulk configure' }));
        const [, rowCheckbox] = screen.getAllByRole('checkbox');
        fireEvent.click(rowCheckbox);
        fireEvent.click(screen.getByRole('button', { name: 'Configure 1 selected' }));

        const inputs = await screen.findAllByPlaceholderText('0.00');
        fireEvent.change(inputs[0], { target: { value: '999' } });
        fireEvent.change(inputs[1], { target: { value: '50' } });
        fireEvent.change(inputs[2], { target: { value: '9990' } });
        fireEvent.change(inputs[3], { target: { value: '990' } });
        fireEvent.click(screen.getByRole('button', { name: 'Save' }));

        await waitFor(() =>
            expect(patchSubscriptionPricingBulk).toHaveBeenCalledWith({
                userId: 7,
                userType: 'system_user',
                ids: [11],
                packagePrices: { monthly: 999, annually: 9990 },
                discount: { monthly: 50, annually: 990 },
            })
        );
        await waitFor(() => expect(handleRefresh).toHaveBeenCalled());
    });

    it('disables bulk configure without update permission', () => {
        renderPage(false);

        expect(screen.getByRole('button', { name: 'Bulk configure' })).toBeDisabled();
    });

    it('toggles the package status through the existing hook', () => {
        renderPage(true);

        fireEvent.click(screen.getAllByRole('switch')[0]);

        expect(updateActiveStatus).toHaveBeenCalledWith({ packageId: 11, status: false });
    });
});

describe('PekoSubscriptions — the Add-ons tab', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        (useAppDispatch as unknown as Mock).mockReturnValue(dispatch);
        (useSubscriptionPackages as Mock).mockReturnValue({
            isLoading: false,
            rows,
            count: 1,
            updateActiveStatus,
            handleRefresh,
        });
        (usePartnersForCorporate as Mock).mockReturnValue({
            partnerData: [
                { value: 'default', label: 'Default' },
                { value: 5, label: 'Gulf Reach' },
            ],
        });
        addonListsByKind();
    });

    const openAddonsTab = (update: boolean) => {
        renderPage(update);
        fireEvent.click(screen.getByText('Peko Subscription Add-ons'));
    };

    it('shows every eligible package, including ones never configured before', () => {
        openAddonsTab(true);

        expect(screen.getAllByText('Payroll').length).toBeGreaterThan(0);
        expect(screen.getByText('peko_payroll')).toBeInTheDocument();
        expect(screen.getByText('₹ 20.00')).toBeInTheDocument();
        expect(screen.getByText('10.00')).toBeInTheDocument();
        expect(screen.getAllByText('eSign').length).toBeGreaterThan(0);
        expect(screen.queryByText('Corporate Cards')).not.toBeInTheDocument();
        expect(screen.queryByText('corporate_cards')).not.toBeInTheDocument();
        expect(usePekoSubscriptionAddons).toHaveBeenCalledWith(
            expect.objectContaining({ page: 1, itemsPerPage: 10, partnerId: '' })
        );
    });

    it('saves unit price and base limit for an already-configured row', async () => {
        saveRow.mockResolvedValue(true);
        openAddonsTab(true);

        fireEvent.click(screen.getAllByRole('button', { name: 'Configure' })[0]);
        const inputs = await screen.findAllByPlaceholderText('0.00');
        fireEvent.change(inputs[0], { target: { value: '25' } });
        fireEvent.change(inputs[1], { target: { value: '15' } });
        fireEvent.click(screen.getByRole('button', { name: 'Save' }));

        await waitFor(() =>
            expect(saveRow).toHaveBeenCalledWith(addonRows[0], {
                unitPrice: '25',
                baseLimit: '15',
            })
        );
    });

    it('creates pricing for a never-configured row from the same Configure action', async () => {
        saveRow.mockResolvedValue(true);
        openAddonsTab(true);

        fireEvent.click(screen.getAllByRole('button', { name: 'Configure' })[1]);
        const inputs = await screen.findAllByPlaceholderText('0.00');
        fireEvent.change(inputs[0], { target: { value: '40' } });
        fireEvent.change(inputs[1], { target: { value: '5' } });
        fireEvent.click(screen.getByRole('button', { name: 'Save' }));

        await waitFor(() =>
            expect(saveRow).toHaveBeenCalledWith(addonRows[1], {
                unitPrice: '40',
                baseLimit: '5',
            })
        );
    });

    it('bulk-applies unit price and base limit to every selected subscription', async () => {
        bulkSaveRows.mockResolvedValue(true);
        openAddonsTab(true);

        fireEvent.click(screen.getByRole('button', { name: 'Bulk configure' }));
        const [, rowCheckbox] = screen.getAllByRole('checkbox');
        fireEvent.click(rowCheckbox);
        fireEvent.click(screen.getByRole('button', { name: 'Configure 1 selected' }));

        const inputs = await screen.findAllByPlaceholderText('0.00');
        fireEvent.change(inputs[0], { target: { value: '30' } });
        fireEvent.change(inputs[1], { target: { value: '20' } });
        fireEvent.click(screen.getByRole('button', { name: 'Save' }));

        await waitFor(() =>
            expect(bulkSaveRows).toHaveBeenCalledWith([addonRows[0]], {
                unitPrice: '30',
                baseLimit: '20',
            })
        );
    });

    it('disables configure and bulk configure on the add-ons tab without update permission', () => {
        openAddonsTab(false);

        expect(screen.getAllByRole('button', { name: 'Configure' })[0]).toBeDisabled();
        expect(screen.getByRole('button', { name: 'Bulk configure' })).toBeDisabled();
    });
});

describe('PekoSubscriptions — Peko’s own service packages on the plans tab', () => {
    const commercePro = {
        ...rows[0],
        id: 40,
        packageName: 'Commerce Pro',
        accessCode: 'ecommerce_store',
        type: '2',
        serviceName: 'Peko Commerce',
        packagePrices: { monthly: '2,999.00', annually: '29,990.00' },
    };

    beforeEach(() => {
        vi.clearAllMocks();
        (useAppDispatch as unknown as Mock).mockReturnValue(dispatch);
        (useSubscriptionPackages as Mock).mockReturnValue({
            isLoading: false,
            rows: [...rows, commercePro],
            count: 2,
            updateActiveStatus,
            handleRefresh,
        });
        (usePartnersForCorporate as Mock).mockReturnValue({ partnerData: [] });
        addonListsByKind();
    });

    it('lists them beside the plans in the same tab, naming the service under each', () => {
        renderPage(true);

        expect(screen.getByText(PLANS_INTRO)).toBeInTheDocument();
        expect(screen.getAllByText('Peko Pro').length).toBeGreaterThan(0);
        expect(screen.getByText('pro')).toBeInTheDocument();
        expect(screen.getAllByText('Commerce Pro').length).toBeGreaterThan(0);
        expect(screen.getByText('Peko Commerce · ecommerce_store')).toBeInTheDocument();
        expect(screen.queryByText('Peko Service Subscriptions')).not.toBeInTheDocument();
    });

    it('prices one of them through the same pricing call', async () => {
        (patchSubscriptionPricing as Mock).mockResolvedValue({ id: 40 });
        renderPage(true);

        fireEvent.click(screen.getAllByRole('button', { name: 'Configure' })[1]);
        const inputs = await screen.findAllByPlaceholderText('0.00');
        fireEvent.change(inputs[0], { target: { value: '3499' } });
        fireEvent.click(screen.getByRole('button', { name: 'Save' }));

        await waitFor(() =>
            expect(patchSubscriptionPricing).toHaveBeenCalledWith(
                expect.objectContaining({
                    id: 40,
                    packagePrices: { monthly: 3499, annually: 29990 },
                })
            )
        );
        await waitFor(() => expect(handleRefresh).toHaveBeenCalled());
    });

    it('switches one of them on or off like any plan', () => {
        renderPage(true);

        fireEvent.click(screen.getAllByRole('switch')[1]);

        expect(updateActiveStatus).toHaveBeenCalledWith({ packageId: 40, status: false });
    });
});

describe('PekoSubscriptions — the Others tab', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        (useAppDispatch as unknown as Mock).mockReturnValue(dispatch);
        (useSubscriptionPackages as Mock).mockReturnValue({
            isLoading: false,
            rows,
            count: 1,
            updateActiveStatus,
            handleRefresh,
        });
        (usePartnersForCorporate as Mock).mockReturnValue({ partnerData: [] });
        addonListsByKind();
    });

    const openOthersTab = (update: boolean) => {
        renderPage(update);
        fireEvent.click(screen.getByText('Others'));
    };

    it('lists one-time items priced per plan, such as extra Corporate Cards, with what each plan includes', () => {
        openOthersTab(true);

        expect(screen.getByText(OTHERS_INTRO)).toBeInTheDocument();
        expect(screen.getAllByText('Corporate Cards').length).toBeGreaterThan(0);
        expect(screen.getAllByText('corporate_cards').length).toBeGreaterThan(0);
        expect(screen.getByText('₹ 290.00')).toBeInTheDocument();
        expect(screen.getByText('2.00')).toBeInTheDocument();
        expect(screen.getByText('Airpay')).toBeInTheDocument();
        expect(screen.queryByText('Payroll')).not.toBeInTheDocument();
    });

    it('prices an item through its own list, with both price and included count, leaving the add-ons alone', async () => {
        saveOtherRow.mockResolvedValue(true);
        openOthersTab(true);

        fireEvent.click(screen.getAllByRole('button', { name: 'Configure' })[0]);
        const inputs = await screen.findAllByPlaceholderText('0.00');
        expect(inputs).toHaveLength(2);
        fireEvent.change(inputs[0], { target: { value: '350' } });
        fireEvent.change(inputs[1], { target: { value: '3' } });
        fireEvent.click(screen.getByRole('button', { name: 'Save' }));

        await waitFor(() =>
            expect(saveOtherRow).toHaveBeenCalledWith(otherRows[0], {
                unitPrice: '350',
                baseLimit: '3',
            })
        );
        expect(saveRow).not.toHaveBeenCalled();
    });

    it('bulk-applies a price to the selected items through their own list', async () => {
        bulkSaveOtherRows.mockResolvedValue(true);
        openOthersTab(true);

        fireEvent.click(screen.getByRole('button', { name: 'Bulk configure' }));
        const [, rowCheckbox] = screen.getAllByRole('checkbox');
        fireEvent.click(rowCheckbox);
        fireEvent.click(screen.getByRole('button', { name: 'Configure 1 selected' }));

        const inputs = await screen.findAllByPlaceholderText('0.00');
        fireEvent.change(inputs[0], { target: { value: '300' } });
        fireEvent.change(inputs[1], { target: { value: '2' } });
        fireEvent.click(screen.getByRole('button', { name: 'Save' }));

        await waitFor(() =>
            expect(bulkSaveOtherRows).toHaveBeenCalledWith([otherRows[0]], {
                unitPrice: '300',
                baseLimit: '2',
            })
        );
        expect(bulkSaveRows).not.toHaveBeenCalled();
    });

    it('disables configure and bulk configure on the Others tab without update permission', () => {
        openOthersTab(false);

        expect(screen.getAllByRole('button', { name: 'Configure' })[0]).toBeDisabled();
        expect(screen.getByRole('button', { name: 'Bulk configure' })).toBeDisabled();
    });
});
