import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';

import { useDashboardNav } from '../../../components/common/dashboardNav';
import TabbedDashboard from '../../../components/common/TabbedDashboard';
import { TabItem } from '../../../utils/types';

const TABS: TabItem[] = [
    { key: 'dashboard', label: 'Dashboard' },
    { key: 'cards', label: 'Cards' },
];

// Stand-in for a panel like CardsAssignedPanel that navigates away via useDashboardNav(), i.e. the
// "View all cards" link from ADO 29052's repro.
const DashboardHomeWithViewAllLink = () => {
    const navigate = useDashboardNav();
    return (
        <button type="button" onClick={() => navigate('cards')}>
            View all cards
        </button>
    );
};

describe('TabbedDashboard', () => {
    let myContainerScrollTo: ReturnType<typeof vi.fn>;

    beforeEach(() => {
        vi.spyOn(window, 'scrollTo').mockImplementation(() => {});
        document.body.innerHTML = '<div id="myContainer"></div>';
        myContainerScrollTo = vi.fn();
        document.getElementById('myContainer')!.scrollTo =
            myContainerScrollTo as unknown as Element['scrollTo'];
    });

    it('renders the default tab content', () => {
        render(
            <TabbedDashboard tabs={TABS} content={{ dashboard: <div>Dashboard content</div> }} />
        );
        expect(screen.getByText('Dashboard content')).toBeInTheDocument();
    });

    it('switches content when a different tab is clicked', () => {
        render(
            <TabbedDashboard
                tabs={TABS}
                content={{
                    dashboard: <div>Dashboard content</div>,
                    cards: <div>Cards content</div>,
                }}
            />
        );
        fireEvent.click(screen.getByText('Cards'));
        expect(screen.getByText('Cards content')).toBeInTheDocument();
        expect(screen.queryByText('Dashboard content')).toBeNull();
    });

    // ADO 29052 — switching tabs (main bar or a "View all" link) swaps content in place with no route
    // change, so nothing reset scroll on its own; the new section could open wherever the previous one
    // had been scrolled to.
    it('resets scroll on #myContainer when the tab bar is clicked', () => {
        render(
            <TabbedDashboard
                tabs={TABS}
                content={{
                    dashboard: <div>Dashboard content</div>,
                    cards: <div>Cards content</div>,
                }}
            />
        );
        myContainerScrollTo.mockClear();
        (window.scrollTo as ReturnType<typeof vi.fn>).mockClear();

        fireEvent.click(screen.getByText('Cards'));

        expect(myContainerScrollTo).toHaveBeenCalledWith(0, 0);
        expect(window.scrollTo).toHaveBeenCalledWith(0, 0);
    });

    it('resets scroll on #myContainer when navigating via a "View all" link from inside a tab', () => {
        render(
            <TabbedDashboard
                tabs={TABS}
                content={{
                    dashboard: <DashboardHomeWithViewAllLink />,
                    cards: <div>Cards content</div>,
                }}
            />
        );
        myContainerScrollTo.mockClear();
        (window.scrollTo as ReturnType<typeof vi.fn>).mockClear();

        fireEvent.click(screen.getByText('View all cards'));

        expect(screen.getByText('Cards content')).toBeInTheDocument();
        expect(myContainerScrollTo).toHaveBeenCalledWith(0, 0);
        expect(window.scrollTo).toHaveBeenCalledWith(0, 0);
    });
});
