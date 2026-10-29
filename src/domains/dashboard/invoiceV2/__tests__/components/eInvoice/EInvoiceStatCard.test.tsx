import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import EInvoiceStatCard from '../../../components/eInvoice/EInvoiceStatCard';

describe('EInvoiceStatCard', () => {
    it('renders label, value, and subLabel', () => {
        render(
            <EInvoiceStatCard
                label="Total IRNs"
                value="42"
                subLabel="last 30 days"
                bgColor="#FAFAFA"
                iconKey="total"
            />
        );
        expect(screen.getByText('Total IRNs')).toBeInTheDocument();
        expect(screen.getByText('42')).toBeInTheDocument();
        expect(screen.getByText('last 30 days')).toBeInTheDocument();
    });

    it('applies the given bgColor inline', () => {
        const { container } = render(
            <EInvoiceStatCard
                label="Active"
                value="10"
                subLabel=""
                bgColor="#FFEEEE"
                iconKey="active"
            />
        );
        expect(container.firstChild).toHaveStyle({ backgroundColor: '#FFEEEE' });
    });

    it.each([['total'], ['active'], ['cancelled'], ['waybill']] as const)(
        'renders an icon image for iconKey=%s',
        iconKey => {
            const { container } = render(
                <EInvoiceStatCard
                    label="x"
                    value="1"
                    subLabel="y"
                    bgColor="#fff"
                    iconKey={iconKey}
                />
            );
            expect(container.querySelector('img')).toBeInTheDocument();
        }
    );
});
