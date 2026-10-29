import { render, screen, fireEvent } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import PANVerification from '../../../components/onboarding/PANVerification';

vi.mock('../../../forms/onboarding/PANVerificationForm', () => ({
    default: () => <div data-testid="pan-form" />,
}));

describe('PANVerification', () => {
    it('renders form and Verify button when no verified PAN', () => {
        render(
            <PANVerification
                pan="ABCDE1234F"
                onChange={vi.fn()}
                verifiedPan={null}
                onVerify={vi.fn()}
                isVerifying={false}
            />
        );
        expect(screen.getByText('Verify PAN Details')).toBeInTheDocument();
        expect(screen.getByTestId('pan-form')).toBeInTheDocument();
        expect(screen.getByText('Verify PAN').closest('button')!).toBeInTheDocument();
    });

    it('renders verified card when verifiedPan is present', () => {
        render(
            <PANVerification
                pan="ABCDE1234F"
                onChange={vi.fn()}
                verifiedPan="ABCDE1234F"
                onVerify={vi.fn()}
                isVerifying={false}
            />
        );
        expect(screen.getByText('PAN Verified Successfully')).toBeInTheDocument();
        expect(screen.getByText('ABCDE1234F')).toBeInTheDocument();
    });

    it('fires onVerify when Verify PAN clicked', () => {
        const onVerify = vi.fn();
        render(
            <PANVerification
                pan="ABCDE1234F"
                onChange={vi.fn()}
                verifiedPan={null}
                onVerify={onVerify}
                isVerifying={false}
            />
        );
        fireEvent.click(screen.getByText('Verify PAN').closest('button')!);
        expect(onVerify).toHaveBeenCalled();
    });
});
