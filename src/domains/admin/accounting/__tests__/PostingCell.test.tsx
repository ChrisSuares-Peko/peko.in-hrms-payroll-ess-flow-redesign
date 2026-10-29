import '@testing-library/jest-dom/vitest';

import { fireEvent, render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { describe, expect, it } from 'vitest';

import PostingCell, { postingColumn } from '../components/common/PostingCell';

describe('PostingCell', () => {
    it('reads Posted in green with nothing under it', () => {
        const { container } = render(
            <PostingCell posting={{ state: 'posted', note: null, detail: null }} />
        );

        expect(screen.getByText('Posted')).toHaveClass('text-green-700');
        expect(container.querySelector('.cursor-help')).toBeNull();
    });

    it('reads Not posted in amber with the reason underneath', () => {
        render(
            <PostingCell posting={{ state: 'notPosted', note: 'Recording paused', detail: null }} />
        );

        expect(screen.getByText('Not posted')).toHaveClass('text-amber-700');
        expect(screen.getByText('Recording paused')).toHaveClass('text-xs', 'text-muted');
    });

    it('reads Not applicable in grey for a line that never goes to the books', () => {
        render(<PostingCell posting={{ state: 'notApplicable', note: null, detail: null }} />);

        expect(screen.getByText('Not applicable')).toHaveClass('text-muted');
    });

    it('shows the stored message on hover', async () => {
        const { container } = render(
            <PostingCell
                posting={{
                    state: 'notPosted',
                    note: 'Books refused it',
                    detail: 'Account 4210 not found',
                }}
            />
        );

        const trigger = container.querySelector('.cursor-help') as HTMLElement;
        expect(trigger).not.toBeNull();
        fireEvent.mouseEnter(trigger);

        expect(await screen.findByText('Account 4210 not found')).toBeInTheDocument();
    });

    it('shows the stored message to a keyboard user too', async () => {
        const { container } = render(
            <PostingCell
                posting={{
                    state: 'notPosted',
                    note: 'Books refused it',
                    detail: 'Duplicate reference',
                }}
            />
        );

        const trigger = container.querySelector('.cursor-help') as HTMLElement;
        expect(trigger).toHaveAttribute('tabindex', '0');
        fireEvent.focus(trigger);

        expect(await screen.findByText('Duplicate reference')).toBeInTheDocument();
    });

    it('renders nothing for a row with no status, such as a statement opening line', () => {
        const { container, rerender } = render(<PostingCell posting={null} />);
        expect(container).toBeEmptyDOMElement();

        rerender(<PostingCell />);
        expect(container).toBeEmptyDOMElement();
    });
});

describe('a Not posted cell that knows where to fix it', () => {
    it('links the label to the manual journal page, but only while the entry is not posted', () => {
        const { rerender } = render(
            <MemoryRouter>
                <PostingCell
                    posting={{ state: 'notPosted', note: 'Not recorded yet', detail: null }}
                    to="/fix/TXN-1"
                />
            </MemoryRouter>
        );
        expect(screen.getByRole('link', { name: 'Not posted' })).toHaveAttribute(
            'href',
            '/fix/TXN-1'
        );

        rerender(
            <MemoryRouter>
                <PostingCell
                    posting={{ state: 'posted', note: null, detail: null }}
                    to="/fix/TXN-1"
                />
            </MemoryRouter>
        );
        expect(screen.queryByRole('link')).toBeNull();
        expect(screen.getByText('Posted')).toBeInTheDocument();
    });

    it('builds the link from the row through the column factory', () => {
        const column = postingColumn<{
            posting: { state: 'notPosted'; note: null; detail: null };
            id: string;
        }>({
            linkTo: row => `/fix/${row.id}`,
        });
        const cell = column.render?.(
            undefined,
            { posting: { state: 'notPosted', note: null, detail: null }, id: 'TXN-2' },
            0
        );
        render(<MemoryRouter>{cell as React.ReactElement}</MemoryRouter>);
        expect(screen.getByRole('link', { name: 'Not posted' })).toHaveAttribute(
            'href',
            '/fix/TXN-2'
        );
    });
});

describe('postingColumn', () => {
    it('is the Posted column, wide enough for the reason line', () => {
        const column = postingColumn();

        expect(column).toMatchObject({ title: 'Posted', key: 'posting', width: 160 });
        expect('neverFold' in column).toBe(false);
    });
});
