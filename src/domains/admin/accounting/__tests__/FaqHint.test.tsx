import '@testing-library/jest-dom/vitest';

import { render, screen } from '@testing-library/react';
import { ColumnsType } from 'antd/es/table';
import { MemoryRouter } from 'react-router-dom';
import { describe, expect, it } from 'vitest';

import { faqEntryId } from '../faq/accountingFaq';
import { FAQ_PATH, FaqHint, faqAnchorPath, faqHint, withFaqTitles } from '../faq/FaqHint';

type Row = { commission: number | null; note: string };

const columns: ColumnsType<Row> = [
    { title: 'Commission (incl. GST)', key: 'commissionIncludingGST', width: 180 },
    { title: 'Something Unregistered', key: 'mystery', width: 120 },
    { title: <b>Already a node</b>, key: 'node', width: 120 },
];

describe('withFaqTitles', () => {
    it('wraps only the titles that have an entry, and leaves the rest untouched', () => {
        const wrapped = withFaqTitles(columns, 'Vendors', 'Commissions');

        expect(wrapped[1]).toBe(columns[1]);
        expect(wrapped[2]).toBe(columns[2]);
        expect(wrapped[0]).not.toBe(columns[0]);

        render(<MemoryRouter>{wrapped[0].title as JSX.Element}</MemoryRouter>);

        expect(screen.getByText('Commission (incl. GST)')).toBeInTheDocument();
        const link = screen.getByRole('link', {
            name: 'How is Commission (incl. GST) calculated?',
        });
        expect(link).toHaveAttribute(
            'href',
            faqAnchorPath(faqEntryId('Vendors', 'Commissions', 'Commission (incl. GST)'))
        );
    });
});

describe('faqHint', () => {
    it('returns nothing for a label with no entry', () => {
        expect(faqHint('Vendors', 'Commissions', 'Something Unregistered')).toBeNull();
    });

    it('deep-links into the FAQ page under the accounting portal', () => {
        expect(FAQ_PATH).toBe('/system-user/accounting/faq');
        render(
            <MemoryRouter>
                <FaqHint id={faqEntryId('Dashboard', 'KPIs', 'Total GMV')} />
            </MemoryRouter>
        );
        expect(screen.getByRole('link')).toHaveAttribute(
            'href',
            '/system-user/accounting/faq#dashboard.kpis.total-gmv'
        );
    });

    it('renders nothing for an unknown id', () => {
        const { container } = render(
            <MemoryRouter>
                <FaqHint id="nothing.here.at-all" />
            </MemoryRouter>
        );
        expect(container).toBeEmptyDOMElement();
    });
});
