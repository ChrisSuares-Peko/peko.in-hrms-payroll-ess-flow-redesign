import React from 'react';

import { render, screen } from '@testing-library/react';
import { vi, describe, test, expect, beforeEach } from 'vitest';

import Dashboard from '../../pages/Dashboard';

vi.mock('@src/hooks/useScrollToTop', () => ({
  useScrollToTop: vi.fn(),
}));

vi.mock('../../components/homepage/HomePage', () => ({
  default: () => <div data-testid="home-page">Home Page</div>,
}));

vi.mock('../../../IndividualPlan/pages/SubscriptionPage', () => ({
  default: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="subscription-page">{children}</div>
  ),
}));

vi.mock('@utils/accessKeys', () => ({
  accessKeys: { garage: 'garage-access-key' },
}));
vi.mock('@utils/packageAccessKeys', () => ({
  packageAccessKeys: { garage: 'garage-package-key' },
}));
vi.mock('../../utils/data', () => ({
  featureData: [],
  serviceDetails: [],
  subDescription: '',
}));

vi.mock('antd', async (importOriginal) => {
  const actual = (await importOriginal()) as any;  
  return {
    ...actual,
    Grid: {
      ...actual.Grid,
      useBreakpoint: () => ({ xs: true }), 
    },
  };
});


describe('Dashboard Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  test('should render without crashing', () => {
    render(<Dashboard />);
    expect(screen.getByTestId('subscription-page')).toBeInTheDocument();
  });

  test('should render HomePage inside SubscriptionPage', () => {
    render(<Dashboard />);
    expect(screen.getByTestId('home-page')).toBeInTheDocument();
  });
});
