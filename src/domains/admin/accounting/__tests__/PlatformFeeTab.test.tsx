import '@testing-library/jest-dom/vitest';

import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { Mock, beforeEach, describe, expect, it, vi } from 'vitest';

import usePartnersForCorporate from '@src/domains/admin/users/hooks/usePartnersForCorporate';

import CashbacksTab from '../components/serviceDetail/CashbacksTab';
import PlatformFeeTab from '../components/serviceDetail/PlatformFeeTab';
import useAccountingServiceCashbacks from '../hooks/useAccountingServiceCashbacks';
import { AccountingService } from '../types/services';

vi.mock('@src/hooks/store', () => ({ useAppSelector: vi.fn(), useAppDispatch: () => vi.fn() }));

vi.mock('@src/domains/admin/users/hooks/usePartnersForCorporate', () => ({ default: vi.fn() }));

vi.mock('../hooks/useAccountingServiceCashbacks', () => ({ default: vi.fn() }));

const SERVICE = {
    id: 5,
    accessKey: 'visa',
    serviceProvider: 'Visa Desk',
} as AccountingService;

const renderAt = (url: string, Tab: typeof PlatformFeeTab) =>
    render(
        <MemoryRouter initialEntries={[url]}>
            <Tab service={SERVICE} />
        </MemoryRouter>
    );

const askedFor = () => (useAccountingServiceCashbacks as unknown as Mock).mock.calls[0][1];

beforeEach(() => {
    vi.clearAllMocks();
    (usePartnersForCorporate as unknown as Mock).mockReturnValue({
        partnerData: [
            { value: 'default', label: 'Default' },
            { value: 77, label: 'Gulf Reach' },
        ],
        loading: false,
        categoryDatas: [],
    });
    (useAccountingServiceCashbacks as unknown as Mock).mockReturnValue({
        isLoading: false,
        rows: [],
        count: 0,
        updateRow: vi.fn(),
        bulkUpdateRows: vi.fn(),
        refetch: vi.fn(),
    });
});

describe('Platform Fee tab', () => {
    it('asks the service page to refresh its status once a fee is marked configured', async () => {
        const toggleSurchargeConfigured = vi.fn().mockResolvedValue(true);
        (useAccountingServiceCashbacks as unknown as Mock).mockReturnValue({
            isLoading: false,
            rows: [
                {
                    id: 41,
                    createdAt: '2026-10-01T00:00:00.000Z',
                    partnerName: 'Gulf Reach',
                    packageName: 'Starter',
                    surcharge: '10.00',
                    surchargeType: 'FLAT',
                    isSurchargeConfigured: false,
                },
            ],
            count: 1,
            updateRow: vi.fn(),
            bulkUpdateRows: vi.fn(),
            toggleSurchargeConfigured,
            refetch: vi.fn(),
        });
        const onConfigurationChange = vi.fn();

        render(
            <MemoryRouter>
                <PlatformFeeTab service={SERVICE} onConfigurationChange={onConfigurationChange} />
            </MemoryRouter>
        );
        fireEvent.click(screen.getByRole('button', { name: 'Expand row' }));
        fireEvent.click(await screen.findByRole('img', { name: 'close' }));

        await waitFor(() => expect(onConfigurationChange).toHaveBeenCalledTimes(1));
        expect(toggleSurchargeConfigured).toHaveBeenCalledWith(expect.objectContaining({ id: 41 }));
    });
});

describe.each([
    ['Platform Fee', PlatformFeeTab],
    ['Cashbacks', CashbacksTab],
])('%s tab', (_, Tab) => {
    it('opens on the partner an approval fix names', () => {
        renderAt('/system-user/accounting/service-without-plans/visa/tab?partner=77', Tab);

        expect(askedFor().partnerId).toBe('77');
        expect(screen.getByTitle('Gulf Reach')).toBeInTheDocument();
    });

    it("opens on Peko's own packages for the Default tree", () => {
        renderAt('/system-user/accounting/service-without-plans/visa/tab?partner=default', Tab);

        expect(askedFor().partnerId).toBe('default');
        expect(screen.getByTitle('Default')).toBeInTheDocument();
    });

    it('lists every partner when no partner is named', () => {
        renderAt('/system-user/accounting/service-without-plans/visa/tab', Tab);

        expect(askedFor().partnerId).toBe('');
        expect(screen.getByText('Select Partner')).toBeInTheDocument();
    });
});
