import '@testing-library/jest-dom/vitest';

import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import Header from '../../components/OrderJournal/Header';

vi.mock('@src/hooks/useScreenSize', () => ({ default: () => ({ xs: false }) }));

const PARTNERS = [
    { value: 'default', label: 'Default' },
    { value: '55', label: 'Gulf Reach' },
];

const renderHeader = (overrides: Record<string, unknown> = {}) => {
    const props = {
        handleSearch: vi.fn(),
        searchText: '',
        setSearchText: vi.fn(),
        handleCategoryFilters: vi.fn(),
        handleDateChange: vi.fn(),
        handleFromChange: vi.fn(),
        handleToChange: vi.fn(),
        handlePartnerChange: vi.fn(),
        partnerOptions: PARTNERS,
        from: '2026-09-01',
        to: '2026-09-29',
        status: '',
        ...overrides,
    };
    const view = render(<Header {...props} />);
    return { props, view };
};

describe('Order Journals header actions', () => {
    it('shows what the page puts beside the filters', () => {
        renderHeader({ actions: <button type="button">Export</button> });

        expect(screen.getByRole('button', { name: 'Export' })).toBeInTheDocument();
    });

    it('shows only the filters when the page has no actions', () => {
        renderHeader();

        expect(screen.queryByRole('button', { name: 'Export' })).not.toBeInTheDocument();
    });
});

describe('Order Journals partner filter', () => {
    it('offers Peko itself and every partner, and sends the one picked', async () => {
        const { props } = renderHeader();

        fireEvent.mouseDown(screen.getByText('All partners'));
        expect(await screen.findByTitle('Default')).toBeInTheDocument();
        fireEvent.click(await screen.findByTitle('Gulf Reach'));

        expect(props.handlePartnerChange).toHaveBeenCalledWith('55');
    });

    it('goes back to every partner when the choice is cleared', () => {
        const { props, view } = renderHeader({ partnerId: '55' });

        const clear = view.container.querySelector('.ant-select-clear');
        expect(clear).not.toBeNull();
        fireEvent.mouseDown(clear as Element);

        expect(props.handlePartnerChange).toHaveBeenCalledWith(undefined);
    });

    it('holds a partner user to their own partner', () => {
        renderHeader({ partnerId: '55', partnerLocked: true });

        const picker = screen.getByTitle('Gulf Reach').closest('.ant-select');
        expect(picker).toHaveClass('ant-select-disabled');
    });
});
