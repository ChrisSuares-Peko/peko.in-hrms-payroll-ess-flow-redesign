import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';

import VerificationPlanCard from '../../components/VerificationPlanCard';
import useVerificationPlan from '../../hooks/useVerificationPlan';

vi.mock('../../hooks/useVerificationPlan');

const mockedUseVerificationPlan = vi.mocked(useVerificationPlan);

describe('VerificationPlanCard Component', () => {
  it('renders a skeleton while loading', () => {
    mockedUseVerificationPlan.mockReturnValue({
      plan: null,
      loading: true,
      refresh: vi.fn(),
    } as any);

    const { container } = render(<VerificationPlanCard />);

    expect(container.querySelector('.ant-skeleton')).toBeInTheDocument();
  });

  it('renders nothing when there is no plan', () => {
    mockedUseVerificationPlan.mockReturnValue({
      plan: null,
      loading: false,
      refresh: vi.fn(),
    } as any);

    const { container } = render(<VerificationPlanCard />);

    expect(container).toBeEmptyDOMElement();
  });

  it('renders the plan details when a plan is available', () => {
    mockedUseVerificationPlan.mockReturnValue({
      plan: {
        package: { packageName: 'Gold Plan' },
        billingType: 'monthly',
        subscriptionAmountPaid: 5000,
        status: 'active',
        subscriptionStartDate: '2024-01-01',
        subscriptionEndDate: '2024-12-31',
      },
      loading: false,
      refresh: vi.fn(),
    } as any);

    render(<VerificationPlanCard />);

    expect(screen.getByText('Gold Plan - Monthly')).toBeInTheDocument();
    expect(screen.getByText('₹ 5,000.00')).toBeInTheDocument();
    expect(screen.getByText('Active')).toBeInTheDocument();
    expect(screen.getByText('01/01/2024')).toBeInTheDocument();
    expect(screen.getByText('31/12/2024')).toBeInTheDocument();
  });
});
