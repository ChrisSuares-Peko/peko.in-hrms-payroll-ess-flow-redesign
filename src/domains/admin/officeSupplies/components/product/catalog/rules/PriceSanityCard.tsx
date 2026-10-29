import { FC, useEffect, useState } from 'react';

import { Button, InputNumber } from 'antd';

import RuleSection, { ChangeMeta, CountPill } from './RuleSection';
import { changeText } from './ruleUtils';
import { RuleLastChange } from '../../../../types/ondcCatalogRules';

interface Props {
    maxDiscountPct: number | null;
    /** Top-deal candidates the cap currently keeps out */
    excluded: number;
    lastChange: RuleLastChange | null;
    saving: boolean;
    onSave: (value: number | null) => void;
    onHistory: () => void;
}

const PriceSanityCard: FC<Props> = ({
    maxDiscountPct,
    excluded,
    lastChange,
    saving,
    onSave,
    onHistory,
}) => {
    const [value, setValue] = useState<number | null>(maxDiscountPct);
    useEffect(() => setValue(maxDiscountPct), [maxDiscountPct]);

    const dirty = value !== maxDiscountPct;

    return (
        <RuleSection
            title="Price sanity"
            description="Sellers set their own MRP. A discount above this limit usually means the MRP is inflated, so the product is left out of Top deals. It stays in the catalog."
            extra={<CountPill>Keeping {excluded} out of Top deals</CountPill>}
        >
            <div className="flex flex-wrap items-center gap-3">
                <span className="text-[12px] text-[#344054]">
                    Leave a product out of Top deals when its discount against the seller&apos;s MRP
                    is more than
                </span>
                <InputNumber
                    size="small"
                    min={1}
                    max={99}
                    precision={0}
                    placeholder="Off"
                    value={value}
                    onChange={setValue}
                    addonAfter="%"
                    className="!w-[104px]"
                />
                <Button
                    size="small"
                    type="primary"
                    disabled={!dirty}
                    loading={saving}
                    onClick={() => onSave(value)}
                >
                    Save
                </Button>
                <ChangeMeta text={changeText(lastChange)} onHistory={onHistory} />
            </div>
            <div className="mt-3 text-[11px] text-[#98A2B3]">
                Clear the box and save to switch the limit off.
            </div>
        </RuleSection>
    );
};

export default PriceSanityCard;
