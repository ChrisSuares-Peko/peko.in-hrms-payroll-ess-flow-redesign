import { render, screen, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { describe, test, vi, beforeEach, expect, Mock } from 'vitest';

import { useListingApi } from '../../hooks/useListingApi';
import WorksList from '../../pages/WorksList';

vi.mock('../../hooks/useListingApi', () => ({
    useListingApi: vi.fn(),
}));

vi.mock('antd', async importActual => {
    const actual = await importActual<typeof import('antd')>();
    return {
        ...actual,
        Skeleton: ({ active, className }: { active: boolean; className?: string }) =>
            active ? <div data-testid="loading-skeleton" className={className} /> : null,
    };
});

const renderWithRouter = () =>
    render(
        <BrowserRouter>
            <WorksList />
        </BrowserRouter>
    );

describe('WorksList Component', () => {
    beforeEach(() => {
        vi.resetAllMocks();
    });

    test('renders WorksHeader component', async () => {
        (useListingApi as Mock).mockReturnValue({
            data: [],
            isLoading: false,
            count: 0,
        });

        renderWithRouter();
        await waitFor(() => {
            expect(screen.getByText(/Get things done faster/i)).toBeInTheDocument();
        });
    });

    test('shows skeletons when loading', () => {
        (useListingApi as Mock).mockReturnValue({
            data: [],
            isLoading: true,
            count: 0,
        });

        renderWithRouter();
        expect(screen.getAllByTestId('loading-skeleton')).toHaveLength(8);
    });

    test('renders WorksCard components when data is available', () => {
        (useListingApi as Mock).mockReturnValue({
            data: [
                { id: '1', image: 'img1.jpg', name: 'Work 1', features: ['Feature 1'] },
                { id: '2', image: 'img2.jpg', name: 'Work 2', features: ['Feature 2'] },
            ],
            isLoading: false,
            count: 2,
        });

        renderWithRouter();
        expect(screen.getByText('Work 1')).toBeInTheDocument();
        expect(screen.getByText('Work 2')).toBeInTheDocument();
    });

    test('shows Empty state when count is 0 and not loading', () => {
        (useListingApi as Mock).mockReturnValue({
            data: [],
            isLoading: false,
            count: 0,
        });

        renderWithRouter();
        expect(screen.getByText('No Works Added')).toBeInTheDocument();
    });
});
