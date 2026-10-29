import { fireEvent, render, screen, within } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import ComplaintMobileTable from '../../../components/complaintRegistration/ComplaintMobileTable';

const complaints = [
    {
        id: 1,
        createdAt: '2026-09-01T10:30:00.000Z',
        issueType: 'Refund',
        description: 'Amount not credited',
        status: 'PENDING',
        bbpsSupportHistory: {
            complaintId: 'CMP-1',
            complaintAssigned: 'Biller',
            requestBody: { txnRefId: 'TXN-1' },
        },
    },
    {
        id: 2,
        createdAt: '2026-09-05T08:00:00.000Z',
        issueType: 'Wrong Bill',
        description: 'Overcharged',
        status: 'RESOLVED',
        bbpsSupportHistory: null,
    },
];

describe('ComplaintMobileTable', () => {
    it('renders a Date / Type / Status header instead of a single collapsed column', () => {
        render(<ComplaintMobileTable complaints={complaints} isLoading={false} />);
        ['Date', 'Type', 'Status'].forEach(heading =>
            expect(screen.getByText(heading)).toBeInTheDocument()
        );
    });

    it('shows one summary line per complaint with its type and status', () => {
        render(<ComplaintMobileTable complaints={complaints} isLoading={false} />);
        expect(screen.getByText('Refund')).toBeInTheDocument();
        expect(screen.getByText('Wrong Bill')).toBeInTheDocument();
        expect(screen.getByText('ASSIGNED')).toBeInTheDocument();
        expect(screen.getByText('RESOLVED')).toBeInTheDocument();
    });

    it('keeps the remaining fields hidden until the row is expanded', () => {
        render(<ComplaintMobileTable complaints={complaints} isLoading={false} />);
        expect(screen.queryByText('CMP-1')).not.toBeInTheDocument();

        fireEvent.click(screen.getAllByRole('button', { name: 'Show complaint details' })[0]);

        expect(screen.getByText('CMP-1')).toBeInTheDocument();
        expect(screen.getByText('TXN-1')).toBeInTheDocument();
        expect(screen.getByText('Biller')).toBeInTheDocument();
        expect(screen.getByText('Amount not credited')).toBeInTheDocument();
    });

    it('collapses the row again on a second click', () => {
        render(<ComplaintMobileTable complaints={complaints} isLoading={false} />);
        const toggle = screen.getAllByRole('button', { name: 'Show complaint details' })[0];
        fireEvent.click(toggle);
        fireEvent.click(screen.getByRole('button', { name: 'Hide complaint details' }));
        expect(screen.queryByText('CMP-1')).not.toBeInTheDocument();
    });

    it('falls back to N/A when the biller sent no support history', () => {
        render(<ComplaintMobileTable complaints={[complaints[1]]} isLoading={false} />);
        fireEvent.click(screen.getByRole('button', { name: 'Show complaint details' }));
        const expanded = screen.getByText('Complaint ID :').closest('div')
            ?.parentElement as HTMLElement;
        expect(within(expanded).getAllByText('N/A')).toHaveLength(3);
    });

    it('shows the empty state rather than a bare header when there are no complaints', () => {
        render(<ComplaintMobileTable complaints={[]} isLoading={false} />);
        expect(screen.getByText('No data found')).toBeInTheDocument();
        expect(screen.queryByRole('button', { name: 'Show complaint details' })).not.toBeInTheDocument();
    });

    it('shows a skeleton while loading and no empty state', () => {
        const { container } = render(<ComplaintMobileTable complaints={[]} isLoading />);
        expect(container.querySelector('.ant-skeleton')).toBeInTheDocument();
        expect(screen.queryByText('No data found')).not.toBeInTheDocument();
    });
});
