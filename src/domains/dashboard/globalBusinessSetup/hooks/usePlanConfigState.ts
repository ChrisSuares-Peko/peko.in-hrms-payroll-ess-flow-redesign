import { useCallback, useMemo, useState } from 'react';

import { PricingType, QuoteConfig } from '../types/pricing';
import { normalizeQuoteConfig } from '../utils/pricingCalc';

/**
 * Base-package selection + per-plan quote config, shared by every screen that
 * hosts the pick/configure stage (GetStarted step 4-5 and the Get Quote detail
 * page). Keeping it in one hook is deliberate: a stripped-down copy of this
 * state is what let the two flows drift apart (stale selections, wrong totals,
 * wrong repeater counts seeded into the application form).
 *
 * The config is cached by pricing `_id` so switching base package and back
 * restores the earlier edits instead of re-deriving defaults.
 */
export const usePlanConfigState = (pricings: PricingType[]) => {
    const [selectedIdx, setSelectedIdx] = useState(0);
    const [configByPricing, setConfigByPricing] = useState<Record<string, QuoteConfig>>({});

    const activePricing = pricings[selectedIdx] ?? null;

    const quoteConfig = useMemo<QuoteConfig | null>(
        () =>
            activePricing
                ? configByPricing[activePricing._id] ??
                  normalizeQuoteConfig(activePricing, null, null)
                : null,
        [activePricing, configByPricing]
    );

    const handleQuoteConfigChange = useCallback(
        (cfg: QuoteConfig) => {
            if (activePricing) {
                setConfigByPricing(prev => ({ ...prev, [activePricing._id]: cfg }));
            }
        },
        [activePricing]
    );

    const resetPlanState = useCallback(() => {
        setSelectedIdx(0);
        setConfigByPricing({});
    }, []);

    return {
        selectedIdx,
        setSelectedIdx,
        activePricing,
        quoteConfig,
        handleQuoteConfigChange,
        resetPlanState,
    };
};
