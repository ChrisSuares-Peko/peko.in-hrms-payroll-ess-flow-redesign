import { useEffect } from 'react';

import { Switch, Typography } from 'antd';
import { getIn, useFormikContext } from 'formik';

import TextInput from '@components/atomic/inputs/TextInput';

import { shareholdingPeople } from '../../../utils/person';

const { Text } = Typography;

interface Person {
    firstName?: string;
    lastName?: string;
}

// Stacked cards below sm, the table grid from sm up — a fixed four-column grid with a
// 640px min-width made a 320px phone scroll sideways twice its own width.
const COLS = 'sm:grid sm:grid-cols-[1.4fr_1fr_0.8fr_1fr] sm:gap-2 sm:items-center';

// Profit-sharing table for the LLP Contribution step (Figma 1854:39339). Rows are
// the designated partners; % profit share is computed from contribution amounts.
const ProfitSharingPattern = () => {
    const { values, setFieldValue } = useFormikContext<Record<string, unknown>>();
    const people = shareholdingPeople(values) as Person[];
    // % share is each partner's contribution over the total contribution the user
    // entered (vendor rule: amount / totalContribution × 100). Also drives the
    // equal-split effect below.
    const totalContribution = Number(values.totalContribution) || 0;

    // "Enter total to split equally": whenever the total capital contribution is
    // set and the per-partner amounts don't already add up to it, distribute it
    // equally across partners (any remainder to the first). Manual splits that
    // already sum to the total are left untouched.
    useEffect(() => {
        const count = people.length;
        if (!totalContribution || !count) return;
        const currentSum = people.reduce(
            (sum, _, i) => sum + (Number(getIn(values, `contribution.${i}.amount`)) || 0),
            0
        );
        if (currentSum === totalContribution) return;
        const base = Math.floor(totalContribution / count);
        const remainder = totalContribution - base * count;
        people.forEach((_, i) => {
            setFieldValue(`contribution.${i}.amount`, String(base + (i === 0 ? remainder : 0)));
        });
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [totalContribution, people.length]);

    return (
        <div className="border border-[#e4e4e7] rounded-[16px] overflow-x-auto">
            {/* The min-width only applies once the rows are a grid, so columns still cannot
                crush on a small tablet while phones get cards instead. */}
            <div className="sm:min-w-[560px]">
                {/* Headings only make sense as a grid; each card carries its own labels. */}
                <div className={`${COLS} hidden bg-[#fafafa] px-4 py-3 text-[13px] font-medium text-[#64748b]`}>
                    <span>Partner Name</span>
                    <span>Contribution Amount (₹)</span>
                    <span>% Profit Share</span>
                    <span>Corporate / Legal Entity</span>
                </div>
                {people.map((person, i) => {
                    const name =
                        [person?.firstName, person?.lastName].filter(Boolean).join(' ') ||
                        `Partner ${i + 1}`;
                    const amount = Number(getIn(values, `contribution.${i}.amount`)) || 0;
                    const pct = totalContribution ? Math.round((amount / totalContribution) * 100) : 0;
                    const isCorporate = Boolean(getIn(values, `contribution.${i}.isCorporate`));
                    return (
                        <div
                            key={i}
                            className={`${COLS} flex flex-col gap-3 px-4 py-3 border-t border-[#ebebeb]`}
                        >
                            <Text className="!text-[14px] !text-[#1e293b]">{name}</Text>
                            <div className="sm:pr-2 [&_.ant-form-item]:!mb-0">
                                <Text className="sm:hidden !block !text-[12px] !text-[#64748b] !mb-1">
                                    Contribution Amount (₹)
                                </Text>
                                <TextInput name={`contribution.${i}.amount`} type="text" placeholder="₹ 0" allowNumbersOnly />
                            </div>
                            {/* One line on a card, two grid cells from sm up — sm:contents drops
                                this wrapper out of the grid entirely. */}
                            <div className="flex items-center justify-between gap-3 sm:contents">
                                <Text className="!text-[14px] !text-[#475569]">
                                    <span className="sm:hidden !text-[12px] !text-[#64748b] mr-1">% Profit Share</span>
                                    {pct}%
                                </Text>
                                <div className="flex items-center gap-2">
                                    <Text className="sm:hidden !text-[12px] !text-[#64748b]">Corporate</Text>
                                    <Switch
                                        size="small"
                                        checked={isCorporate}
                                        onChange={checked => setFieldValue(`contribution.${i}.isCorporate`, checked)}
                                    />
                                    <Text className="!text-[13px] !text-[#475569]">
                                        {isCorporate ? 'Yes' : 'No'}
                                    </Text>
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
};

export default ProfitSharingPattern;
