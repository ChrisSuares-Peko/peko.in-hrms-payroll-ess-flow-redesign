import { FC, useRef, useState } from 'react';

import { Flex, Skeleton } from 'antd';

import { useAppDispatch } from '@src/hooks/store';
import { showToast } from '@src/slices/apiSlice';

import BannedKeywordsCard from './BannedKeywordsCard';
import BlockedSellersCard from './BlockedSellersCard';
import BlockSellerModal from './BlockSellerModal';
import DeleteExistingModal, { DeleteExistingPrompt } from './DeleteExistingModal';
import DomainsCard from './DomainsCard';
import PriceSanityCard from './PriceSanityCard';
import RuleHistoryDrawer, { HistoryTarget } from './RuleHistoryDrawer';
import TopDealsCard from './TopDealsCard';
import UnmappedCategoriesBanner from './UnmappedCategoriesBanner';
import VisibilitySummaryCard from './VisibilitySummaryCard';
import useOndcCatalogRules from '../../../../hooks/products/useOndcCatalogRules';
import { MatchPreview, SellerOption } from '../../../../types/ondcCatalogRules';

type RunRule = (deleteExisting: boolean) => Promise<boolean>;

/**
 * Rules tab of Manage › Products. Domain, seller and keyword rules hide
 * matching products; before saving one, a preview counts products it already
 * matches and, if any, the admin decides whether to keep them (hidden) or
 * delete them.
 */
const CatalogRulesTab: FC<{ onOpenReview: () => void }> = ({ onOpenReview }) => {
    const dispatch = useAppDispatch();
    const rules = useOndcCatalogRules();

    const [historyFor, setHistoryFor] = useState<HistoryTarget | null>(null);
    const [blockOpen, setBlockOpen] = useState(false);
    const [blocking, setBlocking] = useState(false);
    const [savingDomains, setSavingDomains] = useState(false);
    const [savingTopDeals, setSavingTopDeals] = useState<'minPrice' | 'maxDiscountPct' | null>(
        null
    );

    const [prompt, setPrompt] = useState<DeleteExistingPrompt | null>(null);
    const [deleting, setDeleting] = useState(false);
    const pending = useRef<{ run: RunRule; resolve: (done: boolean) => void } | null>(null);

    /** Runs the rule straight away when nothing stored matches, otherwise asks first. */
    const withDeletePrompt = (
        preview: MatchPreview | false,
        ruleLabel: string,
        run: RunRule,
        allowKeep = true
    ) => {
        if (!preview) {
            dispatch(
                showToast({
                    variant: 'error',
                    description: 'Could not check existing products. Try again.',
                })
            );
            return Promise.resolve(false);
        }
        if (!preview.total) return run(false);
        return new Promise<boolean>(resolve => {
            pending.current = { run, resolve };
            setPrompt({ ruleLabel, count: preview.total, sample: preview.sample, allowKeep });
        });
    };

    const settlePrompt = async (deleteExisting: boolean | null) => {
        const { current } = pending;
        if (!current) return;
        let done = false;
        if (deleteExisting !== null) {
            setDeleting(true);
            done = await current.run(deleteExisting);
            setDeleting(false);
        }
        pending.current = null;
        setPrompt(null);
        current.resolve(done);
    };

    const saveDomains = async (changes: { code: string; enabled: boolean }[]) => {
        setSavingDomains(true);
        const turnedOff = changes.filter(c => !c.enabled).map(c => c.code);
        const run: RunRule = del => rules.saveDomains(changes, del);
        if (turnedOff.length) {
            const names = rules.domains.filter(d => turnedOff.includes(d.code)).map(d => d.name);
            await withDeletePrompt(
                await rules.previewDomains(turnedOff),
                `Switching off ${names.join(', ')}`,
                run
            );
        } else {
            await run(false);
        }
        setSavingDomains(false);
    };

    const blockSeller = async (seller: SellerOption, reason: string) => {
        setBlocking(true);
        const name = seller.sellerName || seller.providerId;
        const done = await withDeletePrompt(
            await rules.previewSeller(seller),
            `Blocking ${name}`,
            del => rules.blockSeller(seller, reason, del)
        );
        setBlocking(false);
        if (done) setBlockOpen(false);
    };

    const saveTopDeals = async (key: 'minPrice' | 'maxDiscountPct', value: number | null) => {
        setSavingTopDeals(key);
        await rules.saveTopDeals({ [key]: value });
        setSavingTopDeals(null);
    };

    const { summary, topDeals } = rules;
    if (rules.isLoading && !summary) return <Skeleton active paragraph={{ rows: 12 }} />;

    const hiddenCount = (key: string) => summary?.hiddenBy.find(h => h.key === key)?.count ?? 0;

    return (
        <Flex vertical gap={16}>
            {summary && (
                <VisibilitySummaryCard summary={summary} onHistory={() => setHistoryFor('all')} />
            )}
            <DomainsCard
                domains={rules.domains}
                hiding={hiddenCount('domain')}
                lastChange={rules.domainsChange}
                saving={savingDomains}
                onSave={saveDomains}
                onHistory={() => setHistoryFor('domains')}
            />
            <BlockedSellersCard
                sellers={rules.sellers}
                onBlock={() => setBlockOpen(true)}
                onUnblock={rules.unblockSeller}
            />
            <BannedKeywordsCard
                keywords={rules.keywords}
                hiding={hiddenCount('keyword')}
                lastChange={rules.keywordsChange}
                onPreview={rules.previewKeywords}
                onAdd={(words, preview) =>
                    withDeletePrompt(
                        {
                            total: preview.total,
                            sample: preview.words.flatMap(w => w.sample).slice(0, 5),
                        },
                        `Banning ${words.map(w => `"${w}"`).join(', ')}`,
                        () => rules.addKeywords(words, true), // banned products are never kept
                        false
                    )
                }
                onRemove={rules.removeKeyword}
                onHistory={() => setHistoryFor('keywords')}
            />
            {topDeals && (
                <>
                    <PriceSanityCard
                        maxDiscountPct={topDeals.maxDiscountPct}
                        excluded={topDeals.overDiscountCap}
                        lastChange={topDeals.lastChange.priceSanity}
                        saving={savingTopDeals === 'maxDiscountPct'}
                        onSave={v => saveTopDeals('maxDiscountPct', v)}
                        onHistory={() => setHistoryFor('priceSanity')}
                    />
                    <TopDealsCard
                        minPrice={topDeals.minPrice}
                        belowMinPrice={topDeals.belowMinPrice}
                        lastChange={topDeals.lastChange.topDeals}
                        saving={savingTopDeals === 'minPrice'}
                        onSave={v => saveTopDeals('minPrice', v)}
                        onHistory={() => setHistoryFor('topDeals')}
                    />
                </>
            )}
            {summary && (
                <UnmappedCategoriesBanner
                    waitingProducts={summary.unmapped.products}
                    sellerCategories={summary.unmapped.sellerCategories}
                    excludedProducts={summary.unmapped.excludedProducts}
                    onOpenReview={onOpenReview}
                />
            )}

            <BlockSellerModal
                open={blockOpen}
                submitting={blocking}
                searchSellers={rules.searchSellerOptions}
                onCancel={() => setBlockOpen(false)}
                onConfirm={blockSeller}
            />
            <DeleteExistingModal
                prompt={prompt}
                loading={deleting}
                onKeep={() => settlePrompt(false)}
                onDelete={() => settlePrompt(true)}
                onCancel={() => settlePrompt(null)}
            />
            <RuleHistoryDrawer
                target={historyFor}
                fetchHistory={rules.fetchHistory}
                onClose={() => setHistoryFor(null)}
            />
        </Flex>
    );
};

export default CatalogRulesTab;
