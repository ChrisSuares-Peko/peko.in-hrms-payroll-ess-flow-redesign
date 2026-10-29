import '@testing-library/jest-dom/vitest';

import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { Mock, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';

import {
    getApprovalPartners,
    getPartnerApprovals,
} from '@src/domains/admin/accounting/api/approvals';
import { ADMIN_ONLY_TEXT } from '@src/domains/admin/accounting/components/approvals/ApprovalGateCard';
import { useAppSelector } from '@src/hooks/store';

import AccountingApprovals from '../../../component/accountingApprovals/AccountingApprovals';

vi.mock('@src/hooks/store', () => ({ useAppSelector: vi.fn(), useAppDispatch: () => vi.fn() }));

vi.mock('@src/domains/admin/accounting/api/approvals', () => ({
    getApprovalPartners: vi.fn(),
    getPartnerApprovals: vi.fn(),
    getApprovalReview: vi.fn(),
    decideApprovals: vi.fn(),
    getApprovalGate: vi.fn(),
    updateApprovalGate: vi.fn(),
}));

const gateOff = {
    enabled: false,
    reason: null,
    setById: 42,
    setByName: 'Ibrahim',
    setAt: '2026-09-26T05:00:00.000Z',
};

const partner = {
    partnerPermissionId: 1,
    registeredBy: null,
    partnerName: null,
    treeStatus: true,
    counts: {
        services: 1,
        switchedOn: 1,
        awaiting: 1,
        approved: 0,
        rejected: 0,
        pending: 1,
        drifted: 0,
    },
};

describe('AccountingApprovals (Settings)', () => {
    beforeAll(() => {
        Object.defineProperty(window, 'innerWidth', {
            value: 1600,
            writable: true,
            configurable: true,
        });
    });

    beforeEach(() => {
        vi.clearAllMocks();
        (useAppSelector as unknown as Mock).mockImplementation((selector: any) =>
            selector({ reducer: { auth: { role: 'system_user', id: 7 } } })
        );
        (getApprovalPartners as Mock).mockResolvedValue({
            partners: [partner],
            totals: partner.counts,
            gate: gateOff,
        });
        (getPartnerApprovals as Mock).mockResolvedValue({
            partner,
            rows: [
                {
                    partnerPermissionId: 1,
                    partnerName: null,
                    nodeKey: 'insurance_desk',
                    accessKey: 'insurance_desk',
                    label: 'Insurance',
                    path: ['Insurance'],
                    group: null,
                    order: 0,
                    switchedOn: true,
                    status: 'PENDING',
                    decidedById: null,
                    decidedByName: null,
                    decidedAt: null,
                    note: null,
                    readiness: { passed: 0, total: 1, blocking: ['operator'], warnings: [] },
                    drift: null,
                    evidence: null,
                },
            ],
            gate: gateOff,
        });
    });

    it('lists the partner’s services read-only, with the gate state but no switch', async () => {
        render(
            <MemoryRouter initialEntries={['/system-user/settings/accounting-approvals']}>
                <AccountingApprovals />
            </MemoryRouter>
        );

        expect(screen.getByText('Accounting Approvals')).toBeInTheDocument();
        expect(await screen.findByText('Insurance')).toBeInTheDocument();
        expect(getPartnerApprovals).toHaveBeenCalledWith(
            expect.objectContaining({ partnerPermissionId: 1, status: 'awaiting' })
        );
        expect(screen.queryByText('Review', { selector: 'span' })).not.toBeInTheDocument();
        expect(screen.queryByText('View', { selector: 'span' })).not.toBeInTheDocument();
        expect(screen.queryByRole('switch')).not.toBeInTheDocument();
        expect(await screen.findByText('Off — dev mode')).toBeInTheDocument();
        expect(screen.getByText('Changed by Ibrahim on 26 Sep 2026')).toBeInTheDocument();
        expect(screen.getByText(ADMIN_ONLY_TEXT)).toBeInTheDocument();
    });
});
