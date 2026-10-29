import React from 'react';

import { render, screen } from '@testing-library/react';
import { describe, it, vi, beforeEach, expect } from 'vitest';

import HomePage from '../../components/homepage/HomePage';

vi.mock('../../components/homepage/HomePageHeader', () => ({
  __esModule: true,
  default: () => <div data-testid="homepage-header">HomePageHeader</div>,
}));

vi.mock('../../components/homepage/HeaderBanner', () => ({
  __esModule: true,
  default: () => <div data-testid="header-banner">HeaderBanner</div>,
}));

vi.mock('../../components/homepage/DocInfoCard', () => ({
  __esModule: true,
  default: ({ title, value }: any) => (
    <div data-testid="doc-info-card">
      {title} - {value}
    </div>
  ),
}));

vi.mock('../../components/homepage/TurboIconCard', () => ({
  __esModule: true,
  default: ({ title }: any) => <div data-testid="turbo-icon-card">{title}</div>,
}));

vi.mock('../../components/homepage/AlertCards', () => ({
  __esModule: true,
  default: ({ title }: any) => <div data-testid="card-component">{title}</div>,
}));

vi.mock('../../components/homepage/Chart', () => ({
  __esModule: true,
  default: () => <div data-testid="chart">Chart</div>,
}));

const dashboardDataMock = {
  fleets: { verified: 10, unverified: 5 },
  drivers: { totalDrivers: 20, dlExpiringSoon: 2 },
  ageDistributionData: [],
  documents: [],
  tasks: [],
  topup: [],
};

vi.mock('../../hooks/useGetAllLogsApi', () => ({
  __esModule: true,
  default: vi.fn(() => ({
    logs: [],
    count: 0,
    isLoading: false,
  })),
}));

vi.mock('../../hooks/useDashboard', () => ({
  __esModule: true,
  default: vi.fn(() => ({
    data: dashboardDataMock,
    isLoading: false,
  })),
}));

describe('HomePage Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders header and banner', () => {
    render(<HomePage />);
    expect(screen.getByTestId('homepage-header')).toBeInTheDocument();
    expect(screen.getByTestId('header-banner')).toBeInTheDocument();
  });

  it('renders DocInfoCards', () => {
    render(<HomePage />);
    const cards = screen.getAllByTestId('doc-info-card');
    expect(cards.length).toBe(2);
    expect(cards[0]).toHaveTextContent('Total Documents - Fleet Summary');
    expect(cards[1]).toHaveTextContent('Active Documents - Driver License Summary');
  });

  it('renders TurboIconCards', () => {
    render(<HomePage />);
    const turboCards = screen.getAllByTestId('turbo-icon-card');
    expect(turboCards.length).toBeGreaterThan(0);
  });

  it('renders Chart or empty state', () => {
    render(<HomePage />);
    // Since ageDistributionData is empty, the empty state should render
    expect(screen.getByText('No data to display on the graph')).toBeInTheDocument();
  });

  it('renders AlertCards components', () => {
    render(<HomePage />);
    const alertCards = screen.getAllByTestId('card-component');
    expect(alertCards.length).toBe(3);
    expect(alertCards[0]).toHaveTextContent('Document Expiry Alerts');
    expect(alertCards[1]).toHaveTextContent('Compliance Tasks');
    expect(alertCards[2]).toHaveTextContent('Recent FASTag Top-ups');
  });
});
