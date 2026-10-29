import '@testing-library/jest-dom/vitest';

import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { Mock, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';

import { useGetbranding } from '@src/domains/admin/settings/hooks/useGetbranding';
import { useAppDispatch, useAppSelector } from '@src/hooks/store';

import { patchPartnerShare } from '../api/catalog';
import WhitelabelPartners from '../pages/WhitelabelPartners';

vi.mock('@src/hooks/store', () => ({
    useAppSelector: vi.fn(),
    useAppDispatch: vi.fn(),
}));

vi.mock('@src/domains/admin/settings/hooks/useGetbranding', () => ({
    useGetbranding: vi.fn(),
}));

vi.mock('../api/catalog', () => ({
    patchPartnerShare: vi.fn(),
    patchSubscriptionPricing: vi.fn(),
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
                                    { service: 'Whitelabel Partners', hasAccess: true, update },
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
        id: 1,
        registeredBy: '100002226',
        sharePercentage: '12.5000',
        gatewayCharge: { percentage: '1.9500', fixed: '3.0000' },
        brandingStatus: 1,
        assets: { baseUrl: 'https://gulfreach.in' },
        credential: { id: 9, name: 'Gulf Reach' },
        createdAt: '2026-09-01T00:00:00.000Z',
    },
    {
        id: 2,
        registeredBy: '100004213',
        sharePercentage: null,
        gatewayCharge: null,
        brandingStatus: 0,
        assets: null,
        credential: { id: 10, name: 'Alnoor Digital' },
        createdAt: '2026-09-02T00:00:00.000Z',
    },
];

const setRefresh = vi.fn();
const updateActiveStatus = vi.fn();
const dispatch = vi.fn();

const realGetComputedStyle = window.getComputedStyle.bind(window);
beforeAll(() => {
    window.getComputedStyle = ((element: Element) =>
        realGetComputedStyle(element)) as typeof window.getComputedStyle;
    Object.defineProperty(window, 'innerWidth', { value: 1920, writable: true });
});

const renderPage = (update: boolean) => {
    const state = stateWith(update);
    (useAppSelector as unknown as Mock).mockImplementation((selector: any) => selector(state));
    return render(
        <MemoryRouter>
            <WhitelabelPartners />
        </MemoryRouter>
    );
};

describe('WhitelabelPartners', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        (useAppDispatch as unknown as Mock).mockReturnValue(dispatch);
        (useGetbranding as Mock).mockReturnValue({
            isLoading: false,
            tableData: rows,
            count: 2,
            setRefresh,
            updateActiveStatus,
            downloadReport: vi.fn(),
        });
    });

    it('renders partner rows with domain and share', () => {
        renderPage(true);

        expect(screen.getAllByText('Gulf Reach').length).toBeGreaterThan(0);
        expect(screen.getAllByText('100002226').length).toBeGreaterThan(0);
        expect(screen.getAllByText('https://gulfreach.in').length).toBeGreaterThan(0);
        expect(screen.getAllByText('12.5%').length).toBeGreaterThan(0);
        expect(screen.getAllByText('Not set').length).toBeGreaterThan(0);
    });

    it('shows each partner’s gateway charge terms beside the share', () => {
        renderPage(true);

        expect(screen.getAllByText('Gateway Charge').length).toBeGreaterThan(0);
        expect(screen.getAllByText('1.95% + ₹ 3.00').length).toBeGreaterThan(0);
        expect(screen.getAllByText('Not set').length).toBeGreaterThanOrEqual(2);
    });

    it('disables configure and status toggles without update permission', () => {
        renderPage(false);

        screen.getAllByRole('button', { name: 'Configure' }).forEach(button => {
            expect(button).toBeDisabled();
        });
        screen.getAllByRole('switch').forEach(toggle => {
            expect(toggle).toBeDisabled();
        });
    });

    it('saves the share percentage through the partial endpoint and refreshes', async () => {
        (patchPartnerShare as Mock).mockResolvedValue({ id: 1, sharePercentage: 40 });
        renderPage(true);

        fireEvent.click(screen.getAllByRole('button', { name: 'Configure' })[0]);
        const input = await screen.findByPlaceholderText('e.g. 15');
        fireEvent.change(input, { target: { value: '40' } });
        fireEvent.click(screen.getByRole('button', { name: 'Save' }));

        await waitFor(() =>
            expect(patchPartnerShare).toHaveBeenCalledWith({
                userId: 7,
                userType: 'system_user',
                id: 1,
                sharePercentage: 40,
                gatewayCharge: { percentage: 1.95, fixed: 3 },
            })
        );
        await waitFor(() => expect(setRefresh).toHaveBeenCalledWith(true));
        expect(dispatch).toHaveBeenCalled();
    });

    it('saves the gateway charge terms with the share, and clears them when both are blanked', async () => {
        (patchPartnerShare as Mock).mockResolvedValue({ id: 1, gatewayCharge: null });
        renderPage(true);

        fireEvent.click(screen.getAllByRole('button', { name: 'Configure' })[0]);
        const percentage = await screen.findByPlaceholderText('e.g. 1.95');
        const fixed = screen.getByPlaceholderText('e.g. 3');
        expect(percentage).toHaveValue('1.95');
        expect(fixed).toHaveValue('3');

        fireEvent.change(percentage, { target: { value: '' } });
        fireEvent.change(fixed, { target: { value: '' } });
        fireEvent.click(screen.getByRole('button', { name: 'Save' }));

        await waitFor(() =>
            expect(patchPartnerShare).toHaveBeenCalledWith({
                userId: 7,
                userType: 'system_user',
                id: 1,
                sharePercentage: 12.5,
                gatewayCharge: null,
            })
        );
    });

    it('toggles the branding status through the existing hook', () => {
        renderPage(true);

        fireEvent.click(screen.getAllByRole('switch')[0]);

        expect(updateActiveStatus).toHaveBeenCalledWith({ brandingId: 1, status: false });
    });
});
