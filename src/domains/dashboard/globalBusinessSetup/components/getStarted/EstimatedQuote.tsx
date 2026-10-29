import React from 'react';

import { Divider, Flex, Typography } from 'antd';

import { PricingType, QuoteConfig } from '../../types/pricing';
import { calcPricingBreakdown, fmt } from '../../utils/pricingCalc';
import RupeeSymbol from '../RupeeSymbol';

interface EstimatedQuoteProps {
    pricing: PricingType;
    config: QuoteConfig;
    // Denser sizing for narrow contexts (e.g. the Edit Quote modal preview
    // column). Omitted → full size, as used in the new-setup sidebar.
    compact?: boolean;
}

const EstimatedQuote: React.FC<EstimatedQuoteProps> = ({ pricing, config, compact }) => {
    const { lines, total, tax } = calcPricingBreakdown(pricing, config);

    // The tax line (if any) is always the last appended line. Split it off so it
    // renders as the greyed row; works for V1 (VAT) and V2 (GST/…) alike.
    const hasTaxLine = !!tax && tax.amount > 0 && lines.length > 0;
    const costLines = hasTaxLine ? lines.slice(0, -1) : lines;
    const taxLine = hasTaxLine ? lines[lines.length - 1] : null;

    return (
        <Flex
            vertical
            gap={compact ? 12 : 14}
            className="rounded-3xl bg-white"
            style={{
                border: '1px solid #E5E7EB',
                padding: compact ? '20px 22px' : '30px 32px',
                boxShadow: '0px 1.5px 16.5px 0px rgba(0, 0, 0, 0.06)',
            }}
        >
            <Typography.Text
                className={`${compact ? 'text-base' : 'text-lg'} font-semibold text-neutral-900`}
            >
                Estimated Quote
            </Typography.Text>

            <Flex vertical gap={compact ? 8 : 12}>
                <Typography.Text className={`${compact ? 'text-xs' : 'text-sm'} text-neutral-500`}>
                    Estimated total
                </Typography.Text>
                <Flex align="center" gap={4}>
                    <RupeeSymbol size={compact ? 20 : 28} currency={pricing.currency} />
                    <Typography.Text
                        className="font-bold text-neutral-900"
                        style={
                            compact
                                ? { fontSize: 24, lineHeight: '30px' }
                                : { fontSize: 32, lineHeight: '42px' }
                        }
                    >
                        {fmt(total)}
                    </Typography.Text>
                </Flex>
                {tax && tax.rate > 0 && (
                    <Typography.Text
                        className={`${compact ? 'text-xs' : 'text-sm'} text-neutral-500`}
                    >
                        {Number((tax.rate * 100).toFixed(2))}% {tax.label} included
                    </Typography.Text>
                )}
            </Flex>

            <Divider style={{ margin: 0, borderColor: '#E5E7EB' }} />

            {lines.length === 0 ? (
                <Typography.Text className={`${compact ? 'text-xs' : 'text-sm'} text-neutral-500`}>
                    No line items yet.
                </Typography.Text>
            ) : (
                <Flex vertical gap={8}>
                    {costLines.map((line, idx) => (
                        <Flex justify="space-between" align="center" key={idx}>
                            <Typography.Text
                                className={`${compact ? 'text-sm' : 'text-base'} text-neutral-600`}
                            >
                                {line.label}
                            </Typography.Text>
                            <Flex align="center" gap={2}>
                                <RupeeSymbol
                                    size={compact ? 13 : 14}
                                    currency={pricing.currency}
                                />
                                <Typography.Text
                                    className={`${compact ? 'text-sm' : 'text-base'} font-semibold text-neutral-900`}
                                >
                                    {fmt(line.amount)}
                                </Typography.Text>
                            </Flex>
                        </Flex>
                    ))}
                    {taxLine && (
                        <Flex
                            justify="space-between"
                            align="center"
                            style={{
                                borderTop: '1px solid #E5E7EB',
                                paddingTop: 10,
                                marginTop: 4,
                            }}
                        >
                            <Typography.Text
                                className={`${compact ? 'text-xs' : 'text-sm'} text-neutral-400`}
                            >
                                {taxLine.label}
                            </Typography.Text>
                            <Flex align="center" gap={2} className="text-neutral-400">
                                <RupeeSymbol
                                    size={compact ? 11 : 12}
                                    currency={pricing.currency}
                                />
                                <Typography.Text
                                    className={`${compact ? 'text-xs' : 'text-sm'} text-neutral-400`}
                                >
                                    {fmt(taxLine.amount)}
                                </Typography.Text>
                            </Flex>
                        </Flex>
                    )}
                </Flex>
            )}
        </Flex>
    );
};

export default EstimatedQuote;
