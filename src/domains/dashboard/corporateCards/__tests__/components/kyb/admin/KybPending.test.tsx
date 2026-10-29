import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi, Mock } from 'vitest';

import { useAppSelector } from '@src/hooks/store';

import KybPending from '../../../../components/kyb/admin/KybPending';
import { KYB_PENDING } from '../../../../utils/kybData';

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

describe('KybPending', () => {
    it('renders the title, description, status label, and expected completion', () => {
        mockKybInfo({ refId: null, submittedOn: null, rejectionReason: null });
        render(<KybPending />);

        expect(screen.getByText(KYB_PENDING.title)).toBeInTheDocument();
        expect(screen.getByText(KYB_PENDING.description)).toBeInTheDocument();
        expect(screen.getByText(KYB_PENDING.statusLabel)).toBeInTheDocument();
        expect(screen.getByText(KYB_PENDING.expectedCompletion)).toBeInTheDocument();
    });

    it('renders the ref ID and submitted-on date from kybInfo', () => {
        mockKybInfo({
            refId: 'KYBabc123',
            submittedOn: '10 Jul 2026, 10:00 AM',
            rejectionReason: null,
        });
        render(<KybPending />);

        expect(screen.getByText('KYBabc123')).toBeInTheDocument();
        expect(screen.getByText('10 Jul 2026, 10:00 AM')).toBeInTheDocument();
    });

    it('falls back to "—" when refId/submittedOn are null', () => {
        mockKybInfo({ refId: null, submittedOn: null, rejectionReason: null });
        render(<KybPending />);

        expect(screen.getAllByText('—')).toHaveLength(2);
    });
});
