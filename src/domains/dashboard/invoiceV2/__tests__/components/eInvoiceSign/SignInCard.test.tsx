import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import SignInCard from '../../../components/eInvoiceSign/SignInCard';

vi.mock('../../../forms/EInvoicingSignInForm', () => ({
    default: () => <div data-testid="sign-in-form" />,
}));

describe('SignInCard', () => {
    it('renders header copy and sign-in button', () => {
        render(<SignInCard onSubmit={vi.fn()} />);
        expect(screen.getByText('Sign in')).toBeInTheDocument();
        expect(
            screen.getByText('Enter your GSP credentials to access the portal')
        ).toBeInTheDocument();
        expect(
            screen.getByRole('button', { name: /Sign In to E-Invoice Portal/i })
        ).toBeInTheDocument();
    });

    it('mounts the form inside the card', () => {
        render(<SignInCard onSubmit={vi.fn()} />);
        expect(screen.getByTestId('sign-in-form')).toBeInTheDocument();
    });

    it('disables (loading state) the button when isLoading=true', () => {
        render(<SignInCard onSubmit={vi.fn()} isLoading />);
        // antd buttons keep the role; spinner is added inside
        const btn = screen.getByRole('button', { name: /Sign In to E-Invoice Portal/i });
        expect(btn.querySelector('.ant-btn-loading-icon')).toBeInTheDocument();
    });
});
