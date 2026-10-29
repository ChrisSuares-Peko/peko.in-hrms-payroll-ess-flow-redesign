import '@testing-library/jest-dom/vitest';

import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { describe, expect, it } from 'vitest';

import { FAQ_ENTRIES, FAQ_SCREENS, faqEntryId } from '../faq/accountingFaq';
import { FAQ_CONCEPTS } from '../faq/faqConcepts';
import AccountingFaq, { filterConcepts, filterEntries } from '../pages/AccountingFaq';

const renderAt = (path = '/system-user/accounting/faq') =>
    render(
        <MemoryRouter initialEntries={[path]}>
            <AccountingFaq />
        </MemoryRouter>
    );

const tab = (label: string) => screen.getByText(label, { selector: 'button' });
const queryTab = (label: string) => screen.queryByText(label, { selector: 'button' });

const search = (value: string) =>
    fireEvent.change(screen.getByPlaceholderText(/Search a figure/), { target: { value } });

describe('AccountingFaq', () => {
    it('opens on the concepts tab, with one more tab per screen', () => {
        renderAt();

        expect(screen.getByText('How the numbers are calculated')).toBeInTheDocument();
        FAQ_CONCEPTS.forEach(concept => {
            expect(screen.getByText(concept.title)).toBeInTheDocument();
        });
        FAQ_SCREENS.forEach(faqScreen => {
            expect(tab(faqScreen)).toBeInTheDocument();
        });
        expect(screen.queryByText(FAQ_ENTRIES[0].label)).not.toBeInTheDocument();
    });

    it('shows one tab at a time and switches on click', () => {
        renderAt();

        fireEvent.click(tab('Partners'));

        FAQ_ENTRIES.filter(item => item.screen === 'Partners').forEach(item => {
            expect(screen.getAllByText(item.label).length).toBeGreaterThan(0);
        });
        expect(screen.queryByText(FAQ_CONCEPTS[0].title)).not.toBeInTheDocument();
    });

    it('switches to the tab a deep link points at, opens the entry and shows how it is worked out', async () => {
        const id = faqEntryId('Vendors', 'Transactions', 'Vendor Amount');
        renderAt(`/system-user/accounting/faq#${id}`);

        await waitFor(() =>
            expect(
                screen.getByText('What is Vendor Amount on a vendor transaction?')
            ).toBeInTheDocument()
        );
        expect(
            screen.getByText(
                /^Vendor amount = Vendor payable \+ Commission \(incl\. GST\) \+ Vendor’s price on items sold as principal$/
            )
        ).toBeInTheDocument();
        expect(screen.getAllByText(/Last reviewed 2026-/).length).toBeGreaterThan(0);
        expect(screen.queryByText(FAQ_CONCEPTS[0].title)).not.toBeInTheDocument();
    });

    it('follows a "Read with" link back to the concepts tab and opens that concept', async () => {
        const id = faqEntryId('Vendors', 'Transactions', 'Vendor Amount');
        const entry = FAQ_ENTRIES.find(item => item.id === id)!;
        const concept = FAQ_CONCEPTS.find(item => item.id === entry.concepts[0])!;
        renderAt(`/system-user/accounting/faq#${id}`);

        fireEvent.click(await screen.findByText(concept.title, { selector: 'a' }));

        await waitFor(() => expect(screen.getByText(concept.summary)).toBeInTheDocument());
        expect(screen.queryByText('Vendor Amount')).not.toBeInTheDocument();
    });

    it('shows no developer material on any tab', () => {
        renderAt();

        FAQ_SCREENS.forEach(faqScreen => {
            fireEvent.click(tab(faqScreen));
            expect(document.body.textContent).not.toMatch(
                /\.js\b|\.tsx\b|journalData|journalRecordStatus/
            );
        });
        expect(screen.queryByText('Where it comes from')).not.toBeInTheDocument();
    });

    it('keeps only the tabs the search matches', () => {
        renderAt();

        search('yet to receive');

        expect(tab('Payment Gateways')).toBeInTheDocument();
        expect(queryTab('Vendors')).not.toBeInTheDocument();
    });

    it('moves to the first tab left when the search empties the open one', () => {
        const hits = filterEntries(FAQ_ENTRIES, 'share base');
        const firstScreen = FAQ_SCREENS.find(faqScreen =>
            hits.some(item => item.screen === faqScreen)
        )!;
        const firstHit = hits.find(item => item.screen === firstScreen)!;
        expect(filterConcepts(FAQ_CONCEPTS, 'share base')).toEqual([]);
        expect(hits.some(item => item.screen === 'Vendors')).toBe(false);

        renderAt();
        fireEvent.click(tab('Vendors'));
        search('share base');

        expect(queryTab('Vendors')).not.toBeInTheDocument();
        expect(queryTab('Concepts')).not.toBeInTheDocument();
        expect(screen.getAllByText(firstHit.label).length).toBeGreaterThan(0);
    });

    it('says so when nothing matches', () => {
        renderAt();

        search('zzzz-nothing-like-this');

        expect(screen.getByText('Nothing matches that search.')).toBeInTheDocument();
    });
});

describe('the filters', () => {
    it('match label, question, answer, formula and tab, case-insensitively', () => {
        expect(filterEntries(FAQ_ENTRIES, '').length).toBe(FAQ_ENTRIES.length);
        expect(filterEntries(FAQ_ENTRIES, 'GMV').map(item => item.label)).toContain('GMV');
        expect(filterEntries(FAQ_ENTRIES, 'share base').length).toBeGreaterThan(0);
        expect(filterConcepts(FAQ_CONCEPTS, 'go-live').map(item => item.id)).toContain(
            'go-live-floor'
        );
        expect(filterEntries(FAQ_ENTRIES, 'zzzz-nothing')).toEqual([]);
    });
});
