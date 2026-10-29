import React from 'react';

import { Flex, Typography } from 'antd';

import { sanitizeHtml } from '../../utils/sanitizeHtml';

interface HighlightsCardProps {
    html?: string;
    // Denser sizing for narrow contexts (e.g. the Edit Quote modal preview
    // column). Omitted → full size, as used in the new-setup sidebar.
    compact?: boolean;
}

const HighlightsCard: React.FC<HighlightsCardProps> = ({ html, compact }) => {
    if (!html) return null;

    return (
        <Flex
            vertical
            gap={compact ? 10 : 14}
            className="rounded-3xl bg-white"
            style={{
                border: '1px solid #E5E7EB',
                padding: compact ? '20px 22px' : '30px 32px',
                boxShadow: '0px 1.5px 16.5px 0px rgba(0, 0, 0, 0.06)',
                marginTop: compact ? 12 : 16,
            }}
        >
            <Typography.Text
                className={`${compact ? 'text-base' : 'text-lg'} font-semibold text-neutral-900`}
            >
                What&apos;s Included
            </Typography.Text>
            <div
                className={`${compact ? 'text-xs' : 'text-sm'} text-neutral-700 leading-relaxed peko-highlights [&_li_p]:my-0`}
                // Vendor-controlled HTML; mirrors vendor's QuoteCard pattern.
                // eslint-disable-next-line react/no-danger
                dangerouslySetInnerHTML={{ __html: sanitizeHtml(html) }}
            />
        </Flex>
    );
};

export default HighlightsCard;
