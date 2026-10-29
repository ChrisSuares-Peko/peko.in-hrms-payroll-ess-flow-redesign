/* eslint-disable react/button-has-type */
import React from 'react';

import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, vi, beforeEach, expect } from 'vitest';

import HeaderBanner from '../../components/homepage/HeaderBanner';

const navigateMock = vi.fn();
vi.mock('react-router-dom', () => ({
  useNavigate: () => navigateMock,
}));

const dispatchMock = vi.fn();
vi.mock('@src/hooks/store', () => ({
  useAppDispatch: () => dispatchMock,
}));

vi.mock('../../components/SwitchWeb', () => ({
  __esModule: true,
  default: ({ handleChange, setIdentityNo }: any) => (
    <div data-testid="switch-plan">
      <button onClick={() => handleChange('DL')}>Switch to DL</button>
      <button onClick={() => setIdentityNo('ABC123')}>Set Identity</button>
    </div>
  ),
}));

const verifyApiMock = vi.fn().mockResolvedValue(null);
vi.mock('../../hooks/useVerifyApi', () => ({
  __esModule: true,
  default: () => ({ verifyApi: verifyApiMock }),
}));

describe('HeaderBanner Component', () => {
  const defaultProps = {
    inputParams: { doc_identity_no: 'MH01AB1234', dob: '2000-01-01' },
    verifyRcResponse: null,
    verifyResponse: null,
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders correctly with RC tab by default', () => {
    render(<HeaderBanner {...defaultProps} />);
    expect(screen.getByText('Search Vehicle')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Enter Registration Number')).toHaveValue('MH01AB1234');
   
  });


  it('updates input value when user types', () => {
    render(<HeaderBanner {...defaultProps} />);
    const input = screen.getByPlaceholderText('Enter Registration Number');
    fireEvent.change(input, { target: { value: 'NEW123' } });
    expect(input).toHaveValue('NEW123');
  });

  it('calls verifyApi on Search click for RC', () => {
    render(<HeaderBanner {...defaultProps} />);
    fireEvent.click(screen.getByText('Search'));
    expect(verifyApiMock).toHaveBeenCalledWith({
      doc_identity_no: 'MH01AB1234',
      type: 'rc',
    });
  });

  
});
