import '@testing-library/jest-dom/vitest';

import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { Mock, beforeEach, describe, expect, it, vi } from 'vitest';

import { showToast } from '@src/slices/apiSlice';

import AddOnsTab from '../components/serviceDetail/AddOnsTab';
import useAccountingServiceAddOns from '../hooks/useAccountingServiceAddOns';
import { AccountingService, ServiceAddOn } from '../types/services';

const dispatch = vi.fn();

vi.mock('@src/hooks/store', () => ({ useAppSelector: vi.fn(), useAppDispatch: () => dispatch }));

vi.mock('../hooks/useAccountingServiceAddOns', () => ({ default: vi.fn() }));

// The drawer's own form is covered with the plans; here it only has to hand its values back.
vi.mock('../components/serviceDetail/ConfigureCommissionDrawer', () => ({
    default: ({ title, initialValues, onSubmit }: any) => (
        <div>
            <span>{title}</span>
            <span>{`form price ${initialValues.price} mode ${initialValues.commissionMode}`}</span>
            <button
                type="button"
                onClick={() =>
                    onSubmit({
                        ...initialValues,
                        price: '150',
                        commissionMode: 'AGENT_MARKUP',
                        providerCommission: '5',
                        fixedCommissionPerTransaction: '',
                        isCommissionInclGST: true,
                    })
                }
            >
                submit drawer
            </button>
        </div>
    ),
}));

const SERVICE = {
    id: 3,
    serviceProvider: 'WhatsApp for Business',
    accessKey: 'whatsApp_for_busines',
} as AccountingService;

const BOT_BUILDER: ServiceAddOn = {
    id: 7,
    addOnType: 'BOT_BUILDER',
    planName: 'Bot Builder',
    monthlyPrice: 120,
    annualPrice: 1440,
    priceMarkup: { monthlyPrice: 0, annualPrice: 0 },
    commissionMode: null,
    commissionType: 'PERCENTAGE',
    commission: 0,
    fixedCommissionPerTransaction: 0,
    isCommissionInclGST: true,
    splitCommission: null,
    commissionConfigured: false,
};

const SHOPIFY: ServiceAddOn = {
    id: 27,
    addOnType: 'SHOPIFY_INTEGRATION',
    planName: 'Shopify Integration',
    monthlyPrice: 999,
    annualPrice: 11988,
    priceMarkup: { monthlyPrice: 99.9, annualPrice: 1198.8 },
    commissionMode: 'PRINCIPAL_MARKUP',
    commissionType: 'PERCENTAGE',
    commission: 10,
    fixedCommissionPerTransaction: 0,
    isCommissionInclGST: true,
    splitCommission: null,
    commissionConfigured: true,
};

const hook = (overrides: Record<string, unknown> = {}) =>
    (useAccountingServiceAddOns as unknown as Mock).mockReturnValue({
        isLoading: false,
        addOns: [BOT_BUILDER, SHOPIFY],
        updateAddOn: vi.fn().mockResolvedValue(true),
        toggleAddOnCommissionConfigured: vi.fn().mockResolvedValue(true),
        ...overrides,
    });

beforeEach(() => {
    vi.clearAllMocks();
});

describe('AddOnsTab', () => {
    it('lists each add-on with its commission mode', () => {
        hook();
        render(<AddOnsTab service={SERVICE} />);

        expect(useAccountingServiceAddOns).toHaveBeenCalledWith('whatsApp_for_busines');
        expect(screen.getByText('Bot Builder')).toBeInTheDocument();
        expect(screen.getByText('Shopify Integration')).toBeInTheDocument();
        expect(screen.getByText('Principal Markup')).toBeInTheDocument();
    });

    it('says so when an add-on has no commission mode yet', () => {
        hook({ addOns: [BOT_BUILDER] });
        render(<AddOnsTab service={SERVICE} />);

        expect(screen.getByText('Not configured')).toBeInTheDocument();
    });

    it('shows the price after the markup commission with what it was before, only where a markup applies', () => {
        hook();
        render(<AddOnsTab service={SERVICE} />);

        // Shopify has a markup on both its monthly and annual price; Bot Builder has none.
        expect(screen.getAllByText(/Before commission/)).toHaveLength(2);
    });

    it('saves the edited add-on and closes the drawer', async () => {
        const updateAddOn = vi.fn().mockResolvedValue(true);
        hook({ updateAddOn });
        render(<AddOnsTab service={SERVICE} />);

        fireEvent.click(screen.getAllByRole('button', { name: 'Configure' })[0]);
        expect(screen.getByText('Configure add-on — Bot Builder')).toBeInTheDocument();
        expect(screen.getByText('form price 120 mode MARGIN')).toBeInTheDocument();

        fireEvent.click(screen.getByText('submit drawer'));

        await waitFor(() =>
            expect(updateAddOn).toHaveBeenCalledWith('BOT_BUILDER', {
                price: 150,
                commissionMode: 'AGENT_MARKUP',
                commissionType: 'PERCENTAGE',
                providerCommission: 5,
                fixedCommissionPerTransaction: 0,
                isCommissionInclGST: true,
            })
        );
        await waitFor(() =>
            expect(screen.queryByText('Configure add-on — Bot Builder')).not.toBeInTheDocument()
        );
        expect(dispatch).toHaveBeenCalledWith(
            showToast({ description: 'Bot Builder saved', variant: 'success' })
        );
    });

    it('marks the commission of an add-on as configured from its tick, and refreshes the service summary', async () => {
        const toggleAddOnCommissionConfigured = vi.fn().mockResolvedValue(true);
        const onConfigurationChange = vi.fn();
        hook({ addOns: [SHOPIFY], toggleAddOnCommissionConfigured });
        render(<AddOnsTab service={SERVICE} onConfigurationChange={onConfigurationChange} />);

        fireEvent.click(screen.getByRole('button', { name: 'Expand row' }));
        fireEvent.click(await screen.findByRole('img', { name: 'check' }));

        await waitFor(() => expect(toggleAddOnCommissionConfigured).toHaveBeenCalledWith(SHOPIFY));
        expect(dispatch).toHaveBeenCalledWith(
            showToast({
                description: 'Commission marked as not configured for Shopify Integration',
                variant: 'success',
            })
        );
        expect(onConfigurationChange).toHaveBeenCalledTimes(1);
    });

    it('says so when the commission has to be saved before it can be marked configured', async () => {
        const toggleAddOnCommissionConfigured = vi.fn().mockResolvedValue(false);
        const onConfigurationChange = vi.fn();
        hook({ addOns: [BOT_BUILDER], toggleAddOnCommissionConfigured });
        render(<AddOnsTab service={SERVICE} onConfigurationChange={onConfigurationChange} />);

        fireEvent.click(screen.getByRole('button', { name: 'Expand row' }));
        fireEvent.click(await screen.findByRole('img', { name: 'close' }));

        await waitFor(() =>
            expect(dispatch).toHaveBeenCalledWith(
                showToast({
                    description: 'Failed to update commission status. Please try again.',
                    variant: 'error',
                })
            )
        );
        expect(onConfigurationChange).not.toHaveBeenCalled();
    });

    it('refreshes the service summary after a save', async () => {
        const onConfigurationChange = vi.fn();
        hook();
        render(<AddOnsTab service={SERVICE} onConfigurationChange={onConfigurationChange} />);

        fireEvent.click(screen.getAllByRole('button', { name: 'Configure' })[0]);
        fireEvent.click(screen.getByText('submit drawer'));

        await waitFor(() => expect(onConfigurationChange).toHaveBeenCalledTimes(1));
    });

    it('keeps the drawer open and says so when saving fails', async () => {
        const updateAddOn = vi.fn().mockResolvedValue(false);
        hook({ updateAddOn });
        render(<AddOnsTab service={SERVICE} />);

        fireEvent.click(screen.getAllByRole('button', { name: 'Configure' })[1]);
        fireEvent.click(screen.getByText('submit drawer'));

        await waitFor(() =>
            expect(dispatch).toHaveBeenCalledWith(
                showToast({
                    description: 'Failed to save the add-on. Please try again.',
                    variant: 'error',
                })
            )
        );
        expect(screen.getByText('Configure add-on — Shopify Integration')).toBeInTheDocument();
    });
});
