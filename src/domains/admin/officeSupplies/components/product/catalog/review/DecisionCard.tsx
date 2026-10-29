import { FC, ReactNode, useEffect, useState } from 'react';

import { InfoCircleOutlined } from '@ant-design/icons';
import { Button, Input, Radio, Select, Tooltip, TreeSelect, Typography } from 'antd';

import { LISTING_POSITIONS, categoryTreeData, renderPositionOption } from './reviewUtils';
import { OndcCategoryTreeRow } from '../../../../types/ondcCategory';
import {
    ListingPosition,
    SellerCategory,
    SellerCategoryStatus,
} from '../../../../types/ondcSellerCategory';
import { plural } from '../rules/ruleUtils';

interface Props {
    category: SellerCategory;
    tree: OndcCategoryTreeRow[];
    onSave: (
        status: SellerCategoryStatus,
        pekoCategoryId: number | null,
        listingPosition?: ListingPosition,
        hideKeywords?: string[]
    ) => Promise<boolean>;
}

/** "Protein, Whey-Isolate" → ["protein", "whey isolate"]: the server's stored form. */
const parseWords = (text: string) => [
    ...new Set(
        text
            .split(',')
            .map(w => w.toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim())
            .filter(Boolean)
    ),
];

const FieldLabel: FC<{ tip: string; children: ReactNode }> = ({ tip, children }) => (
    <div className="mb-2 flex items-center gap-1.5 text-[13px] font-semibold text-[#101828]">
        {children}
        <Tooltip title={tip}>
            <InfoCircleOutlined className="cursor-help text-[13px] font-normal text-[#98A2B3]" />
        </Tooltip>
    </div>
);

const subName = (tree: OndcCategoryTreeRow[], id: number | null) => {
    const parent = tree.find(p => p.subcategories.some(s => s.id === id));
    const sub = parent?.subcategories.find(s => s.id === id);
    return parent && sub ? `${parent.name} › ${sub.name}` : null;
};

/** "Decision for this seller category": show under a Peko subcategory, exclude, or wait. */
const DecisionCard: FC<Props> = ({ category, tree, onSave }) => {
    const [status, setStatus] = useState<SellerCategoryStatus>(category.status);
    const [pekoCategoryId, setPekoCategoryId] = useState<number | null>(
        category.pekoCategory?.id ?? null
    );
    const savedWords = category.hideKeywords.join(', ');
    const [position, setPosition] = useState<ListingPosition>(category.listingPosition);
    const [hideKeywords, setHideKeywords] = useState(savedWords);
    const [saving, setSaving] = useState(false);

    const reset = () => {
        setStatus(category.status);
        setPekoCategoryId(category.pekoCategory?.id ?? null);
        setPosition(category.listingPosition);
        setHideKeywords(savedWords);
    };
    useEffect(reset, [
        category.status,
        category.pekoCategory?.id,
        category.listingPosition,
        savedWords,
    ]);

    // position and words only show (and save) for "Show under a Peko category"
    const words = parseWords(hideKeywords);
    const dirty =
        status !== category.status ||
        (status === 'mapped' &&
            (pekoCategoryId !== (category.pekoCategory?.id ?? null) ||
                position !== category.listingPosition ||
                words.join(',') !== category.hideKeywords.join(',')));
    const valid = status !== 'mapped' || pekoCategoryId != null;
    const n = plural(category.productCount, 'product');

    let effect: string;
    if (status === 'unmapped') effect = `All ${n} stay hidden until a decision is made.`;
    else if (status === 'excluded')
        effect = `All ${n} are hidden, and so are new ones in this seller category.`;
    else if (pekoCategoryId == null)
        effect = 'Choose the Peko subcategory these products belong to.';
    else {
        effect = `Products show under ${subName(tree, pekoCategoryId) ?? 'that category'}, unless a rule on the Rules tab or a product switch hides them.`;
        if (words.length)
            effect += ` Products containing ${words.map(w => `"${w}"`).join(', ')} stay hidden.`;
    }

    const save = async () => {
        setSaving(true);
        if (status === 'mapped') await onSave(status, pekoCategoryId, position, words);
        else await onSave(status, null);
        setSaving(false);
    };

    return (
        <section className="rounded-xl border border-[#EAECF0] bg-white p-5">
            <Typography.Text className="text-[13px] font-semibold text-[#101828]">
                Decision for this seller category
            </Typography.Text>

            <Radio.Group
                className="!mt-3 flex flex-col gap-2.5"
                value={status}
                onChange={e => setStatus(e.target.value)}
            >
                <Radio value="mapped">Show under a Peko category</Radio>
                {status === 'mapped' && (
                    <TreeSelect
                        className="!ml-6 !w-[calc(100%-24px)]"
                        placeholder="Choose a subcategory"
                        value={pekoCategoryId ?? undefined}
                        onChange={v => setPekoCategoryId(typeof v === 'number' ? v : null)}
                        treeData={categoryTreeData(tree)}
                        treeDefaultExpandAll
                        showSearch
                        treeNodeFilterProp="title"
                    />
                )}
                <Radio value="excluded">Exclude from listing</Radio>
                <Radio value="unmapped">Leave undecided for now</Radio>
            </Radio.Group>

            {status === 'mapped' && (
                <>
                    <div className="mt-4">
                        <FieldLabel tip="Where these products appear in the storefront listing, relative to other categories.">
                            Position in the storefront listing
                        </FieldLabel>
                        <Select
                            className="w-full"
                            value={position}
                            onChange={setPosition}
                            options={LISTING_POSITIONS}
                            optionRender={renderPositionOption}
                        />
                    </div>

                    <div className="mt-4">
                        <FieldLabel tip="Products in this seller category whose name or description contains any of these words stay hidden. Separate words with commas.">
                            Hide products containing
                        </FieldLabel>
                        <Input
                            placeholder="e.g. protein, supplement, immunity"
                            value={hideKeywords}
                            onChange={e => setHideKeywords(e.target.value)}
                            allowClear
                        />
                    </div>
                </>
            )}

            <div className="mt-4 rounded-lg bg-[#F9FAFB] px-3 py-2.5 text-[12px] text-[#475467]">
                {effect}
            </div>

            <div className="mt-4 flex gap-2">
                <Button type="primary" disabled={!dirty || !valid} loading={saving} onClick={save}>
                    Save
                </Button>
                <Button disabled={!dirty || saving} onClick={reset}>
                    Cancel
                </Button>
            </div>
            <div className="mt-3 text-[11px] text-[#98A2B3]">
                Nothing changes for corporates until you press Save. The choice also applies to
                products that arrive later.
            </div>
        </section>
    );
};

export default DecisionCard;
