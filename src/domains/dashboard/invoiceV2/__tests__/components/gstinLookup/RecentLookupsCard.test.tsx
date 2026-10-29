import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import RecentLookupsCard from '../../../components/gstinLookup/RecentLookupsCard';
import { GstinRecentLookup } from '../../../types/gstinLookup';

const sample: GstinRecentLookup[] = [
    { gstin: '29ABCDE1234F1Z5', legalName: 'Acme', status: 'Active' },
    { gstin: '07XYZAB5678G1Z9', legalName: 'Beta', status: 'Cancelled' },
];

describe('RecentLookupsCard', () => {
    it('renders empty state when no lookups', () => {
        render(<RecentLookupsCard lookups={[]} />);
        expect(screen.getByText('No recent searches')).toBeInTheDocument();
    });

    it('renders lookup rows with gstin, name and status', () => {
        render(<RecentLookupsCard lookups={sample} />);
        expect(screen.getByText('29ABCDE1234F1Z5')).toBeInTheDocument();
        expect(screen.getByText('Acme')).toBeInTheDocument();
        expect(screen.getByText('Active')).toBeInTheDocument();
        expect(screen.getByText('Cancelled')).toBeInTheDocument();
    });

    it('invokes onSelect with gstin when a row is clicked', () => {
        const onSelect = vi.fn();
        render(<RecentLookupsCard lookups={sample} onSelect={onSelect} />);
        fireEvent.click(screen.getByText('29ABCDE1234F1Z5'));
        expect(onSelect).toHaveBeenCalledWith('29ABCDE1234F1Z5');
    });
});
