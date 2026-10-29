import React from 'react';

import { Collapse } from 'antd';
import { CollapseProps } from 'antd/lib';

import '../assets/style.css';
import { FareRules } from '../types/fareRules';

interface fairRlesProps {
    fareRulesData: FareRules[];
    isRefundable?: boolean;
}

// The supplier's FareRuleDetail HTML is: a refundability note, the penalty table, and the
// min/max-stay bullets — followed by a huge revalidation/reissue fieldset and a wall of raw GDS
// penalty text. Only the first part is meant to be shown, so drop everything from the fieldset
// onward. If an airline's response has no fieldset, fall back to showing the full string as-is.
const truncateFareRuleDetail = (html: string) => {
    const cutIndex = html.search(/<fieldset/i);
    return cutIndex === -1 ? html : html.slice(0, cutIndex);
};

// Some airlines (mostly LCCs) send only "The FareBasisCode is: XXXX" — a supplier pricing code
// that means nothing to the traveller — so treat that as "no rules provided"
const hasNoUsefulRules = (html = '') => {
    const text = html
        .replace(/<[^>]+>/g, ' ')
        .replace(/&nbsp;/gi, ' ')
        .replace(/\s+/g, ' ')
        .trim();
    return !text || /^The FareBasisCode is:?\s*\S*$/i.test(text);
};

const FallbackRules = ({ isRefundable }: { isRefundable?: boolean }) => (
    <div className="fare-rule-detail">
        <p className="m-0">
            {isRefundable === undefined
                ? 'The airline has not shared detailed cancellation or change charges for this fare.'
                : `This is a ${isRefundable ? 'refundable' : 'non-refundable'} fare. The airline has not shared detailed cancellation or change charges for it.`}
        </p>
        <ul className="mt-2 mb-0 ps-5">
            <li>Airline cancellation and change charges apply as per airline policy.</li>
            <li>GST and Peko convenience charges, if any, are added on top of airline charges.</li>
            <li>
                Raise cancellation or change requests at least 2 hours (domestic) or 4 hours
                (international) before the airline&apos;s cancellation deadline.
            </li>
        </ul>
    </div>
);

const FairRuleCollapse = ({ fareRulesData, isRefundable }: fairRlesProps) => {
    const result: CollapseProps['items'] = fareRulesData.map((item, index) => ({
        key: (index + 1).toString(),
        label: `${item.Origin} -> ${item.Destination}`,
        children: hasNoUsefulRules(item.FareRuleDetail) ? (
            <FallbackRules isRefundable={isRefundable} />
        ) : (
            <div
                className="fare-rule-detail"
                // eslint-disable-next-line react/no-danger
                dangerouslySetInnerHTML={{ __html: truncateFareRuleDetail(item.FareRuleDetail!) }}
            />
        ),
    }));

    return (
        <Collapse
            className="fare-rule-collapse"
            style={{ width: '100%' }}
            items={result}
            defaultActiveKey={['1']}
        />
    );
};

export default FairRuleCollapse;
