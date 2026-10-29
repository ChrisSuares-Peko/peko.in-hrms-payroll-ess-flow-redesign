import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi, Mock } from 'vitest';

import { useAppSelector } from '@src/hooks/store';

import KybSubmitted from '../../../../components/kyb/admin/KybSubmitted';
import { KYB_SUBMITTED } from '../../../../utils/kybData';

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

describe('KybSubmitted', () => {
    it('renders the title, description, "Submitted" status, and expected completion', () => {
        mockKybInfo({ refId: null, submittedOn: null, rejectionReason: null });
        render(<KybSubmitted />);

        expect(screen.getByText(KYB_SUBMITTED.title)).toBeInTheDocument();
        expect(screen.getByText(KYB_SUBMITTED.description)).toBeInTheDocument();
        expect(screen.getByText(KYB_SUBMITTED.statusLabel)).toBeInTheDocument();
        expect(screen.getByText(KYB_SUBMITTED.expectedCompletion)).toBeInTheDocument();
    });

    it('renders the ref ID and submitted-on date from kybInfo', () => {
        mockKybInfo({
            refId: 'KYBabc123',
            submittedOn: '10 Jul 2026, 10:00 AM',
            rejectionReason: null,
        });
        render(<KybSubmitted />);

        expect(screen.getByText('KYBabc123')).toBeInTheDocument();
        expect(screen.getByText('10 Jul 2026, 10:00 AM')).toBeInTheDocument();
    });

    it('falls back to "—" when refId/submittedOn are null', () => {
        mockKybInfo({ refId: null, submittedOn: null, rejectionReason: null });
        render(<KybSubmitted />);

        expect(screen.getAllByText('—')).toHaveLength(2);
    });
});
