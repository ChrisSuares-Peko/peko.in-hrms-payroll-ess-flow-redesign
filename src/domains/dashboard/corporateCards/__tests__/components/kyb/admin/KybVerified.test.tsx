import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, Mock } from 'vitest';

import { useAppSelector } from '@src/hooks/store';

import KybVerified from '../../../../components/kyb/admin/KybVerified';
import { KYB_VERIFIED } from '../../../../utils/kybData';

vi.mock('@src/hooks/store', () => ({
    useAppSelector: vi.fn(),
}));

const mockKybInfo = (kybInfo: {
    refId: string | null;
    submittedOn: string | null;
    rejectionReason: string | null;
}) => {
    (useAppSelector as unknown as Mock).mockImplementation((fn: any) =>
        fn({ reducer: { corporateCards: { kybInfo } } })
    );
};

describe('KybVerified', () => {
    it('renders the title, description, and "Verified with" line', () => {
        mockKybInfo({ refId: null, submittedOn: null, rejectionReason: null });
        render(<KybVerified onGoToDashboard={vi.fn()} />);

        expect(screen.getByText(KYB_VERIFIED.title)).toBeInTheDocument();
        expect(screen.getByText(KYB_VERIFIED.description)).toBeInTheDocument();
        expect(screen.getByText(KYB_VERIFIED.verifiedWithValue)).toBeInTheDocument();
        expect(screen.getByText('Approved')).toBeInTheDocument();
    });

    it('renders the ref ID and submitted-on date from kybInfo', () => {
        mockKybInfo({
            refId: 'KYB22402C442C',
            submittedOn: '17 Jul 2026, 5:56 PM',
            rejectionReason: null,
        });
        render(<KybVerified onGoToDashboard={vi.fn()} />);

        expect(screen.getByText('KYB22402C442C')).toBeInTheDocument();
        expect(screen.getByText('17 Jul 2026, 5:56 PM')).toBeInTheDocument();
    });

    it('falls back to "—" when refId/submittedOn are null', () => {
        mockKybInfo({ refId: null, submittedOn: null, rejectionReason: null });
        render(<KybVerified onGoToDashboard={vi.fn()} />);

        expect(screen.getAllByText('—')).toHaveLength(2);
    });

    it('calls onGoToDashboard when the CTA is clicked', () => {
        mockKybInfo({ refId: null, submittedOn: null, rejectionReason: null });
        const onGoToDashboard = vi.fn();
        render(<KybVerified onGoToDashboard={onGoToDashboard} />);

        fireEvent.click(screen.getByRole('button', { name: KYB_VERIFIED.ctaLabel }));

        expect(onGoToDashboard).toHaveBeenCalledTimes(1);
    });
});
