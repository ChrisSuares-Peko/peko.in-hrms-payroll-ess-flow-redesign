import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import ReviewCard from '../../../components/shared/ReviewCard';

describe('ReviewCard', () => {
    it('renders title and all rows', () => {
        render(
            <ReviewCard
                title="Seller"
                rows={[
                    { label: 'GSTIN', value: '29ABCDE1234F1Z5' },
                    { label: 'Name', value: 'Acme' },
                ]}
            />
        );
        expect(screen.getByText('Seller')).toBeInTheDocument();
        expect(screen.getByText('GSTIN')).toBeInTheDocument();
        expect(screen.getByText('29ABCDE1234F1Z5')).toBeInTheDocument();
        expect(screen.getByText('Name')).toBeInTheDocument();
        expect(screen.getByText('Acme')).toBeInTheDocument();
    });

    it('substitutes em-dash for empty values', () => {
        render(<ReviewCard title="x" rows={[{ label: 'Y', value: '' }]} />);
        expect(screen.getByText('—')).toBeInTheDocument();
    });
});
