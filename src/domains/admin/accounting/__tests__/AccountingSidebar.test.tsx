import '@testing-library/jest-dom/vitest';

import { fireEvent, render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { Mock, beforeEach, describe, expect, it, vi } from 'vitest';

import { useAppSelector } from '@src/hooks/store';

import AccountingSidebar from '../components/AccountingSidebar';

const navigateMock = vi.fn();

vi.mock('react-router-dom', async () => {
    const actual = await vi.importActual<typeof import('react-router-dom')>('react-router-dom');
    return { ...actual, useNavigate: () => navigateMock };
});

vi.mock('@src/hooks/store', () => ({
    useAppSelector: vi.fn(),
}));

const withAccounting = (groups: any[], hasAccess = true) => ({
    reducer: {
        services: {
            services: {
                data: [{ serviceCategory: 'Accounting', hasAccess, services: groups }],
            },
        },
    },
});

const renderSidebar = (route = '/system-user/accounting', onNavigate?: () => void) =>
    render(
        <MemoryRouter initialEntries={[route]}>
            <AccountingSidebar onNavigate={onNavigate} />
        </MemoryRouter>
    );

describe('AccountingSidebar', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('shows Dashboard, only the granted items, and the back link', () => {
        (useAppSelector as unknown as Mock).mockImplementation((selector: any) =>
            selector(
                withAccounting([
                    {
                        category: 'Operations',
                        hasAccess: true,
                        services: [
                            { service: 'Order Journals', hasAccess: true },
                            { service: 'Chart of Accounts', hasAccess: false },
                        ],
                    },
                    {
                        category: 'Ledgers',
                        hasAccess: true,
                        services: [{ service: 'Vendors', hasAccess: false }],
                    },
                ])
            )
        );

        renderSidebar();

        expect(screen.getByText('Dashboard')).toBeInTheDocument();
        expect(screen.getByText('Order Journals')).toBeInTheDocument();
        expect(screen.queryByText('Chart of Accounts')).not.toBeInTheDocument();
        expect(screen.queryByText('Vendors')).not.toBeInTheDocument();
        expect(screen.getByText('Back to Admin')).toBeInTheDocument();
        expect(document.querySelectorAll('.ant-menu-item-divider')).toHaveLength(1);
    });

    it('shows the empty state when the category is granted but no leaf is', () => {
        (useAppSelector as unknown as Mock).mockImplementation((selector: any) =>
            selector(withAccounting([]))
        );

        renderSidebar();

        expect(
            screen.getByText('No accounting services are enabled for your role.')
        ).toBeInTheDocument();
        expect(document.querySelectorAll('.ant-menu-item-divider')).toHaveLength(0);
    });

    it('navigates to the leaf route and closes the drawer on click', () => {
        (useAppSelector as unknown as Mock).mockImplementation((selector: any) =>
            selector(
                withAccounting([
                    {
                        category: 'Others',
                        hasAccess: true,
                        services: [{ service: 'Approvals', hasAccess: true }],
                    },
                ])
            )
        );
        const onNavigate = vi.fn();

        renderSidebar('/system-user/accounting', onNavigate);
        fireEvent.click(screen.getByText('Approvals'));

        expect(navigateMock).toHaveBeenCalledWith('/system-user/accounting/approvals');
        expect(onNavigate).toHaveBeenCalledTimes(1);
    });

    it('highlights the parent list item on a service detail URL', () => {
        (useAppSelector as unknown as Mock).mockImplementation((selector: any) =>
            selector(
                withAccounting([
                    {
                        category: 'Operations',
                        hasAccess: true,
                        services: [{ service: 'Service with plans', hasAccess: true }],
                    },
                ])
            )
        );

        renderSidebar('/system-user/accounting/service-with-plans/esim/plans');

        const selected = document.querySelector('.ant-menu-item-selected');
        expect(selected).toHaveTextContent('Service with plans');
    });

    it('renders an icon-only rail when collapsed', () => {
        (useAppSelector as unknown as Mock).mockImplementation((selector: any) =>
            selector(
                withAccounting([
                    {
                        category: 'Operations',
                        hasAccess: true,
                        services: [{ service: 'Service with plans', hasAccess: true }],
                    },
                ])
            )
        );

        render(
            <MemoryRouter
                initialEntries={['/system-user/accounting/service-with-plans/esim/plans']}
            >
                <AccountingSidebar collapsed />
            </MemoryRouter>
        );

        expect(document.querySelector('.ant-menu-inline-collapsed')).not.toBeNull();
        expect(screen.getByAltText('logo')).toHaveAttribute('width', '48');
        expect(screen.queryByText('Accounting')).not.toBeInTheDocument();
    });

    it('sends Back to Admin to the admin dashboard', () => {
        (useAppSelector as unknown as Mock).mockImplementation((selector: any) =>
            selector(withAccounting([]))
        );

        renderSidebar();
        fireEvent.click(screen.getByText('Back to Admin'));

        expect(navigateMock).toHaveBeenCalledWith('/system-user/dashboard');
    });
});
