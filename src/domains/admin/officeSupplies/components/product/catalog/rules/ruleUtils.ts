import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';

import { RuleLastChange, RuleSectionKey } from '../../../../types/ondcCatalogRules';

dayjs.extend(relativeTime);

export const timeAgo = (iso: string) => dayjs(iso).fromNow();

/** "Changed 3 days ago by Peko Admin", or the empty-state text. */
export const changeText = (
    change: RuleLastChange | null | undefined,
    empty = 'No changes recorded yet'
) => (change ? `Changed ${timeAgo(change.createdAt)} by ${change.actorName || 'Admin'}` : empty);

export const plural = (n: number, one: string, many = `${one}s`) => `${n} ${n === 1 ? one : many}`;

export const SECTION_TITLES: Record<RuleSectionKey, string> = {
    domains: 'Domains we ingest',
    sellers: 'Blocked sellers',
    keywords: 'Banned keywords',
    priceSanity: 'Price sanity',
    topDeals: 'Storefront Top deals',
};
