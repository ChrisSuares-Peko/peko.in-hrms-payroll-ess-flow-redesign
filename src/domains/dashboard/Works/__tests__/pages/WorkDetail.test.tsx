import { render, screen } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { describe, test, vi, beforeEach, expect, Mock } from 'vitest';

import { useDetailsApi } from '../../hooks/useDetailsApi';
import { usePlansApi } from '../../hooks/usePlansApi';
import WorkDetail from '../../pages/WorkDetail';

// Mock hooks
vi.mock('../../hooks/useDetailsApi', () => ({
    useDetailsApi: vi.fn(),
}));

vi.mock('../../hooks/usePlansApi', () => ({
    usePlansApi: vi.fn(),
}));

vi.mock('../../components/PlanCard', () => ({
    default: ({ planName }: { planName: string }) => <div data-testid="plan-card">{planName}</div>,
}));

vi.mock('antd', async importActual => {
    const actual = await importActual<typeof import('antd')>();
    return {
        ...actual,
        Skeleton: () => <div data-testid="loading-skeleton">Loading...</div>,
    };
});

describe('WorkDetail Page', () => {
    beforeEach(() => {
        vi.resetAllMocks();
    });

    const renderWithRouter = (id = '123') =>
        render(
            <MemoryRouter initialEntries={[`/work/${id}`]}>
                <Routes>
                    <Route path="/work/:id" element={<WorkDetail />} />
                </Routes>
            </MemoryRouter>
        );

    test('shows skeleton when loading work details', () => {
        (useDetailsApi as Mock).mockReturnValue({ isLoading: true, data: null });
        (usePlansApi as Mock).mockReturnValue({ isLoading: true, data: [] });

        renderWithRouter();
        expect(screen.getAllByTestId('loading-skeleton').length).toBeGreaterThan(0);
    });

    test('renders portfolio section when data is available', () => {
        (useDetailsApi as Mock).mockReturnValue({
            isLoading: false,
            data: { portfolio: ['portfolio1', 'portfolio2'] },
        });
        (usePlansApi as Mock).mockReturnValue({ isLoading: true, data: [] });

        renderWithRouter();
        expect(screen.getByText(/portfolio/i)).toBeInTheDocument();
        expect(screen.getByText(/https:\/\/dribbble.com\/pekoworks/i)).toBeInTheDocument();
    });

    test('renders "Choose a Plan" and plans when available', () => {
        (useDetailsApi as Mock).mockReturnValue({
            isLoading: false,
            data: { portfolio: ['portfolio1'] },
        });
        (usePlansApi as Mock).mockReturnValue({
            isLoading: false,
            data: [{ id: '1', name: 'Basic Plan', price: 1000 }],
        });

        renderWithRouter();
        expect(screen.getByText('Choose a Plan')).toBeInTheDocument();
        expect(screen.getByTestId('plan-card')).toHaveTextContent('Basic Plan');
    });

    test('shows Empty state when no plans are available', () => {
        (useDetailsApi as Mock).mockReturnValue({ isLoading: false, data: { portfolio: [] } });
        (usePlansApi as Mock).mockReturnValue({ isLoading: false, data: [] });

        renderWithRouter();
        expect(screen.getByText(/no plans available/i)).toBeInTheDocument();
    });

    test('displays Contact Sales section with link', () => {
        (useDetailsApi as Mock).mockReturnValue({ isLoading: false, data: { portfolio: [] } });
        (usePlansApi as Mock).mockReturnValue({ isLoading: false, data: [] });

        renderWithRouter();
        expect(screen.getByText(/for custom services/i)).toBeInTheDocument();
        const contactSalesLink = screen.getByRole('link', { name: /contact sales/i });

        expect(contactSalesLink).toHaveAttribute('href', '/need-help');
    });
});
