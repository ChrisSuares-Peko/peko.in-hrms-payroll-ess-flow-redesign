import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import SummaryCard from '../../../components/shared/SummaryCard';

describe('SummaryCard', () => {
    it('renders the title and all rows', () => {
        render(
            <SummaryCard
                title="Summary"
                rows={[
                    { label: 'Amount', value: '₹100' },
                    { label: 'Tax', value: '₹18' },
                ]}
            />
        );

        expect(screen.getByText('Summary')).toBeInTheDocument();
        expect(screen.getByText('Amount')).toBeInTheDocument();
        expect(screen.getByText('₹100')).toBeInTheDocument();
        expect(screen.getByText('Tax')).toBeInTheDocument();
        expect(screen.getByText('₹18')).toBeInTheDocument();
    });
});
