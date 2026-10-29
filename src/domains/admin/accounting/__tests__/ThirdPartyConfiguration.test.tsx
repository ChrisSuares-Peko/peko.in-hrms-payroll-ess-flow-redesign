import '@testing-library/jest-dom/vitest';

import { fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { Mock, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';

import { useAppDispatch, useAppSelector } from '@src/hooks/store';

import {
    deleteCorporatePaymentLinkCharge,
    getPaymentLinkCharges,
    putCorporatePaymentLinkCharge,
    putDefaultPaymentLinkCharge,
} from '../api/thirdPartyConfiguration';
import ThirdPartyConfiguration from '../pages/ThirdPartyConfiguration';

vi.mock('@src/hooks/store', () => ({
    useAppSelector: vi.fn(),
    useAppDispatch: vi.fn(),
}));

vi.mock('../api/thirdPartyConfiguration', () => ({
    getPaymentLinkCharges: vi.fn(),
    putDefaultPaymentLinkCharge: vi.fn(),
    putCorporatePaymentLinkCharge: vi.fn(),
    deleteCorporatePaymentLinkCharge: vi.fn(),
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
                                    {
                                        service: 'Third Party Configuration',
                                        hasAccess: true,
                                        update,
                                    },
                                ],
                            },
                        ],
                    },
                ],
            },
        },
    },
});

const DEFAULT_CHARGE = {
    percentage: 1.5,
    fixed: 3,
    updatedAt: '2026-10-28T06:00:00.000Z',
    recordedByName: 'Asha',
};

const CUSTOM = {
    credentialId: 99,
    corporate: { name: 'Acme Traders', username: 'acme', partnerId: null },
    onboarding: { status: 'active', provider: 'nupay', activatedAt: '2026-09-01T00:00:00.000Z' },
    charge: {
        percentage: 0.9,
        fixed: 0,
        updatedAt: '2026-10-27T10:00:00.000Z',
        recordedByName: 'Ravi',
    },
    effective: { percentage: 0.9, fixed: 0, source: 'custom' },
};

const ON_DEFAULT = {
    credentialId: 100,
    corporate: { name: 'Beta Stores', username: 'beta', partnerId: null },
    onboarding: { status: 'approval-pending', provider: 'decentro', activatedAt: null },
    charge: null,
    effective: { percentage: 1.5, fixed: 3, source: 'default' },
};

const RESPONSE = {
    defaultCharge: DEFAULT_CHARGE,
    corporates: [CUSTOM, ON_DEFAULT],
    recordsTotal: 2,
    customTotal: 1,
    page: 1,
    itemsPerPage: 10,
};

const PAGE = '/system-user/accounting/third-party-configuration';

const dispatch = vi.fn();

const fetchCount = () => (getPaymentLinkCharges as Mock).mock.calls.length;

vi.setConfig({ testTimeout: 20000 });

const realGetComputedStyle = window.getComputedStyle.bind(window);

beforeAll(() => {
    window.getComputedStyle = ((element: Element) =>
        realGetComputedStyle(element)) as typeof window.getComputedStyle;
    Object.defineProperty(window, 'innerWidth', { value: 2400, writable: true });
});

beforeEach(() => {
    vi.clearAllMocks();
    (useAppDispatch as unknown as Mock).mockReturnValue(dispatch);
    (getPaymentLinkCharges as Mock).mockResolvedValue(RESPONSE);
});

const renderAt = (path = `${PAGE}/payment-links`, update = true) => {
    const state = stateWith(update);
    (useAppSelector as unknown as Mock).mockImplementation((selector: any) => selector(state));
    return render(
        <MemoryRouter initialEntries={[path]}>
            <Routes>
                <Route path={`${PAGE}/:tab?`} element={<ThirdPartyConfiguration />} />
            </Routes>
        </MemoryRouter>
    );
};

const rowOf = async (text: string) => (await screen.findByText(text)).closest('tr') as HTMLElement;

describe('ThirdPartyConfiguration', () => {
    it('opens on the Payment Links tab, shows the default charge and lists every corporate with its source', async () => {
        renderAt(PAGE);

        const custom = await rowOf('Acme Traders');
        expect(screen.getByText('Payment Links', { selector: 'button span' })).toBeInTheDocument();
        expect(screen.getByText('Default charge')).toBeInTheDocument();
        const card = screen.getByText('Default charge').closest('.ant-card') as HTMLElement;
        expect(within(card).getByText('1.5% + ₹ 3.00')).toBeInTheDocument();
        expect(screen.getByText(/Last set 28 Oct 2026 by Asha/)).toBeInTheDocument();
        expect(
            screen.getByText(/1 of 2 listed corporates carry a custom charge/)
        ).toBeInTheDocument();

        expect(within(custom).getByText('acme')).toBeInTheDocument();
        expect(within(custom).getByText('Active')).toBeInTheDocument();
        expect(within(custom).getByText('NuPay')).toBeInTheDocument();
        expect(within(custom).getByText('0.9%')).toBeInTheDocument();
        expect(within(custom).getByText('Custom')).toBeInTheDocument();
        expect(within(custom).getByText('27 Oct 2026')).toBeInTheDocument();
        expect(within(custom).getByText('by Ravi')).toBeInTheDocument();
        expect(within(custom).getByText('Edit')).toBeInTheDocument();
        expect(within(custom).getByText('Use default')).toBeInTheDocument();

        const onDefault = await rowOf('Beta Stores');
        expect(within(onDefault).getByText('Approval pending')).toBeInTheDocument();
        expect(within(onDefault).getByText('Decentro')).toBeInTheDocument();
        expect(within(onDefault).getByText('1.5% + ₹ 3.00')).toBeInTheDocument();
        expect(within(onDefault).getByText('Default')).toBeInTheDocument();
        expect(within(onDefault).getByText('—')).toBeInTheDocument();
        expect(within(onDefault).getByText('Set custom charge')).toBeInTheDocument();

        expect(getPaymentLinkCharges).toHaveBeenCalledWith(
            expect.objectContaining({ userId: 7, userType: 'system_user', scope: 'all', page: 1 })
        );
    });

    it('says Not set everywhere while no default has been recorded', async () => {
        (getPaymentLinkCharges as Mock).mockResolvedValue({
            ...RESPONSE,
            defaultCharge: null,
            corporates: [
                { ...ON_DEFAULT, effective: { percentage: null, fixed: null, source: 'none' } },
            ],
            recordsTotal: 1,
            customTotal: 0,
        });
        renderAt();

        const row = await rowOf('Beta Stores');
        expect(screen.getAllByText('Not set').length).toBeGreaterThanOrEqual(2);
        expect(screen.getByText('Set default')).toBeInTheDocument();
        expect(
            within(row).getByText('Not set', { selector: 'span.inline-flex' })
        ).toBeInTheDocument();
    });

    it('asks for the custom charges only when that scope is picked', async () => {
        renderAt();
        await screen.findByText('Acme Traders');

        fireEvent.mouseDown(screen.getByText('All corporates'));
        fireEvent.click(await screen.findByText('Custom charges only'));

        await waitFor(() =>
            expect(getPaymentLinkCharges).toHaveBeenLastCalledWith(
                expect.objectContaining({ scope: 'custom', page: 1 })
            )
        );
    });

    it('saves the default charge from the card', async () => {
        (putDefaultPaymentLinkCharge as Mock).mockResolvedValue({ defaultCharge: DEFAULT_CHARGE });
        renderAt();
        await screen.findByText('Acme Traders');

        fireEvent.click(screen.getByText('Edit default'));
        expect(await screen.findByText('Default payment link charge')).toBeInTheDocument();
        const percentage = screen.getByPlaceholderText('e.g. 1.5') as HTMLInputElement;
        const fixed = screen.getByPlaceholderText('e.g. 3') as HTMLInputElement;
        expect(percentage.value).toBe('1.5');
        expect(fixed.value).toBe('3');
        fireEvent.change(percentage, { target: { value: '2' } });
        fireEvent.change(fixed, { target: { value: '0' } });
        const fetches = fetchCount();
        fireEvent.click(screen.getByText('Save'));

        await waitFor(() =>
            expect(putDefaultPaymentLinkCharge).toHaveBeenCalledWith({
                userId: 7,
                userType: 'system_user',
                percentage: 2,
                fixed: 0,
            })
        );
        await waitFor(() => expect(fetchCount()).toBe(fetches + 1));
        expect(dispatch).toHaveBeenCalled();
    });

    it('gives a corporate on the default its own charge, starting from the default figures', async () => {
        (putCorporatePaymentLinkCharge as Mock).mockResolvedValue({ credentialId: 100 });
        renderAt();
        const row = await rowOf('Beta Stores');

        fireEvent.click(within(row).getByText('Set custom charge'));
        expect(await screen.findByText('Payment link charge for Beta Stores')).toBeInTheDocument();
        expect(screen.getByText(/Starts from the default charge/)).toBeInTheDocument();
        const percentage = screen.getByPlaceholderText('e.g. 1.5') as HTMLInputElement;
        expect(percentage.value).toBe('1.5');
        fireEvent.change(percentage, { target: { value: '0.75' } });
        fireEvent.click(screen.getByText('Save'));

        await waitFor(() =>
            expect(putCorporatePaymentLinkCharge).toHaveBeenCalledWith({
                userId: 7,
                userType: 'system_user',
                credentialId: 100,
                percentage: 0.75,
                fixed: 3,
            })
        );
    });

    it('puts a corporate back on the default after confirming', async () => {
        (deleteCorporatePaymentLinkCharge as Mock).mockResolvedValue({ credentialId: 99 });
        renderAt();
        const row = await rowOf('Acme Traders');

        const fetches = fetchCount();
        fireEvent.click(within(row).getByText('Use default'));
        fireEvent.click(
            await screen.findByText('Use default', {
                selector: '.ant-popconfirm-buttons button span',
            })
        );

        await waitFor(() =>
            expect(deleteCorporatePaymentLinkCharge).toHaveBeenCalledWith({
                userId: 7,
                userType: 'system_user',
                credentialId: 99,
            })
        );
        await waitFor(() => expect(fetchCount()).toBe(fetches + 1));
    });

    it('refuses a negative or over-sized charge before it is sent', async () => {
        renderAt();
        await screen.findByText('Acme Traders');

        fireEvent.click(screen.getByText('Edit default'));
        await screen.findByText('Default payment link charge');
        fireEvent.change(screen.getByPlaceholderText('e.g. 1.5'), { target: { value: '101' } });
        fireEvent.click(screen.getByText('Save'));

        expect(await screen.findByText('Cannot exceed 100')).toBeInTheDocument();
        expect(putDefaultPaymentLinkCharge).not.toHaveBeenCalled();
    });

    it('shows everything but lets nothing be changed without the update permission', async () => {
        renderAt(`${PAGE}/payment-links`, false);
        const row = await rowOf('Acme Traders');

        expect(screen.getByText('Edit default').closest('button')).toBeDisabled();
        expect(within(row).getByText('Edit').closest('button')).toBeDisabled();
        expect(within(row).getByText('Use default').closest('button')).toBeDisabled();
    });
});
