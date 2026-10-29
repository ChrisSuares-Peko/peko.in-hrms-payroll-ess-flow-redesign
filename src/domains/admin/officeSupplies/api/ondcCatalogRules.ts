import { UserPayload } from '@customtypes/general';
import { ApiClient } from '@src/services/config';

import {
    BannedKeyword,
    BlockedSeller,
    CatalogRulesSummary,
    KeywordPreview,
    MatchPreview,
    OndcDomainRule,
    RuleHistoryEntry,
    RuleSectionKey,
    SellerOption,
    TopDealsRules,
    WithLastChange,
} from '../types/ondcCatalogRules';

/** Manage > Products > Rules. Every call resolves to `false` on failure. */

const base = (p: UserPayload) => `${p.userType}/${p.userId}/purchase/ecommerce/ondc/rules`;

// The response interceptor already unwraps axios' `data`, leaving the server body.
const unwrap = <T>(resp: any): T => resp?.data ?? resp;

const request = async <T>(label: string, run: () => Promise<any>): Promise<T | false> => {
    try {
        return unwrap<T>(await run());
    } catch (err) {
        console.error(`${label} failed:`, err);
        return false;
    }
};

export const getRulesSummaryApi = (p: UserPayload) =>
    request<CatalogRulesSummary>('getRulesSummary', () =>
        ApiClient.get(`${base(p)}/summary`, { params: { _ts: Date.now() } })
    );

/** `section` omitted = every rule's history. */
export const getRuleHistoryApi = (p: UserPayload & { section?: RuleSectionKey; page?: number }) =>
    request<{ recordsTotal: number; data: RuleHistoryEntry[] }>('getRuleHistory', () =>
        ApiClient.get(`${base(p)}/history`, {
            params: { section: p.section, page: p.page ?? 1, itemsPerPage: 50, _ts: Date.now() },
        })
    );

// ─── Domains ───
export const getRuleDomainsApi = (p: UserPayload) =>
    request<WithLastChange<OndcDomainRule>>('getRuleDomains', () =>
        ApiClient.get(`${base(p)}/domains`, { params: { _ts: Date.now() } })
    );

export const previewRuleDomainsApi = (p: UserPayload & { codes: string[] }) =>
    request<MatchPreview>('previewRuleDomains', () =>
        ApiClient.post(`${base(p)}/domains/preview`, { codes: p.codes })
    );

export const updateRuleDomainsApi = (
    p: UserPayload & { changes: { code: string; enabled: boolean }[]; deleteExisting: boolean }
) =>
    request<{ changed: unknown[]; deletedCount: number }>('updateRuleDomains', () =>
        ApiClient.put(`${base(p)}/domains`, {
            changes: p.changes,
            deleteExisting: p.deleteExisting,
        })
    );

// ─── Blocked sellers ───
export const getBlockedSellersApi = (p: UserPayload) =>
    request<WithLastChange<BlockedSeller>>('getBlockedSellers', () =>
        ApiClient.get(`${base(p)}/blocked-sellers`, { params: { _ts: Date.now() } })
    );

export const getSellerOptionsApi = (p: UserPayload & { search: string }) =>
    request<{ data: SellerOption[] }>('getSellerOptions', () =>
        ApiClient.get(`${base(p)}/seller-options`, {
            params: { search: p.search, _ts: Date.now() },
        })
    );

export const previewBlockSellerApi = (p: UserPayload & { bppId: string; providerId: string }) =>
    request<MatchPreview>('previewBlockSeller', () =>
        ApiClient.post(`${base(p)}/blocked-sellers/preview`, {
            bppId: p.bppId,
            providerId: p.providerId,
        })
    );

export const blockSellerApi = (
    p: UserPayload & {
        bppId: string;
        providerId: string;
        sellerName: string | null;
        reason: string;
        deleteExisting: boolean;
    }
) =>
    request<{ deletedCount: number }>('blockSeller', () =>
        ApiClient.post(`${base(p)}/blocked-sellers`, {
            bppId: p.bppId,
            providerId: p.providerId,
            sellerName: p.sellerName,
            reason: p.reason,
            deleteExisting: p.deleteExisting,
        })
    );

export const unblockSellerApi = (p: UserPayload & { id: number }) =>
    request<{ id: number }>('unblockSeller', () =>
        ApiClient.delete(`${base(p)}/blocked-sellers/${p.id}`)
    );

// ─── Banned keywords ───
export const getBannedKeywordsApi = (p: UserPayload) =>
    request<WithLastChange<BannedKeyword>>('getBannedKeywords', () =>
        ApiClient.get(`${base(p)}/keywords`, { params: { _ts: Date.now() } })
    );

export const previewBannedKeywordsApi = (p: UserPayload & { words: string[] }) =>
    request<KeywordPreview>('previewBannedKeywords', () =>
        ApiClient.post(`${base(p)}/keywords/preview`, { words: p.words })
    );

export const addBannedKeywordsApi = (
    p: UserPayload & { words: string[]; deleteExisting: boolean }
) =>
    request<{ added: string[]; deletedCount: number }>('addBannedKeywords', () =>
        ApiClient.post(`${base(p)}/keywords`, { words: p.words, deleteExisting: p.deleteExisting })
    );

export const removeBannedKeywordApi = (p: UserPayload & { id: number }) =>
    request<{ id: number }>('removeBannedKeyword', () =>
        ApiClient.delete(`${base(p)}/keywords/${p.id}`)
    );

// ─── Top deals ───
export const getTopDealsRulesApi = (p: UserPayload) =>
    request<TopDealsRules>('getTopDealsRules', () =>
        ApiClient.get(`${base(p)}/top-deals`, { params: { _ts: Date.now() } })
    );

export const updateTopDealsRulesApi = (
    p: UserPayload & { patch: { minPrice?: number | null; maxDiscountPct?: number | null } }
) =>
    request<TopDealsRules>('updateTopDealsRules', () =>
        ApiClient.put(`${base(p)}/top-deals`, p.patch)
    );
