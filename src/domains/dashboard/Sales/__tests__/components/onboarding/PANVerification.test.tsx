import React from 'react';

import { render, screen, fireEvent } from '@testing-library/react';
import { vi, describe, it, expect } from 'vitest';

import PANVerification from '../../../components/onboarding/PANVerification';

vi.mock('../../../components/shared/LeftHeader', () => ({
    default: ({ title }: any) => <div>{title}</div>,
}));
vi.mock('../../../forms/onboarding/PANVerificationForm', () => ({
    default: () => <div data-testid="pan-form" />,
}));

// Some antd subcomponents query the DOM with selectors derived from Tailwind
// variant classes (e.g. `sm:flex-row`). jsdom's CSS parser can't handle the
// embedded `:` and throws "unknown pseudo-class". Patch querySelector to
// swallow that specific error gracefully.
const origQS = HTMLElement.prototype.querySelector;
HTMLElement.prototype.querySelector = function patched(selector: string) {
    try {
        return origQS.call(this, selector) as Element | null;
    } catch (e: any) {
        if (e?.message?.includes('unknown pseudo-class')) return null;
        throw e;
    }
};
const origQSA = HTMLElement.prototype.querySelectorAll;
HTMLElement.prototype.querySelectorAll = function patched(selector: string) {
    try {
        return origQSA.call(this, selector) as NodeListOf<Element>;
    } catch (e: any) {
        if (e?.message?.includes('unknown pseudo-class')) {
            return [] as unknown as NodeListOf<Element>;
        }
        throw e;
    }
};

describe('PANVerification', () => {
    it('renders the form when no verifiedPan', () => {
        render(
            <PANVerification
                pan=""
                verifiedPan={null}
                onChange={() => {}}
                onVerify={() => {}}
                isVerifying={false}
            />
        );

        expect(screen.getByText('Verify PAN Details')).toBeInTheDocument();
        expect(screen.getByTestId('pan-form')).toBeInTheDocument();
        expect(screen.getByRole('button', { name: /verify pan/i })).toBeInTheDocument();
        expect(screen.getByText(/why is pan required/i)).toBeInTheDocument();
    });

    it('renders the success card when verifiedPan is set', () => {
        render(
            <PANVerification
                pan="ABCDE1234F"
                verifiedPan="ABCDE1234F"
                onChange={() => {}}
                onVerify={() => {}}
                isVerifying={false}
            />
        );

        expect(screen.getByText('PAN Verified Successfully')).toBeInTheDocument();
        expect(screen.getByText('ABCDE1234F')).toBeInTheDocument();
        expect(screen.queryByTestId('pan-form')).not.toBeInTheDocument();
    });

    it('disables Verify PAN button when pan is invalid', () => {
        render(
            <PANVerification
                pan=""
                verifiedPan={null}
                onChange={() => {}}
                onVerify={() => {}}
                isVerifying={false}
            />
        );

        expect(screen.getByRole('button', { name: /verify pan/i })).toBeDisabled();
    });

    it('enables Verify PAN button when pan is valid and triggers onVerify', () => {
        const onVerify = vi.fn();
        render(
            <PANVerification
                pan="ABCDE1234F"
                verifiedPan={null}
                onChange={() => {}}
                onVerify={onVerify}
                isVerifying={false}
            />
        );

        const btn = screen.getByRole('button', { name: /verify pan/i });
        expect(btn).toBeEnabled();
        fireEvent.click(btn);
        expect(onVerify).toHaveBeenCalled();
    });

    it('shows loading state when isVerifying is true', () => {
        render(
            <PANVerification
                pan="ABCDE1234F"
                verifiedPan={null}
                onChange={() => {}}
                onVerify={() => {}}
                isVerifying
            />
        );

        const btn = screen.getByRole('button', { name: /verify pan/i });
        expect(btn.className).toContain('ant-btn-loading');
    });
});
