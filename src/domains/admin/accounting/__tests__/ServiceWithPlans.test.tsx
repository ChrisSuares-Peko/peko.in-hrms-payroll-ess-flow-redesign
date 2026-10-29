import '@testing-library/jest-dom/vitest';

import { render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { Mock, beforeEach, describe, expect, it, vi } from 'vitest';

import { useAppSelector } from '@src/hooks/store';

import { getAccountingServices } from '../api/services';
import ServiceWithPlans from '../pages/ServiceWithPlans';
import { AccountingService } from '../types/services';

const navigateMock = vi.fn();

vi.mock('react-router-dom', async () => {
    const actual = await vi.importActual<typeof import('react-router-dom')>('react-router-dom');
    return { ...actual, useNavigate: () => navigateMock };
});

vi.mock('@src/hooks/store', () => ({
    useAppSelector: vi.fn(),
    useAppDispatch: () => vi.fn(),
}));

vi.mock('../api/services', () => ({
    getAccountingServices: vi.fn(),
    getAccountingService: vi.fn(),
    getServicesTypeConfig: vi.fn(),
}));

const service = (overrides: Partial<AccountingService>): AccountingService => ({
    id: 1,
    serviceProvider: 'Airline',
    accessKey: 'tbo_airline',
    serviceCategory: 'Travel',
    serviceStatus: true,
    serviceImage: null,
    commissionMode: 'MARGIN',
    commissionType: 'PERCENTAGE',
    providerCommission: 2.5,
    fixedCommissionPerTransaction: 0,
    isCommissionInclGST: false,
    recordJournalEntry: true,
    createdAt: '2026-09-01T00:00:00.000Z',
    vendor: {
        id: 3,
        vendorName: 'Cleartrip',
        state: null,
        gstNo: null,
        address: null,
        vendorEmail: [],
    },
    planType: 'with_plans',
    commissionConfigured: true,
    configuration: {
        plans: null,
        serviceCommissionItems: null,
        platformFee: { total: 3, notConfigured: 0 },
    },
    ...overrides,
});

const renderPage = () =>
    render(
        <MemoryRouter initialEntries={['/system-user/accounting/service-with-plans']}>
            <ServiceWithPlans />
        </MemoryRouter>
    );

describe('ServiceWithPlans', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        (useAppSelector as unknown as Mock).mockImplementation((selector: any) =>
            selector({ reducer: { auth: { role: 'system_user', id: 7 } } })
        );
    });

    it('reads each service as configured only when its plans and package fees all are', async () => {
        (getAccountingServices as Mock).mockResolvedValue({
            services: [
                service({
                    configuration: {
                        plans: { total: 12, notConfigured: 0 },
                        serviceCommissionItems: null,
                        platformFee: { total: 4, notConfigured: 0 },
                    },
                }),
                service({
                    id: 2,
                    serviceProvider: 'eSIM',
                    accessKey: 'esim_tunz',
                    configuration: {
                        plans: { total: 12, notConfigured: 3 },
                        serviceCommissionItems: null,
                        platformFee: { total: 5, notConfigured: 2 },
                    },
                }),
                service({
                    id: 3,
                    serviceProvider: 'Domain and Hosting',
                    accessKey: 'domain_and_hosting',
                    commissionConfigured: false,
                    configuration: {
                        plans: { total: 6, notConfigured: 0 },
                        serviceCommissionItems: 'domain registrations',
                        platformFee: { total: 1, notConfigured: 0 },
                    },
                }),
            ],
            recordsTotal: 3,
            page: 1,
            itemsPerPage: 10,
        });

        renderPage();

        await waitFor(() => expect(screen.getAllByText('eSIM').length).toBeGreaterThan(0));
        expect(getAccountingServices).toHaveBeenCalledWith(
            expect.objectContaining({ type: 'with_plans' })
        );
        expect(screen.getAllByText('Configured')).toHaveLength(1);
        expect(screen.getAllByText('Not configured')).toHaveLength(2);
        [
            'Commission: 3 of 12 plans not configured',
            'Platform fee: 2 of 5 packages not configured',
            'Commission for domain registrations not configured',
        ].forEach(text => expect(screen.getAllByText(text).length).toBeGreaterThan(0));
        expect(screen.queryByText('Active')).not.toBeInTheDocument();
    });
});
