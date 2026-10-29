import type { FC, ReactNode } from 'react';

import { OndcCategoryTreeRow } from '../../../../types/ondcCategory';
import {
    ListingPosition,
    PekoCategoryRef,
    SellerCategory,
    SellerCategoryProduct,
    SellerCategoryStatus,
} from '../../../../types/ondcSellerCategory';
import { Pill } from '../../../detail/DetailPrimitives';
import { plural, timeAgo } from '../rules/ruleUtils';

const STATUS_STYLE: Record<SellerCategoryStatus, { bg: string; color: string; label: string }> = {
    unmapped: { bg: '#FEF3C7', color: '#B54708', label: 'Unmapped' },
    mapped: { bg: '#ECFDF3', color: '#027A48', label: 'Mapped' },
    excluded: { bg: '#F2F4F7', color: '#475467', label: 'Excluded' },
};

export const StatusPill: FC<{ status: SellerCategoryStatus }> = ({ status }) => (
    <Pill bg={STATUS_STYLE[status].bg} color={STATUS_STYLE[status].color}>
        {STATUS_STYLE[status].label}
    </Pill>
);

export const NewPill: FC = () => (
    <span className="rounded bg-[#FEF2F2] px-1.5 py-[1px] text-[10px] font-medium text-lightRed">
        New
    </span>
);

/** A mapped seller category with products nobody has reviewed yet. */
export const NewProductsPill: FC<{ count: number }> = ({ count }) => (
    <span className="rounded bg-[#FEF2F2] px-1.5 py-[1px] text-[10px] font-medium text-lightRed">
        {plural(count, 'new product')}
    </span>
);

/** `ONDC:RET10` → blue `RET10` pill */
export const DomainPill: FC<{ code: string }> = ({ code }) => (
    <Pill bg="#EFF4FF" color="#3538CD">
        {code.replace(/^ONDC:/, '')}
    </Pill>
);

export const pekoCategoryLabel = (c: PekoCategoryRef | null) =>
    c ? [c.parentName, c.name].filter(Boolean).join(' › ') : null;

/** "NutriMart Wellness Foods, FreshCart Grocers via Mystore, Dpanda" */
export const sourcesText = (c: SellerCategory) => {
    const sellers =
        c.sellers.join(', ') +
        (c.sellerCount > c.sellers.length ? ` +${c.sellerCount - c.sellers.length}` : '');
    const via = c.sellerNps.length ? `via ${c.sellerNps.join(', ')}` : '';
    return [sellers, via].filter(Boolean).join(' · ');
};

/** The Reviewed column / header line: who decided and when, or when it first arrived. */
export const reviewedText = (c: SellerCategory) => {
    if (c.status !== 'unmapped' && c.decidedAt) {
        const verb = c.status === 'mapped' ? 'Mapped' : 'Excluded';
        return `${verb} ${timeAgo(c.decidedAt)}${c.decidedByName ? ` by ${c.decidedByName}` : ''}`;
    }
    return c.firstSeenAt ? `First seen ${timeAgo(c.firstSeenAt)}` : '—';
};

/** Grey line under a product's switch explaining why the system hides it. */
export const hiddenReasonText = (p: SellerCategoryProduct, category: SellerCategory | null) => {
    switch (p.hiddenReason) {
        case 'unmapped':
            return `Category not mapped: ${category?.label ?? 'this seller category'}`;
        case 'excluded':
            return 'Seller category excluded from listing';
        case 'sellerNp':
            return 'Seller NP is disabled';
        case 'domain':
            return `Domain ${String(p.hiddenDetail ?? '').replace(/^ONDC:/, '')} is switched off`;
        case 'seller':
            return 'Seller is blocked';
        case 'keyword':
            return `Banned word: ${p.hiddenDetail}`;
        case 'categoryWord':
            return `Contains "${p.hiddenDetail}" (hidden for this seller category)`;
        case 'categoryOff':
            return 'Peko category is switched off';
        case 'pending':
            return 'New — waiting for review';
        default:
            if (!p.inStock) return 'Out of stock';
            return null;
    }
};

export const productCountsText = (c: SellerCategory) =>
    `${plural(c.productCount, 'product')} · ${c.visibleCount} visible · ${c.hiddenCount} hidden`;

/** TreeSelect data: parents are group headers, only subcategories can be picked. */
export const categoryTreeData = (tree: OndcCategoryTreeRow[]) =>
    tree.map(parent => ({
        title: parent.name,
        value: `parent-${parent.id}`,
        selectable: false,
        children: parent.subcategories.map(sub => ({
            title: `${sub.name}${sub.enabled ? '' : ' (off)'}`,
            value: sub.id,
        })),
    }));

/** Storefront listing position: the default order shows core first, low last. */
export const LISTING_POSITIONS: { value: ListingPosition; label: string; description: string }[] = [
    {
        value: 'core',
        label: 'Core',
        description:
            'What an office comes to buy: laptops, phones, printers, paper, pens. First pages.',
    },
    {
        value: 'useful',
        label: 'Useful',
        description:
            'Everyday supplies and equipment. The default for a newly mapped seller category.',
    },
    {
        value: 'accessory',
        label: 'Accessory',
        description:
            'Add-ons and consumables: cables, batteries, clips, tape. After the main products.',
    },
    { value: 'low', label: 'Low', description: 'Rarely bought or niche items. Shown last.' },
];
export const DEFAULT_POSITION: ListingPosition = 'useful';
/** Per-product select value meaning "no override, use the seller category's position". */
export const FOLLOW = 'follow';
export type PositionChoice = ListingPosition | typeof FOLLOW;

export const positionLabel = (value: ListingPosition) =>
    LISTING_POSITIONS.find(p => p.value === value)?.label ?? value;

/** Per-product options: "Follows …" first, then the four positions. */
export const positionOptions = (
    inherited: ListingPosition,
    short = false
): { value: PositionChoice; label: string; description: string }[] => [
    {
        value: FOLLOW,
        label: `${short ? 'Follows' : 'Follows seller category'} (${positionLabel(inherited)})`,
        description: '',
    },
    ...LISTING_POSITIONS,
];

/** Select `optionRender`: label over a wrapping description. */
export const renderPositionOption = (o: { label?: ReactNode; data: { description?: string } }) => (
    <div className="py-0.5">
        <div className="text-[13px] text-[#101828]">{o.label}</div>
        {o.data.description && (
            <div className="whitespace-normal text-[12px] text-[#667085]">{o.data.description}</div>
        )}
    </div>
);
