import React from 'react';

import ClampedContent from './ClampedContent';
import SelectableCard from './SelectableCard';
import { PricingType } from '../../types/pricing';
import { calcStartingFromPrice, formatMoney } from '../../utils/pricingCalc';
import { sanitizeHtml } from '../../utils/sanitizeHtml';

interface BasePackageCardProps {
    pricing: PricingType;
    selected: boolean;
    onSelect: () => void;
}

const HAIRLINE = '1px solid #F3F4F6';

const labelStyle: React.CSSProperties = {
    fontSize: 10,
    fontWeight: 600,
    textTransform: 'uppercase',
    color: '#9CA3AF',
    letterSpacing: '0.05em',
    marginBottom: 4,
    lineHeight: 1.2,
};

const BasePackageCard: React.FC<BasePackageCardProps> = ({ pricing, selected, onSelect }) => {
    const startingFrom = calcStartingFromPrice(pricing);

    return (
        <SelectableCard
            selected={selected}
            onClick={onSelect}
            align="flex-start"
            padding={20}
            fullWidth
        >
            <div style={{ width: '100%' }}>
                <div style={{ minHeight: 72, paddingBottom: 14, borderBottom: HAIRLINE }}>
                    <div
                        style={{
                            fontSize: 16,
                            fontWeight: 600,
                            color: '#171717',
                            marginBottom: 4,
                            lineHeight: 1.3,
                        }}
                    >
                        {pricing.name}
                    </div>
                    {pricing.description && (
                        <ClampedContent
                            content={pricing.description}
                            lines={2}
                            contentClassName="text-xs leading-relaxed text-[#6B7280]"
                        />
                    )}
                </div>

                {startingFrom != null && (
                    <div
                        style={{
                            padding: '14px 0',
                            borderBottom: pricing.highlights ? HAIRLINE : 'none',
                        }}
                    >
                        <div style={labelStyle}>Starting From</div>
                        <div style={{ fontSize: 18, fontWeight: 700, color: '#171717' }}>
                            {formatMoney(startingFrom, pricing.currency)}
                        </div>
                    </div>
                )}

                {pricing.highlights && (
                    <div style={{ padding: '14px 0' }}>
                        <div style={labelStyle}>Highlights</div>
                        <div
                            className="peko-highlights text-xs leading-relaxed text-[#374151] [&_li_p]:my-0"
                            // Admin/vendor-authored HTML, sanitized (same model as HighlightsCard).
                            // eslint-disable-next-line react/no-danger
                            dangerouslySetInnerHTML={{ __html: sanitizeHtml(pricing.highlights) }}
                        />
                    </div>
                )}
            </div>
        </SelectableCard>
    );
};

export default BasePackageCard;
