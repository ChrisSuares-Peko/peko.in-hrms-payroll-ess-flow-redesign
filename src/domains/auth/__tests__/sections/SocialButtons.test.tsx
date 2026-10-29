import React from 'react';

import '@testing-library/jest-dom/vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import SocialButtons from '@domains/auth/components/sections/SocialButtons';

const mockHandleOidcLogin = vi.fn();
let ssoEnabled = false;

vi.mock('@domains/auth/hooks/useSocialLogin', () => ({
    default: () => ({ handleOidcLogin: mockHandleOidcLogin }),
    isSocialProfileIncomplete: vi.fn(),
}));

vi.mock('react-redux', () => ({
    useDispatch: () => vi.fn(),
}));

vi.mock('@src/config-global', async importOriginal => {
    const actual = await importOriginal<typeof import('@src/config-global')>();
    return {
        ...actual,
        get SSO_LOGIN_ENABLED() {
            return ssoEnabled;
        },
    };
});

const renderSocialButtons = () =>
    render(
        <MemoryRouter>
            <SocialButtons />
        </MemoryRouter>
    );

beforeEach(() => {
    vi.clearAllMocks();
    ssoEnabled = false;
});

describe('SocialButtons SSO CTA gating', () => {
    it('hides the SSO button when VITE_SSO_LOGIN_ENABLED is off (default)', () => {
        renderSocialButtons();

        expect(screen.queryByText('Sign in with SSO')).not.toBeInTheDocument();
        expect(screen.getByText(/Sign up/)).toBeInTheDocument();
    });

    it('shows the SSO button when the flag is on and starts the OIDC login on click', () => {
        ssoEnabled = true;
        renderSocialButtons();

        const cta = screen.getByText('Sign in with SSO');
        expect(cta).toBeInTheDocument();

        fireEvent.click(cta);
        expect(mockHandleOidcLogin).toHaveBeenCalledTimes(1);
    });
});
