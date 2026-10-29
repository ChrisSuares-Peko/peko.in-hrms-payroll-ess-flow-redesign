import React from 'react';

import { Checkbox, Flex, Typography } from 'antd';

import Stepper from './Stepper';
import { PricingType, QuoteConfig } from '../../types/pricing';
import { formatMoney } from '../../utils/pricingCalc';

interface ConfigureSetupProps {
    pricing: PricingType;
    config: QuoteConfig;
    onChange: (next: QuoteConfig) => void;
}

const ConfigureSetup: React.FC<ConfigureSetupProps> = ({ pricing, config, onChange }) => {
    const update = (patch: Partial<QuoteConfig>) => onChange({ ...config, ...patch });

    // Volume-based visa selection only makes sense for table/tiered pricing,
    // or when the fixed-pricing record opens up an explicit max_visas range.
    // Fixed-with-single-package gets its visa count from fixed_packages[0].visas.
    const showVisaRow =
        pricing.pricing_model === 'table' ||
        pricing.pricing_model === 'tiered' ||
        (pricing.max_visas != null && pricing.max_visas > 0);

    const showActivityRow =
        pricing.included_activities != null && pricing.extra_activity_fee != null;

    const showShareholderRow =
        pricing.included_shareholders != null && pricing.extra_shareholder_fee != null;

    const showGeneralTrading =
        pricing.general_trading_fee != null && pricing.included_activities != null;

    if (!showVisaRow && !showActivityRow && !showShareholderRow && !showGeneralTrading) {
        return null;
    }

    const visaMin = pricing.min_visas ?? 0;
    const visaMax = pricing.max_visas;
    const activityMax = pricing.max_activities;
    const shareholderMax = pricing.max_shareholders;

    const visibleRows: Array<'visa' | 'activity' | 'shareholder' | 'general_trading'> = [];
    if (showVisaRow) visibleRows.push('visa');
    if (showActivityRow) visibleRows.push('activity');
    if (showShareholderRow) visibleRows.push('shareholder');
    if (showGeneralTrading) visibleRows.push('general_trading');

    const borderBetween = (idx: number) =>
        idx < visibleRows.length - 1 ? '1px solid #F3F4F6' : 'none';

    return (
        <Flex vertical gap={12}>
            <Typography.Text className="text-lg font-semibold text-neutral-900">
                Configure Your Setup
            </Typography.Text>

            <Flex
                vertical
                gap={0}
                className="rounded-2xl bg-white"
                style={{ border: '1px solid #E5E7EB' }}
            >
                {visibleRows.map((row, idx) => {
                    if (row === 'visa') {
                        return (
                            <Flex
                                key="visa"
                                justify="space-between"
                                align="center"
                                style={{ padding: '16px 20px', borderBottom: borderBetween(idx) }}
                            >
                                <Typography.Text className="text-sm text-neutral-700">
                                    Visas
                                </Typography.Text>
                                <Stepper
                                    value={config.visa}
                                    min={visaMin}
                                    max={visaMax}
                                    onChange={visa => update({ visa })}
                                />
                            </Flex>
                        );
                    }
                    if (row === 'activity') {
                        return (
                            <Flex
                                key="activity"
                                justify="space-between"
                                align="center"
                                style={{ padding: '16px 20px', borderBottom: borderBetween(idx) }}
                            >
                                <Typography.Text className="text-sm text-neutral-700">
                                    Activities{' '}
                                    {pricing.included_activities != null && (
                                        <span className="text-neutral-500">
                                            ({pricing.included_activities} included)
                                        </span>
                                    )}
                                </Typography.Text>
                                <Stepper
                                    value={config.activity}
                                    min={0}
                                    max={activityMax}
                                    onChange={activity => update({ activity })}
                                />
                            </Flex>
                        );
                    }
                    if (row === 'shareholder') {
                        return (
                            <Flex
                                key="shareholder"
                                justify="space-between"
                                align="center"
                                style={{ padding: '16px 20px', borderBottom: borderBetween(idx) }}
                            >
                                <Typography.Text className="text-sm text-neutral-700">
                                    Shareholders{' '}
                                    {pricing.included_shareholders != null && (
                                        <span className="text-neutral-500">
                                            ({pricing.included_shareholders} included)
                                        </span>
                                    )}
                                </Typography.Text>
                                <Stepper
                                    value={config.shareholder}
                                    min={0}
                                    max={shareholderMax}
                                    onChange={shareholder => update({ shareholder })}
                                />
                            </Flex>
                        );
                    }
                    return (
                        <Flex
                            key="general_trading"
                            align="center"
                            gap={8}
                            style={{ padding: '16px 20px', borderBottom: borderBetween(idx) }}
                        >
                            <Checkbox
                                checked={Boolean(config.general_trading)}
                                onChange={e => update({ general_trading: e.target.checked })}
                            >
                                <Typography.Text className="text-sm text-neutral-700">
                                    General Trading (+
                                    {formatMoney(
                                        pricing.general_trading_fee ?? 0,
                                        pricing.currency
                                    )}
                                    )
                                </Typography.Text>
                            </Checkbox>
                        </Flex>
                    );
                })}
            </Flex>
        </Flex>
    );
};

export default ConfigureSetup;
