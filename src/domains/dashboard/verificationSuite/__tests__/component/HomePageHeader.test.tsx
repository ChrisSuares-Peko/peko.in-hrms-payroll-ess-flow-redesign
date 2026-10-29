import { render, screen, fireEvent } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { describe, it, expect, vi } from 'vitest';

import HomePageHeader from '../../components/HomePageHeader';

const mockNavigate = vi.fn();

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

describe('HomePageHeader Component', () => {
  const renderComponent = () =>
    render(
      <MemoryRouter>
        <HomePageHeader />
      </MemoryRouter>
    );

  it('renders the title and history button', () => {
    renderComponent();

    expect(screen.getByText('Verification Suite')).toBeInTheDocument();
    expect(screen.getByText('Verification History')).toBeInTheDocument();
  });

  it('navigates to verification history on button click', () => {
    renderComponent();

    fireEvent.click(screen.getByText('Verification History'));

    expect(mockNavigate).toHaveBeenCalledWith('verification-history');
  });
});
