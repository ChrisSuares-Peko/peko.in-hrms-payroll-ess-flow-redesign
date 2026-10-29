import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import LabelValueRow from '../../../components/shared/LabelValueRow';

describe('LabelValueRow', () => {
    it('renders label and value', () => {
        render(<LabelValueRow label="GSTIN" value="29ABCDE1234F1Z5" />);
        expect(screen.getByText('GSTIN')).toBeInTheDocument();
        expect(screen.getByText('29ABCDE1234F1Z5')).toBeInTheDocument();
    });

    it('applies bold styling when bold is true', () => {
        render(<LabelValueRow label="Total" value="₹1,000" bold />);
        expect(screen.getByText('Total')).toHaveClass('font-bold');
        expect(screen.getByText('₹1,000')).toHaveClass('font-bold');
    });

    it('uses subdued color when bold is not set', () => {
        render(<LabelValueRow label="Note" value="-" />);
        expect(screen.getByText('Note')).toHaveClass('text-[#475467]');
    });
});
