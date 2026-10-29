import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import GstinLookupEmptyState from '../../../components/gstinLookup/GstinLookupEmptyState';

describe('GstinLookupEmptyState', () => {
    it('renders the empty state copy', () => {
        render(<GstinLookupEmptyState />);
        expect(screen.getByText('Enter a GSTIN to verify and fetch details')).toBeInTheDocument();
        expect(
            screen.getByText('Supports all registered taxpayers on GST portal')
        ).toBeInTheDocument();
    });
});
