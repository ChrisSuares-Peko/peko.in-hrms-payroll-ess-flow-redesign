import { render, screen, fireEvent } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { describe, it, expect, vi } from 'vitest';

import VerificationLimitBar from '../../components/VerificationLimitBar';

const mockNavigate = vi.fn();

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

describe('VerificationLimitBar Component', () => {
  const countData = {
    usedLimit: 4,
    remaining: 6,
    exhausted: false,
  };

  const renderComponent = (props = {}) =>
    render(
      <MemoryRouter>
        <VerificationLimitBar countData={countData} maxLimit={10} loading={false} {...props} />
      </MemoryRouter>
    );

  it('renders a skeleton while loading', () => {
    const { container } = render(
      <MemoryRouter>
        <VerificationLimitBar loading countData={countData} maxLimit={10} />
      </MemoryRouter>
    );

    expect(container.querySelector('.ant-skeleton')).toBeInTheDocument();
    expect(screen.queryByText('Verifications Limit')).not.toBeInTheDocument();
  });

  it('renders nothing when countData or maxLimit is missing', () => {
    const { container } = renderComponent({ countData: undefined });

    expect(container).toBeEmptyDOMElement();
  });

  it('renders the used/max verification summary and upgrade button by default', () => {
    renderComponent();

    expect(screen.getByText('Verifications Limit')).toBeInTheDocument();
    expect(screen.getByText(/4 Verifications used of 10 Verifications/)).toBeInTheDocument();
    expect(screen.getByText('Upgrade')).toBeInTheDocument();
  });

  it('uses singular grammar when exactly one verification is used', () => {
    renderComponent({ countData: { ...countData, usedLimit: 1 } });

    expect(screen.getByText(/1 Verification used of 10 Verifications/)).toBeInTheDocument();
  });

  it('hides the upgrade button when showUpgradeButton is false', () => {
    renderComponent({ showUpgradeButton: false });

    expect(screen.queryByText('Upgrade')).not.toBeInTheDocument();
  });

  it('navigates to settings when the upgrade button is clicked', () => {
    renderComponent();

    fireEvent.click(screen.getByText('Upgrade'));

    expect(mockNavigate).toHaveBeenCalledWith('settings');
  });
});
