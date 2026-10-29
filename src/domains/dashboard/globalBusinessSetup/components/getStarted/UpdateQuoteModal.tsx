/* eslint-disable no-nested-ternary */
import React, { useCallback, useEffect, useMemo, useState } from 'react';

import { Button, Flex, Modal, Spin, Typography } from 'antd';

import { useAppSelector } from '@src/hooks/store';

import EstimatedQuote from './EstimatedQuote';
import HighlightsCard from './HighlightsCard';
import SectionLabel from './SectionLabel';
import SelectableCard from './SelectableCard';
import { getPlanPricing } from '../../api/globalBusinessSetup';
import { PricingType, QuoteConfig } from '../../types/pricing';
import { normalizeQuoteConfig } from '../../utils/pricingCalc';
import { PricingCalculator } from '../PricingCalculator';

interface UpdateQuoteModalProps {
    open: boolean;
    onClose: () => void;
    country: string;
    companyType: string;
    freezone: string;
    currentPricingId: string;
    currentQuoteConfig: QuoteConfig | null;
    onSave: (pricing: PricingType, quoteConfig: QuoteConfig) => void;
}

const UpdateQuoteModal: React.FC<UpdateQuoteModalProps> = ({
    open,
    onClose,
    country,
    companyType,
    freezone,
    currentPricingId,
    currentQuoteConfig,
    onSave,
}) => {
    const { role, id } = useAppSelector(s => s.reducer.auth);

    const [pricings, setPricings] = useState<PricingType[]>([]);
    const [loading, setLoading] = useState(false);
    const [selectedIdx, setSelectedIdx] = useState(0);
    // Per-plan config cache (keyed by pricing _id) so switching to another plan
    // and back restores the earlier edits instead of re-deriving defaults.
    const [configByPricing, setConfigByPricing] = useState<Record<string, QuoteConfig>>({});

    useEffect(() => {
        if (!open || !country || !companyType) return undefined;
        let cancelled = false;
        const load = async () => {
            setLoading(true);
            setConfigByPricing({});
            const res = await getPlanPricing({
                userId: id,
                userType: role,
                country,
                company_type: companyType,
                freezone: freezone || '',
            });
            if (cancelled) return;
            const list = Array.isArray(res) ? (res as PricingType[]) : [];
            const active = list
                .filter(p => p.status === 'active')
                .sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
            setPricings(active);
            const idx = active.findIndex(p => p._id === currentPricingId);
            setSelectedIdx(idx >= 0 ? idx : 0);
            setLoading(false);
        };
        load();
        return () => {
            cancelled = true;
        };
    }, [open, country, companyType, freezone, currentPricingId, id, role]);

    const selectedPricing = pricings[selectedIdx] ?? null;

    // Active config for the selected plan: the cached edits if we have them,
    // else derived (seeding the saved plan from its stored quote via `carry`).
    const activeConfig = useMemo(() => {
        if (!selectedPricing) return null;
        const cached = configByPricing[selectedPricing._id];
        if (cached) return cached;
        const carry = selectedPricing._id === currentPricingId ? currentQuoteConfig : null;
        return normalizeQuoteConfig(selectedPricing, carry, null);
    }, [selectedPricing, configByPricing, currentPricingId, currentQuoteConfig]);

    // Stable identity so PricingCalculator's onValuesChange effect doesn't loop.
    const handleCalcChange = useCallback(
        (cfg: QuoteConfig) => {
            if (selectedPricing) {
                setConfigByPricing(prev => ({ ...prev, [selectedPricing._id]: cfg }));
            }
        },
        [selectedPricing]
    );

    const handleSave = () => {
        if (!selectedPricing || !activeConfig) return;
        onSave(selectedPricing, activeConfig);
        onClose();
    };

    return (
        <Modal
            open={open}
            onCancel={onClose}
            title="Update Quote"
            width={1000}
            destroyOnClose
            // The body itself doesn't scroll; the left column scrolls internally
            // while the right preview column shows in full (see the flex row
            // below). overflowX hidden guards against accidental horizontal scroll.
            styles={{ body: { overflowX: 'hidden' } }}
            footer={[
                <Button key="cancel" onClick={onClose}>
                    Cancel
                </Button>,
                <Button
                    key="save"
                    type="primary"
                    danger
                    disabled={!selectedPricing || !activeConfig}
                    onClick={handleSave}
                >
                    Save
                </Button>,
            ]}
        >
            {loading ? (
                <Flex justify="center" className="py-10">
                    <Spin />
                </Flex>
            ) : pricings.length === 0 ? (
                <Typography.Text className="text-sm text-neutral-500">
                    No active pricings available for this jurisdiction. Please contact support.
                </Typography.Text>
            ) : (
                <div className="flex flex-col gap-6 lg:flex-row lg:items-stretch lg:max-h-[72vh]">
                    {/* Left: pricing/package selection + configure controls — scrolls internally */}
                    <div className="min-w-0 lg:flex-1 lg:overflow-y-auto lg:pr-2">
                        <Flex vertical gap={20}>
                            {pricings.length > 1 && (
                                <Flex vertical gap={10}>
                                    <SectionLabel>Select Package</SectionLabel>
                                    <Flex vertical gap={10}>
                                        {pricings.map((p, idx) => (
                                            <SelectableCard
                                                key={p._id}
                                                selected={idx === selectedIdx}
                                                onClick={() => setSelectedIdx(idx)}
                                                align="flex-start"
                                                padding={14}
                                            >
                                                <Flex vertical gap={4}>
                                                    <Typography.Text className="text-sm font-semibold text-neutral-900">
                                                        {p.name}
                                                    </Typography.Text>
                                                    <Typography.Text className="text-xs text-neutral-500 line-clamp-3">
                                                        {p.description ||
                                                            'No description provided.'}
                                                    </Typography.Text>
                                                </Flex>
                                            </SelectableCard>
                                        ))}
                                    </Flex>
                                </Flex>
                            )}

                            {selectedPricing && activeConfig && (
                                <PricingCalculator
                                    key={selectedPricing._id}
                                    pricing={selectedPricing}
                                    initialValues={activeConfig}
                                    lockBound
                                    showBreakdown={false}
                                    onValuesChange={handleCalcChange}
                                />
                            )}
                        </Flex>
                    </div>

                    {/* Right: Estimated Quote + What's Included — shown in full while the left scrolls */}
                    <div className="lg:w-[360px] lg:shrink-0 lg:overflow-y-auto">
                        {selectedPricing && activeConfig && (
                            <>
                                <EstimatedQuote
                                    pricing={selectedPricing}
                                    config={activeConfig}
                                    compact
                                />
                                <HighlightsCard html={selectedPricing.highlights} compact />
                            </>
                        )}
                    </div>
                </div>
            )}
        </Modal>
    );
};

export default UpdateQuoteModal;
