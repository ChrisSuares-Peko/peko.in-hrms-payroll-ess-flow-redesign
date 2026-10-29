import { useEffect, useMemo, useState } from 'react';

import { Divider, Flex, Typography } from 'antd';

import CalculatorControls from './CalculatorControls';
import { PricingType, QuoteConfig } from '../types/pricing';
import { PreviewSelectionsV2 } from '../types/pricingV2';
import { formatMoney } from '../utils/pricingCalc';
import { computeV2Breakdown } from '../utils/pricingV2/engine';
import { pricingToV2Draft } from '../utils/pricingV2/fromDoc';
import {
    calcValuesFromSelections,
    selectionsFromQuoteConfig,
} from '../utils/pricingV2/quoteConfig';

interface PricingCalculatorProps {
    pricing: PricingType;
    initialValues?: Partial<QuoteConfig>;
    onValuesChange?: (values: QuoteConfig) => void;
    // Lock form-bound components (read-only) — used inside the application form
    // context (Edit Quote), where those values come from the form.
    lockBound?: boolean;
    // Render the live breakdown/total below the controls (default true). Turn
    // off when a separate quote panel (EstimatedQuote) already shows it.
    showBreakdown?: boolean;
}

/**
 * Generic Pricing V2 calculator: renders whatever `components[]` the (normalized)
 * pricing carries via CalculatorControls, computes the breakdown with the V2
 * engine, and emits a legacy-shaped QuoteConfig (with the raw `selections`
 * embedded) so payment/review stay compatible. Handles V1 docs too (they are
 * synthesized into components by pricingToV2Draft).
 */
export function PricingCalculator({
    pricing,
    initialValues,
    onValuesChange,
    lockBound,
    showBreakdown = true,
}: PricingCalculatorProps) {
    const normalized = useMemo(() => pricingToV2Draft(pricing), [pricing]);

    // Seeded once at mount from the incoming quote; callers force a reseed by
    // keying the element on `pricing._id`.
    const [selections, setSelections] = useState<PreviewSelectionsV2>(() =>
        selectionsFromQuoteConfig(normalized, initialValues)
    );

    const breakdown = useMemo(
        () => computeV2Breakdown(normalized, selections),
        [normalized, selections]
    );

    useEffect(() => {
        onValuesChange?.(calcValuesFromSelections(normalized, selections) as QuoteConfig);
    }, [normalized, selections, onValuesChange]);

    return (
        <Flex vertical gap={20}>
            <CalculatorControls
                pricing={normalized}
                selections={selections}
                onChange={setSelections}
                lockBound={lockBound}
            />

            {showBreakdown && (
                <div className="rounded-2xl border border-neutral-200 overflow-hidden">
                    {breakdown.lines.length === 0 ? (
                        <div className="px-6 py-5">
                            <Typography.Text className="text-sm italic text-neutral-400">
                                Configure the options above to see a breakdown.
                            </Typography.Text>
                        </div>
                    ) : (
                        <Flex vertical>
                            {breakdown.lines.map((line, i) => (
                                <Flex
                                    key={i}
                                    align="center"
                                    justify="space-between"
                                    className="px-6 py-4"
                                    style={{
                                        borderBottom:
                                            i < breakdown.lines.length - 1
                                                ? '1px solid #E5E7EB'
                                                : undefined,
                                    }}
                                >
                                    <Typography.Text className="text-base font-medium text-neutral-700">
                                        {line.label}
                                        {line.recurrence === 'annual' ? ' /yr' : ''}
                                    </Typography.Text>
                                    <Typography.Text className="text-base font-semibold text-neutral-900">
                                        {formatMoney(line.amount, normalized.currency)}
                                    </Typography.Text>
                                </Flex>
                            ))}
                            {breakdown.tax_amount > 0 && (
                                <Flex
                                    align="center"
                                    justify="space-between"
                                    className="px-6 py-3"
                                    style={{ borderTop: '1px solid #E5E7EB' }}
                                >
                                    <Typography.Text className="text-sm text-neutral-400">
                                        {normalized.tax?.label || 'Tax'}
                                    </Typography.Text>
                                    <Typography.Text className="text-sm text-neutral-400">
                                        {formatMoney(breakdown.tax_amount, normalized.currency)}
                                    </Typography.Text>
                                </Flex>
                            )}
                            <Divider style={{ margin: 0 }} />
                            <Flex align="center" justify="space-between" className="px-6 py-5">
                                <Typography.Text className="text-xl font-bold text-neutral-800">
                                    Estimated Total
                                </Typography.Text>
                                <Typography.Text className="text-xl font-bold text-neutral-900">
                                    {formatMoney(breakdown.total, normalized.currency)}
                                </Typography.Text>
                            </Flex>
                        </Flex>
                    )}
                </div>
            )}
        </Flex>
    );
}

export default PricingCalculator;
