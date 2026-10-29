import React from 'react';

import { Flex, Typography } from 'antd';

import SelectableCard from './SelectableCard';
import { PricingType, QuoteConfig } from '../../types/pricing';
import { fmt } from '../../utils/pricingCalc';
import RupeeSymbol from '../RupeeSymbol';

interface OfficePickerProps {
    pricing: PricingType;
    config: QuoteConfig;
    onChange: (next: QuoteConfig) => void;
}

const OfficePicker: React.FC<OfficePickerProps> = ({ pricing, config, onChange }) => {
    const offices = pricing.offices ?? [];
    if (offices.length === 0) return null;

    const mandatory = pricing.office_mandatory === true;

    const update = (officeIdx: number | null) => onChange({ ...config, office_idx: officeIdx });

    return (
        <Flex vertical gap={14}>
            <Typography.Text className="text-lg font-semibold text-neutral-900">
                Office {mandatory ? '(Required)' : '(Optional)'}
            </Typography.Text>
            <Flex gap={12} wrap="wrap" align="stretch">
                {!mandatory && (
                    <SelectableCard
                        selected={config.office_idx == null}
                        onClick={() => update(null)}
                        padding="14px 18px"
                    >
                        <Typography.Text className="text-sm font-semibold text-neutral-900">
                            No office
                        </Typography.Text>
                    </SelectableCard>
                )}
                {offices.map((office, idx) => (
                    <SelectableCard
                        key={`${office.label}-${idx}`}
                        selected={config.office_idx === idx}
                        onClick={() => update(idx)}
                        padding="14px 18px"
                    >
                        <Flex vertical gap={4}>
                            <Typography.Text className="text-sm font-semibold text-neutral-900">
                                {office.label}
                            </Typography.Text>
                            <Flex align="center" gap={2}>
                                <RupeeSymbol size={12} currency={pricing.currency} />
                                <Typography.Text className="text-xs text-neutral-600">
                                    {fmt(office.price)}
                                </Typography.Text>
                            </Flex>
                        </Flex>
                    </SelectableCard>
                ))}
            </Flex>
        </Flex>
    );
};

export default OfficePicker;
