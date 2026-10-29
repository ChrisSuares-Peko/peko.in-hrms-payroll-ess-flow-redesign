import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import EInvoiceQuickActionCard from '../../../components/eInvoice/EInvoiceQuickActionCard';

describe('EInvoiceQuickActionCard', () => {
    it('renders title and description', () => {
        render(
            <EInvoiceQuickActionCard
                title="Generate IRN"
                description="Create a new IRN"
                onClick={vi.fn()}
            />
        );
        expect(screen.getByText('Generate IRN')).toBeInTheDocument();
        expect(screen.getByText('Create a new IRN')).toBeInTheDocument();
    });

    it('fires onClick when the card is clicked', () => {
        const onClick = vi.fn();
        const { container } = render(
            <EInvoiceQuickActionCard title="A" description="B" onClick={onClick} />
        );
        fireEvent.click(container.firstChild as HTMLElement);
        expect(onClick).toHaveBeenCalled();
    });
});
