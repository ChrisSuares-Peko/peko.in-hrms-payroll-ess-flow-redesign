import React from 'react';

import { Flex, Typography } from 'antd';

import SelectableCard from './SelectableCard';
import { PricingType, QuoteConfig } from '../../types/pricing';
import { fmt } from '../../utils/pricingCalc';
import RupeeSymbol from '../RupeeSymbol';

interface EstablishmentCardPickerProps {
    pricing: PricingType;
    config: QuoteConfig;
    onChange: (next: QuoteConfig) => void;
}

const EstablishmentCardPicker: React.FC<EstablishmentCardPickerProps> = ({
    pricing,
    config,
    onChange,
}) => {
    const options = pricing.establishment_card_options ?? [];
    if (options.length === 0) return null;

    const selectedIdx = config.est_card_idx ?? 0;

    const update = (idx: number) => onChange({ ...config, est_card_idx: idx });

    return (
        <Flex vertical gap={14}>
            <Typography.Text className="text-base font-semibold text-neutral-900">
                Establishment Card
            </Typography.Text>
            <Flex gap={12} wrap="wrap" align="stretch">
                {options.map((option, idx) => (
                    <SelectableCard
                        key={`${option.label}-${idx}`}
                        selected={selectedIdx === idx}
                        onClick={() => update(idx)}
                        padding="14px 18px"
                    >
                        <Flex vertical gap={4}>
                            <Typography.Text className="text-sm font-semibold text-neutral-900">
                                {option.label}
                            </Typography.Text>
                            <Flex align="center" gap={2}>
                                <RupeeSymbol size={12} currency={pricing.currency} />
                                <Typography.Text className="text-xs text-neutral-600">
                                    {fmt(option.price)}
                                </Typography.Text>
                            </Flex>
                        </Flex>
                    </SelectableCard>
                ))}
            </Flex>
        </Flex>
    );
};

export default EstablishmentCardPicker;
