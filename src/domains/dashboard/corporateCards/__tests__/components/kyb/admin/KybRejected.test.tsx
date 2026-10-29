import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, Mock } from 'vitest';

import { useAppSelector } from '@src/hooks/store';

import KybRejected from '../../../../components/kyb/admin/KybRejected';
import { KYB_REJECTED } from '../../../../utils/kybData';

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

describe('KybRejected', () => {
    it('renders the title, description, and "Rejected" status', () => {
        mockKybInfo({ refId: null, submittedOn: null, rejectionReason: null });
        render(<KybRejected onResubmit={vi.fn()} />);

        expect(screen.getByText(KYB_REJECTED.title)).toBeInTheDocument();
        expect(screen.getByText(KYB_REJECTED.description)).toBeInTheDocument();
        expect(screen.getByText('Rejected')).toBeInTheDocument();
    });

    it('renders the ref ID, submitted-on date, and rejection reason from kybInfo', () => {
        mockKybInfo({
            refId: 'KYBabc123',
            submittedOn: '10 Jul 2026, 10:00 AM',
            rejectionReason: 'Blurry PAN card.',
        });
        render(<KybRejected onResubmit={vi.fn()} />);

        expect(screen.getByText('KYBabc123')).toBeInTheDocument();
        expect(screen.getByText('10 Jul 2026, 10:00 AM')).toBeInTheDocument();
        expect(screen.getByText('Blurry PAN card.')).toBeInTheDocument();
    });

    it('falls back to "—" for refId/submittedOn and a default message for a missing rejection reason', () => {
        mockKybInfo({ refId: null, submittedOn: null, rejectionReason: null });
        render(<KybRejected onResubmit={vi.fn()} />);

        expect(screen.getAllByText('—')).toHaveLength(2);
        expect(screen.getByText('No reason provided.')).toBeInTheDocument();
    });

    it('calls onResubmit when the CTA is clicked', () => {
        mockKybInfo({ refId: null, submittedOn: null, rejectionReason: null });
        const onResubmit = vi.fn();
        render(<KybRejected onResubmit={onResubmit} />);

        fireEvent.click(screen.getByRole('button', { name: KYB_REJECTED.ctaLabel }));

        expect(onResubmit).toHaveBeenCalledTimes(1);
    });
});
