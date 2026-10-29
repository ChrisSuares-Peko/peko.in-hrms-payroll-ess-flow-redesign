import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';

import PlanDrawer from '../../components/PlanDrawer';

const mockPlanCategories = ['Category 1', 'Category 2'];
const mockPlansData = [
    {
        PlanName: 'Category 1',
        Amount: 100,
        Validity: '30 Days',
        Description: 'Plan 1 Description',
        LocationName: 'Location 1',
        ServiceId: 1,
        ServiceProviderId: 1,
        ServiceProviderName: 'Provider 1',
        Talktime: 100,
    },
    {
        PlanName: 'Category 2',
        Amount: 200,
        Validity: '60 Days',
        Description: 'Plan 2 Description',
        LocationName: 'Location 2',
        ServiceId: 2,
        ServiceProviderId: 2,
        ServiceProviderName: 'Provider 2',
        Talktime: 200,
    },
];

const mockServiceProvider = 'TestProvider';

const mockProps = {
    isOpen: true,
    handleClose: vi.fn(),
    planCategories: mockPlanCategories,
    plansData: mockPlansData,
    serviceProvider: mockServiceProvider,
    isLoading: false,
};

describe('PlanDrawer Component', () => {
    it('renders the drawer with correct title', () => {
        render(<PlanDrawer {...mockProps} />);
        const title = screen.getByText(/Testprovider Plans/i);
        expect(title).toBeInTheDocument();
    });

    it('displays tabs with plans when data is available', () => {
        render(<PlanDrawer {...mockProps} />);
        const tab1 = screen.getByText('Category 1');
        const tab2 = screen.getByText('Category 2');
        expect(tab1).toBeInTheDocument();
        expect(tab2).toBeInTheDocument();

        const planDescription = screen.getByText('Description');
        expect(planDescription).toBeInTheDocument();
    });

    it('displays empty state when no plans are available', () => {
        render(<PlanDrawer {...mockProps} planCategories={[]} plansData={[]} />);
        const emptyMessage = screen.getByText(/No Plans Available at the moment/i);
        expect(emptyMessage).toBeInTheDocument();
    });

    it('calls handleClose when the close icon is clicked', () => {
        render(<PlanDrawer {...mockProps} />);
        const closeIcon = screen.getByRole('img', { name: /close/i });
        fireEvent.click(closeIcon);
        expect(mockProps.handleClose).toHaveBeenCalled();
    });

    it('renders the correct number of tabs based on plan categories', () => {
        render(<PlanDrawer {...mockProps} />);
        const tabs = screen.getAllByRole('tab');
        expect(tabs).toHaveLength(mockPlanCategories.length);
    });
});
