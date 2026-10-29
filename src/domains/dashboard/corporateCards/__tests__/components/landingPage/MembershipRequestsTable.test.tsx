import { fireEvent, render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { CardRequestItem } from '../../../api/admin/requestsApi';
import MembershipRequestsTable from '../../../components/landingPage/MembershipRequestsTable';

vi.mock('@components/atomic/GenericTable', () => ({
    default: ({ columns, dataSource, loading }: any) => {
        if (loading) return <div data-testid="loading">Loading</div>;
        return (
            <div data-testid="table">
                {(dataSource ?? []).map((row: any) => (
                    <div key={row.key} data-testid="row">
                        {columns.map((column: any) => (
                            <div key={column.key}>
                                {column.render
                                    ? column.render(row[column.dataIndex], row)
                                    : row[column.dataIndex]}
                            </div>
                        ))}
                    </div>
                ))}
            </div>
        );
    },
}));

const request = (overrides: Partial<CardRequestItem> = {}): CardRequestItem =>
    ({
        id: 5,
        date: '2026-10-14T06:00:00.000Z',
        requestType: 'MEMBERSHIP',
        status: 'PENDING',
        reason: null,
        decisionNote: null,
        decidedAt: null,
        cardIssuanceId: null,
        cardLast4: null,
        payload: {},
        result: {},
        member: 'Rakshita',
        memberEmail: 'rakshita@example.com',
        holderId: 77,
        ...overrides,
    }) as CardRequestItem;

const onApprove = vi.fn();
const onReject = vi.fn();

const renderTable = (props = {}) =>
    render(
        <MembershipRequestsTable
            requests={[request()]}
            approvingIds={[]}
            rejectingIds={[]}
            onApprove={onApprove}
            onReject={onReject}
            page={1}
            pageSize={10}
            total={1}
            onPageChange={vi.fn()}
            {...props}
        />
    );

beforeEach(() => vi.clearAllMocks());

describe('MembershipRequestsTable', () => {
    it('names the employee behind the request', () => {
        renderTable();
        expect(screen.getByText('Rakshita')).toBeInTheDocument();
        expect(screen.getByText('rakshita@example.com')).toBeInTheDocument();
    });

    it('does not decide anything until the admin confirms', () => {
        renderTable();
        fireEvent.click(screen.getByRole('button', { name: 'Approve' }));

        expect(onApprove).not.toHaveBeenCalled();
        expect(screen.getByText('Approve Access Request?')).toBeInTheDocument();
    });

    it('approves the request once confirmed', () => {
        renderTable();
        fireEvent.click(screen.getByRole('button', { name: 'Approve' }));
        fireEvent.click(screen.getByRole('button', { name: 'Approve Access' }));

        expect(onApprove).toHaveBeenCalledWith(5);
        expect(onReject).not.toHaveBeenCalled();
    });

    it('rejects the request once confirmed', () => {
        renderTable();
        fireEvent.click(screen.getByRole('button', { name: 'Reject' }));

        expect(screen.getByText('Reject Access Request?')).toBeInTheDocument();
        fireEvent.click(screen.getByRole('button', { name: 'Yes, Reject' }));

        expect(onReject).toHaveBeenCalledWith(5);
        expect(onApprove).not.toHaveBeenCalled();
    });

    it('blocks the opposite action while one is in flight', () => {
        renderTable({ approvingIds: [5] });
        expect(screen.getByRole('button', { name: 'Reject' })).toBeDisabled();
    });

    it('shows the loader instead of rows while fetching', () => {
        renderTable({ isLoading: true });
        expect(screen.getByTestId('loading')).toBeInTheDocument();
    });
});
