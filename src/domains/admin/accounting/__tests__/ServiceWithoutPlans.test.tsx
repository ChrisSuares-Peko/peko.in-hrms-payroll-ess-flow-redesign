import '@testing-library/jest-dom/vitest';

import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { Mock, beforeEach, describe, expect, it, vi } from 'vitest';

import { useAppSelector } from '@src/hooks/store';

import { getAccountingServices } from '../api/services';
import ServiceWithoutPlans from '../pages/ServiceWithoutPlans';
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
    planType: 'without_plans',
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
        <MemoryRouter initialEntries={['/system-user/accounting/service-without-plans']}>
            <ServiceWithoutPlans />
        </MemoryRouter>
    );

describe('ServiceWithoutPlans', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        (useAppSelector as unknown as Mock).mockImplementation((selector: any) =>
            selector({ reducer: { auth: { role: 'system_user', id: 7 } } })
        );
    });

    it('lists mapped services with commission labels and status pills', async () => {
        (getAccountingServices as Mock).mockResolvedValue({
            services: [
                service({
                    configuration: {
                        plans: null,
                        serviceCommissionItems: null,
                        platformFee: { total: 3, notConfigured: 1 },
                    },
                }),
                service({
                    id: 2,
                    serviceProvider: 'Attestation',
                    accessKey: 'attestation',
                    vendor: null,
                    commissionType: null,
                    providerCommission: 0,
                    commissionConfigured: false,
                }),
                service({
                    id: 3,
                    serviceProvider: 'Old Service',
                    accessKey: 'old',
                    serviceStatus: false,
                }),
                service({
                    id: 4,
                    serviceProvider: 'Free Notary',
                    accessKey: 'notary',
                    serviceStatus: true,
                    commissionType: 'PERCENTAGE',
                    providerCommission: 0,
                    fixedCommissionPerTransaction: 0,
                    commissionConfigured: true,
                }),
            ],
            recordsTotal: 4,
            page: 1,
            itemsPerPage: 10,
        });

        renderPage();

        await waitFor(() => expect(screen.getAllByText('Airline').length).toBeGreaterThan(0));
        expect(getAccountingServices).toHaveBeenCalledWith(
            expect.objectContaining({ userId: 7, userType: 'system_user', type: 'without_plans' })
        );
        [
            'Cleartrip',
            '2.5%',
            '0%',
            'Configured',
            'Inactive',
            'Commission not configured',
            'Platform fee: 1 of 3 packages not configured',
        ].forEach(text => expect(screen.getAllByText(text).length).toBeGreaterThan(0));
        expect(screen.getAllByText('Not configured')).toHaveLength(3);
        expect(screen.queryByText('Commission missing')).not.toBeInTheDocument();
    });

    it('shows an empty state that points at the classification page when nothing is classified', async () => {
        (getAccountingServices as Mock).mockResolvedValue({
            services: [],
            recordsTotal: 0,
            page: 1,
            itemsPerPage: 10,
        });

        renderPage();

        await waitFor(() =>
            expect(
                screen.getByText(/No services are classified as service without plans yet/)
            ).toBeInTheDocument()
        );
        expect(screen.getByRole('link', { name: 'Service Classification' })).toHaveAttribute(
            'href',
            '/system-user/settings/service-classification'
        );
    });

    it('opens the service detail on the default tab when a row is clicked', async () => {
        (getAccountingServices as Mock).mockResolvedValue({
            services: [service({})],
            recordsTotal: 1,
            page: 1,
            itemsPerPage: 10,
        });

        renderPage();

        await waitFor(() => expect(screen.getAllByText('Airline').length).toBeGreaterThan(0));
        fireEvent.click(screen.getAllByText('Airline')[0]);

        expect(navigateMock).toHaveBeenCalledWith(
            '/system-user/accounting/service-without-plans/tbo_airline/commission'
        );
    });
});
