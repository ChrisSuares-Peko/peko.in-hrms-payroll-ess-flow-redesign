import React from 'react';

import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';

import DocumentEmptyState from '../../../components/documentDetails/DocumentEmptyState';

describe('DocumentEmptyState', () => {
    it('renders the empty title and description', () => {
        render(<DocumentEmptyState />);

        expect(screen.getByText('No Document Available')).toBeInTheDocument();
        expect(
            screen.getByText('Document details will appear here once generated.')
        ).toBeInTheDocument();
    });
});
