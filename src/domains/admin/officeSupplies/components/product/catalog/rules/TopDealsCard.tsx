import { FC, useEffect, useState } from 'react';

import { Button, InputNumber } from 'antd';

import RuleSection, { ChangeMeta, CountPill } from './RuleSection';
import { changeText } from './ruleUtils';
import { RuleLastChange } from '../../../../types/ondcCatalogRules';

interface Props {
    minPrice: number | null;
    /** Top-deal candidates priced below the minimum */
    belowMinPrice: number;
    lastChange: RuleLastChange | null;
    saving: boolean;
    onSave: (value: number | null) => void;
    onHistory: () => void;
}

const TopDealsCard: FC<Props> = ({
    minPrice,
    belowMinPrice,
    lastChange,
    saving,
    onSave,
    onHistory,
}) => {
    const [value, setValue] = useState<number | null>(minPrice);
    useEffect(() => setValue(minPrice), [minPrice]);

    const dirty = value !== minPrice;

    return (
        <RuleSection
            title="Storefront Top deals"
            description="The Top deals rail on the corporate home page, ranked by the biggest discount. Only products at or above this price can appear in it; the catalog itself is not affected."
            extra={<CountPill>{belowMinPrice} below the minimum</CountPill>}
        >
            <div className="flex flex-wrap items-center gap-3">
                <span className="text-[12px] text-[#344054]">Only products priced at or above</span>
                <InputNumber
                    size="small"
                    min={0}
                    precision={0}
                    placeholder="Off"
                    value={value}
                    onChange={setValue}
                    addonBefore="₹"
                    className="!w-[128px]"
                />
                <span className="text-[12px] text-[#344054]">can appear in Top deals.</span>
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
                Clear the box and save to switch the minimum off.
            </div>
        </RuleSection>
    );
};

export default TopDealsCard;
