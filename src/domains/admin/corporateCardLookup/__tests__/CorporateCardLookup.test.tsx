import '@testing-library/jest-dom/vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, Mock, vi } from 'vitest';

import CardsTable from '../components/CardsTable';
import MembersTable from '../components/MembersTable';
import { useCorporateCardLookup } from '../hooks/useCorporateCardLookup';
import CorporateCardLookup from '../pages/CorporateCardLookup';
import { CorporateCardLookupDetail, LookupCard, LookupMember } from '../types';

vi.mock('../hooks/useCorporateCardLookup', () => ({ useCorporateCardLookup: vi.fn() }));

// The paged sections fetch on their own; the page test only cares which one is shown.
vi.mock('../components/ActivityTable', () => ({ default: () => <div>activity-section</div> }));
vi.mock('../components/RequestsTable', () => ({ default: () => <div>requests-section</div> }));
vi.mock('../components/TopUpsTable', () => ({ default: () => <div>topups-section</div> }));
vi.mock('../components/DispatchesTable', () => ({ default: () => <div>dispatches-section</div> }));
vi.mock('../components/LookupTransactionsTable', () => ({
    default: () => <div>transactions-section</div>,
}));

const card = (overrides: Partial<LookupCard> = {}): LookupCard => ({
    id: 7,
    type: 'Virtual',
    last4: '3657',
    nameOnCard: 'AARAV',
    status: 'Active',
    issuanceStatus: 'ISSUED',
    activationStatus: 'Activated',
    failureReason: null,
    cardState: 'ACTIVE',
    freezeReasonLabel: null,
    freezeReasonNote: null,
    frozenByRole: null,
    terminationStatus: null,
    cardLimit: 5000,
    perTxnLimit: 1000,
    limitFrequency: 'monthly',
    atmEnabled: false,
    deliveryStatus: null,
    awbNumber: null,
    courierPartnerName: null,
    issuedOn: '2026-09-01T00:00:00.000Z',
    ...overrides,
});

const member = (overrides: Partial<LookupMember> = {}): LookupMember => ({
    id: '77',
    name: 'Aarav Sharma',
    email: 'aarav@acme.in',
    mobileNo: '9000000077',
    role: 'Employee',
    status: 'ACTIVE',
    isAccountOwner: false,
    addedOn: '2026-02-01T00:00:00.000Z',
    kyc: null,
    cards: [],
    ...overrides,
});

const detail = (overrides: Partial<CorporateCardLookupDetail> = {}): CorporateCardLookupDetail => ({
    profile: {
        corporateId: 42,
        companyName: 'Acme Pvt Ltd',
        contactPersonName: 'Riya',
        accountId: 'PEKO42',
        email: 'ops@acme.in',
        phone: '9000000000',
        appliedOn: '2026-01-01T00:00:00.000Z',
    },
    kyb: {
        status: 'REJECTED',
        kybReference: 'KYB1',
        rejectionReason: 'GST certificate is illegible',
        businessType: 'Private Limited',
        updatedAt: '2026-01-05T00:00:00.000Z',
    },
    wallet: {
        balance: 7500,
        totalCredited: 10000,
        totalSpent: 2500,
        totalCardLimits: 15000,
        svcCardNumberLast4: '3456',
    },
    stats: {
        admins: 1,
        employees: 2,
        cards: 3,
        cardsByType: { Virtual: 2, Physical: 1 },
        cardsByActivation: { Activated: 3 },
        frozenCards: 1,
        pendingCards: 0,
        failedCards: 2,
        kycByStatus: { COMPLETED: 2, REJECTED: 1 },
        activityCount: 12,
        requestCount: 3,
        topUpCount: 4,
        transactionCount: 25,
    },
    members: [
        member({ id: '1', name: 'Owner', role: 'Admin', isAccountOwner: true }),
        member({ kyc: { status: 'REJECTED', reason: 'Face match failed', updatedAt: null } }),
    ],
    membersUnavailable: false,
    membersCapped: false,
    unassignedCards: [],
    ...overrides,
});

const mockHook = (data: CorporateCardLookupDetail | null) =>
    (useCorporateCardLookup as Mock).mockReturnValue({
        isLoading: false,
        fetchingOptions: false,
        data,
        options: [],
        onSearchDropdown: vi.fn(),
        searchCorporate: vi.fn(),
        clear: vi.fn(),
    });

// The whole page is antd-heavy; its first render can outlast the 5s default on a cold run.
describe('CorporateCardLookup page', { timeout: 20000 }, () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('prompts for a corporate before one is chosen', () => {
        mockHook(null);
        render(<CorporateCardLookup />);
        expect(screen.getByText('No corporate selected')).toBeInTheDocument();
    });

    it('shows the KYB status with its rejection reason', () => {
        mockHook(detail());
        render(<CorporateCardLookup />);
        expect(screen.getByText('KYB Onboarding').closest('.ant-card')).toHaveTextContent(
            'Rejected'
        );
        expect(screen.getByText('Rejection reason')).toBeInTheDocument();
        expect(screen.getByText('GST certificate is illegible')).toBeInTheDocument();
        expect(screen.getByText('PEKO42', { exact: false })).toBeInTheDocument();
    });

    it('summarises people, KYC and section totals on the tiles', () => {
        mockHook(detail());
        render(<CorporateCardLookup />);
        expect(screen.getByText('1 / 2')).toBeInTheDocument();
        expect(screen.getByText('2 / 3')).toBeInTheDocument();
        expect(screen.getByText('1 rejected')).toBeInTheDocument();
        expect(
            screen.getByText('2 virtual · 1 physical · 1 frozen · 2 failed')
        ).toBeInTheDocument();
        expect(screen.getByText('25')).toBeInTheDocument();
        expect(screen.getByText('12')).toBeInTheDocument();
    });

    it('keeps the rupee sign on the same line as the amount', () => {
        mockHook(detail());
        render(<CorporateCardLookup />);
        const balance = screen.getByText(/^₹.7,500\.00$/);
        // A non-breaking space, so a narrow tile cannot leave "₹" alone on its own line.
        expect(balance.textContent).toBe(`₹${String.fromCharCode(0xa0)}7,500.00`);
    });

    it('says "1 credit", not "1 credits"', () => {
        const one = detail();
        mockHook({ ...one, stats: { ...one.stats, topUpCount: 1 } });
        render(<CorporateCardLookup />);
        expect(screen.getByText(/^1 credit · /)).toBeInTheDocument();
    });

    it('strips emojis typed into the search bar before searching', () => {
        const onSearchDropdown = vi.fn();
        (useCorporateCardLookup as Mock).mockReturnValue({
            isLoading: false,
            fetchingOptions: false,
            data: null,
            options: [],
            onSearchDropdown,
            searchCorporate: vi.fn(),
            clear: vi.fn(),
        });
        render(<CorporateCardLookup />);
        const input = screen.getByRole('combobox');

        fireEvent.change(input, { target: { value: 'Ac😁me🚀' } });

        expect(onSearchDropdown).toHaveBeenLastCalledWith('Acme');
        expect(input).toHaveValue('Acme');
    });

    it('ignores a search made only of emojis', () => {
        const onSearchDropdown = vi.fn();
        (useCorporateCardLookup as Mock).mockReturnValue({
            isLoading: false,
            fetchingOptions: false,
            data: null,
            options: [],
            onSearchDropdown,
            searchCorporate: vi.fn(),
            clear: vi.fn(),
        });
        render(<CorporateCardLookup />);
        const input = screen.getByRole('combobox');

        fireEvent.change(input, { target: { value: '😁😁😁' } });

        expect(onSearchDropdown).toHaveBeenLastCalledWith('');
        expect(input).toHaveValue('');
    });

    it('swaps the section below when a tile is clicked', () => {
        mockHook(detail());
        render(<CorporateCardLookup />);
        expect(screen.getByText('Admins & Employees')).toBeInTheDocument();

        fireEvent.click(screen.getByText('Platform Activity'));
        expect(screen.getByText('activity-section')).toBeInTheDocument();

        fireEvent.click(screen.getByText('Wallet Balance'));
        expect(screen.getByText('topups-section')).toBeInTheDocument();

        fireEvent.click(screen.getByText('Physical Dispatches'));
        expect(screen.getByText('dispatches-section')).toBeInTheDocument();
    });
});

describe('MembersTable', () => {
    it("shows each member's KYC status and the rejection reason", () => {
        render(
            <MembersTable
                loading={false}
                members={[
                    member({
                        kyc: { status: 'REJECTED', reason: 'Face match failed', updatedAt: null },
                    }),
                ]}
            />
        );
        expect(screen.getByText('Rejected')).toBeInTheDocument();
        expect(screen.getByText('Face match failed')).toBeInTheDocument();
    });

    it('filters to admins only', () => {
        render(
            <MembersTable
                loading={false}
                members={[
                    member({ id: '1', name: 'Owner', role: 'Admin', isAccountOwner: true }),
                    member({ id: '2', name: 'Worker' }),
                ]}
            />
        );
        fireEvent.click(screen.getByText('Admins'));
        expect(screen.getByText('Owner')).toBeInTheDocument();
        expect(screen.queryByText('Worker')).not.toBeInTheDocument();
    });

    it('warns when the member directory was unavailable', () => {
        render(<MembersTable loading={false} members={[]} membersUnavailable />);
        expect(screen.getByText(/member directory could not be reached/)).toBeInTheDocument();
    });
});

describe('CardsTable', () => {
    it('pages the flat card list ten at a time', () => {
        const many = Array.from({ length: 12 }, (_, i) =>
            card({ id: i + 1, last4: String(1000 + i) })
        );
        render(<CardsTable cards={many} showHolder pageSize={10} />);
        expect(screen.getByText('•••• 1009')).toBeInTheDocument();
        expect(screen.queryByText('•••• 1010')).not.toBeInTheDocument();

        fireEvent.click(screen.getByTitle('2'));
        expect(screen.getByText('•••• 1010')).toBeInTheDocument();
        expect(screen.queryByText('•••• 1000')).not.toBeInTheDocument();
    });

    it("does not page a member's own card list", () => {
        const many = Array.from({ length: 12 }, (_, i) =>
            card({ id: i + 1, last4: String(1000 + i) })
        );
        render(<CardsTable cards={many} />);
        expect(screen.getByText('•••• 1011')).toBeInTheDocument();
    });

    it('shows last four digits, limit, and the AWB of a physical card', () => {
        render(
            <CardsTable
                showHolder
                cards={[
                    { ...card(), holderName: 'Aarav Sharma' },
                    {
                        ...card({
                            id: 8,
                            type: 'Physical',
                            last4: '9911',
                            deliveryStatus: 'In transit',
                            awbNumber: 'AWB123',
                            courierPartnerName: 'BlueDart',
                        }),
                        holderName: 'Aarav Sharma',
                    },
                ]}
            />
        );
        expect(screen.getByText('•••• 3657')).toBeInTheDocument();
        expect(screen.getByText('•••• 9911')).toBeInTheDocument();
        expect(screen.getByText('AWB123')).toBeInTheDocument();
        expect(screen.getByText('In transit')).toBeInTheDocument();
        expect(screen.getAllByText('Activated')).toHaveLength(2);
    });

    it('shows a frozen card as frozen and a failed card as failed', () => {
        render(
            <CardsTable
                cards={[
                    card({ cardState: 'FROZEN', freezeReasonLabel: 'Lost' }),
                    card({ id: 9, activationStatus: 'Failed', failureReason: 'Issuer code 91' }),
                ]}
            />
        );
        expect(screen.getByText('Frozen')).toBeInTheDocument();
        expect(screen.getByText('Failed')).toBeInTheDocument();
    });
});
