import type { FC } from 'react';

import { Button, Popconfirm } from 'antd';

import RuleSection, { CountPill } from './RuleSection';
import { timeAgo } from './ruleUtils';
import { BlockedSeller } from '../../../../types/ondcCatalogRules';

interface Props {
    sellers: BlockedSeller[];
    onBlock: () => void;
    onUnblock: (seller: BlockedSeller) => void;
}

const SellerStatus: FC<{ seller: BlockedSeller }> = ({ seller }) => {
    if (seller.hiding > 0) {
        return (
            <span className="text-[12px] font-semibold text-[#101828]">
                Hiding {seller.hiding} of {seller.total} products
            </span>
        );
    }
    if (seller.hiddenByEarlierRule > 0) {
        return (
            <span className="text-[12px] text-[#98A2B3]">
                0 of {seller.total} · already hidden by an earlier rule
            </span>
        );
    }
    return <span className="text-[12px] text-[#98A2B3]">No products in the catalog</span>;
};

const BlockedSellersCard: FC<Props> = ({ sellers, onBlock, onUnblock }) => {
    const hiding = sellers.reduce((sum, s) => sum + s.hiding, 0);

    return (
        <RuleSection
            title="Blocked sellers"
            count={sellers.length}
            description="Products from a blocked seller are hidden from corporates, including products they add later."
            extra={
                <>
                    <CountPill>Hiding {hiding} products</CountPill>
                    <Button size="small" onClick={onBlock}>
                        Block a seller
                    </Button>
                </>
            }
        >
            {sellers.length === 0 ? (
                <div className="rounded-lg border border-dashed border-[#EAECF0] py-6 text-center text-[12px] text-[#98A2B3]">
                    No sellers are blocked.
                </div>
            ) : (
                <div className="divide-y divide-[#F2F4F7]">
                    {sellers.map(s => {
                        const name = s.sellerName || s.providerId;
                        return (
                            <div
                                key={s.id}
                                className="grid grid-cols-1 gap-1.5 py-3 md:grid-cols-[minmax(0,1.1fr)_minmax(0,1.4fr)_minmax(0,1fr)_auto] md:items-center md:gap-4"
                            >
                                <div className="flex min-w-0 flex-col">
                                    <span className="truncate text-[13px] font-medium text-[#101828]">
                                        {name}
                                    </span>
                                    <span className="truncate font-mono text-[11px] text-[#98A2B3]">
                                        {s.providerId}
                                    </span>
                                </div>
                                <span className="text-[12px] text-[#475467]">{s.reason}</span>
                                <SellerStatus seller={s} />
                                <div className="flex items-center gap-4 md:justify-end">
                                    <span className="whitespace-nowrap text-[11px] text-[#98A2B3]">
                                        {s.blockedByName || 'Admin'} · {timeAgo(s.createdAt)}
                                    </span>
                                    <Popconfirm
                                        title={`Unblock ${name}?`}
                                        description="Their products can show again right away."
                                        okText="Unblock"
                                        onConfirm={() => onUnblock(s)}
                                    >
                                        <button
                                            type="button"
                                            className="cursor-pointer border-none bg-transparent p-0 text-[12px] font-medium text-lightRed hover:underline"
                                        >
                                            Unblock
                                        </button>
                                    </Popconfirm>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}
        </RuleSection>
    );
};

export default BlockedSellersCard;
