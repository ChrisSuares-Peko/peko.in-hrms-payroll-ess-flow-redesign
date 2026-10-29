import { createContext, useContext } from 'react';

/** Switch the active dashboard tab by key. */
export type DashboardNavigate = (tabKey: string) => void;

const DashboardNavContext = createContext<DashboardNavigate>(() => {});

export const DashboardNavProvider = DashboardNavContext.Provider;

/**
 * Navigate between dashboard tabs from within tab content (e.g. "View all" links).
 * Provided by <TabbedDashboard>; defaults to a no-op outside one.
 */
export const useDashboardNav = (): DashboardNavigate => useContext(DashboardNavContext);
