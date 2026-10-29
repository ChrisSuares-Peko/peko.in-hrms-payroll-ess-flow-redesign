import { useCallback, useEffect, useState } from 'react';

import { useAppDispatch, useAppSelector } from '@src/hooks/store';
import { showToast } from '@src/slices/apiSlice';

import {
    addBannedKeywordsApi,
    blockSellerApi,
    getBannedKeywordsApi,
    getBlockedSellersApi,
    getRuleDomainsApi,
    getRuleHistoryApi,
    getRulesSummaryApi,
    getSellerOptionsApi,
    getTopDealsRulesApi,
    previewBannedKeywordsApi,
    previewBlockSellerApi,
    previewRuleDomainsApi,
    removeBannedKeywordApi,
    unblockSellerApi,
    updateRuleDomainsApi,
    updateTopDealsRulesApi,
} from '../../api/ondcCatalogRules';
import {
    BannedKeyword,
    BlockedSeller,
    CatalogRulesSummary,
    OndcDomainRule,
    RuleLastChange,
    RuleSectionKey,
    SellerOption,
    TopDealsRules,
} from '../../types/ondcCatalogRules';

const deletedNote = (n: number) =>
    n ? ` ${n} existing ${n === 1 ? 'product' : 'products'} deleted.` : '';

/**
 * Manage > Products > Rules: loads every section, exposes previews (used to
 * ask whether to delete already-stored matches) and writes. Each write
 * refetches its section plus the summary counts.
 */
const useOndcCatalogRules = () => {
    const { role, id } = useAppSelector(state => state.reducer.auth);
    const dispatch = useAppDispatch();
    const user = { userId: id, userType: role };

    const [isLoading, setIsLoading] = useState(true);
    const [summary, setSummary] = useState<CatalogRulesSummary | null>(null);
    const [domains, setDomains] = useState<OndcDomainRule[]>([]);
    const [domainsChange, setDomainsChange] = useState<RuleLastChange | null>(null);
    const [sellers, setSellers] = useState<BlockedSeller[]>([]);
    const [keywords, setKeywords] = useState<BannedKeyword[]>([]);
    const [keywordsChange, setKeywordsChange] = useState<RuleLastChange | null>(null);
    const [topDeals, setTopDeals] = useState<TopDealsRules | null>(null);

    const toast = (ok: boolean, success: string, failure: string) =>
        dispatch(
            showToast({ variant: ok ? 'success' : 'error', description: ok ? success : failure })
        );

    const loadSummary = useCallback(async () => {
        const res = await getRulesSummaryApi({ userId: id, userType: role });
        if (res) setSummary(res);
    }, [id, role]);

    const loadDomains = useCallback(async () => {
        const res = await getRuleDomainsApi({ userId: id, userType: role });
        if (res) {
            setDomains(res.data || []);
            setDomainsChange(res.lastChange);
        }
    }, [id, role]);

    const loadSellers = useCallback(async () => {
        const res = await getBlockedSellersApi({ userId: id, userType: role });
        if (res) setSellers(res.data || []);
    }, [id, role]);

    const loadKeywords = useCallback(async () => {
        const res = await getBannedKeywordsApi({ userId: id, userType: role });
        if (res) {
            setKeywords(res.data || []);
            setKeywordsChange(res.lastChange);
        }
    }, [id, role]);

    const loadTopDeals = useCallback(async () => {
        const res = await getTopDealsRulesApi({ userId: id, userType: role });
        if (res) setTopDeals(res);
    }, [id, role]);

    useEffect(() => {
        if (!id) return;
        setIsLoading(true);
        Promise.all([
            loadSummary(),
            loadDomains(),
            loadSellers(),
            loadKeywords(),
            loadTopDeals(),
        ]).finally(() => setIsLoading(false));
    }, [id, loadSummary, loadDomains, loadSellers, loadKeywords, loadTopDeals]);

    // ─── Domains ───
    const previewDomains = (codes: string[]) => previewRuleDomainsApi({ ...user, codes });

    const saveDomains = async (
        changes: { code: string; enabled: boolean }[],
        deleteExisting: boolean
    ) => {
        const res = await updateRuleDomainsApi({ ...user, changes, deleteExisting });
        toast(
            !!res,
            `Domains updated.${res ? deletedNote(res.deletedCount) : ''}`,
            'Could not update domains.'
        );
        if (res) await Promise.all([loadDomains(), loadSummary()]);
        return !!res;
    };

    // ─── Sellers ───
    const searchSellerOptions = async (search: string): Promise<SellerOption[]> => {
        const res = await getSellerOptionsApi({ ...user, search });
        return res ? res.data || [] : [];
    };

    const previewSeller = (seller: SellerOption) =>
        previewBlockSellerApi({ ...user, bppId: seller.bppId, providerId: seller.providerId });

    const blockSeller = async (seller: SellerOption, reason: string, deleteExisting: boolean) => {
        const res = await blockSellerApi({
            ...user,
            bppId: seller.bppId,
            providerId: seller.providerId,
            sellerName: seller.sellerName,
            reason,
            deleteExisting,
        });
        const name = seller.sellerName || seller.providerId;
        toast(
            !!res,
            `${name} blocked.${res ? deletedNote(res.deletedCount) : ''}`,
            `Could not block ${name}.`
        );
        if (res) await Promise.all([loadSellers(), loadSummary()]);
        return !!res;
    };

    const unblockSeller = async (seller: BlockedSeller) => {
        const res = await unblockSellerApi({ ...user, id: seller.id });
        const name = seller.sellerName || seller.providerId;
        toast(!!res, `${name} unblocked.`, `Could not unblock ${name}.`);
        if (res) await Promise.all([loadSellers(), loadSummary()]);
        return !!res;
    };

    // ─── Keywords ───
    const previewKeywords = (words: string[]) => previewBannedKeywordsApi({ ...user, words });

    const addKeywords = async (words: string[], deleteExisting: boolean) => {
        const res = await addBannedKeywordsApi({ ...user, words, deleteExisting });
        const n = res ? res.added.length : 0;
        toast(
            !!res,
            n
                ? `${n} ${n === 1 ? 'word' : 'words'} banned.${deletedNote(res ? res.deletedCount : 0)}`
                : 'Those words were already banned.',
            'Could not ban the words.'
        );
        if (res) await Promise.all([loadKeywords(), loadSummary()]);
        return !!res;
    };

    const removeKeyword = async (keyword: BannedKeyword) => {
        const res = await removeBannedKeywordApi({ ...user, id: keyword.id });
        toast(!!res, `"${keyword.word}" removed.`, `Could not remove "${keyword.word}".`);
        if (res) await Promise.all([loadKeywords(), loadSummary()]);
        return !!res;
    };

    // ─── Top deals ───
    const saveTopDeals = async (patch: {
        minPrice?: number | null;
        maxDiscountPct?: number | null;
    }) => {
        const res = await updateTopDealsRulesApi({ ...user, patch });
        toast(!!res, 'Top deals rules updated.', 'Could not update Top deals rules.');
        if (res) await loadTopDeals();
        return !!res;
    };

    const fetchHistory = async (section?: RuleSectionKey) => {
        const res = await getRuleHistoryApi({ ...user, section });
        return res ? res.data || [] : [];
    };

    return {
        isLoading,
        summary,
        domains,
        domainsChange,
        sellers,
        keywords,
        keywordsChange,
        topDeals,
        previewDomains,
        saveDomains,
        searchSellerOptions,
        previewSeller,
        blockSeller,
        unblockSeller,
        previewKeywords,
        addKeywords,
        removeKeyword,
        saveTopDeals,
        fetchHistory,
    };
};

export default useOndcCatalogRules;
