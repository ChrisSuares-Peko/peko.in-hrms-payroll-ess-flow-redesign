import { useEffect } from 'react';

import { ExclamationCircleOutlined } from '@ant-design/icons';
import { Typography } from 'antd';
import { getIn, useFormikContext } from 'formik';

import TextInput from '@components/atomic/inputs/TextInput';

const { Title, Paragraph, Text } = Typography;

interface Partner {
    firstName?: string;
    lastName?: string;
}

// Stacked cards below sm, the table grid from sm up — a fixed grid with a 560px
// min-width made a 320px phone scroll sideways to reach the profit share.
const COLS = 'sm:grid sm:grid-cols-[1.4fr_1fr_1fr] sm:gap-3 sm:items-center';
const formatINR = (n: number) => `₹${n.toLocaleString('en-IN')}`;

// Profit-share %s from contributions, largest-remainder adjusted to total 100.
const profitPercents = (amounts: number[], total: number): number[] => {
    if (!total) return amounts.map(() => 0);
    const raw = amounts.map(a => (a / total) * 100);
    const out = raw.map(r => Math.floor(r));
    let rem = Math.round(raw.reduce((s, r) => s + r, 0)) - out.reduce((s, f) => s + f, 0);
    raw.map((r, i) => ({ i, frac: r - Math.floor(r) }))
        .sort((a, b) => b.frac - a.frac)
        .forEach(({ i }) => {
            if (rem > 0) {
                out[i] += 1;
                rem -= 1;
            }
        });
    return out;
};

// Partnership Capital Contribution step (doc §C4). Profit share auto-fills from
// each partner's contribution.
const CapitalContribution = () => {
    const { values, setFieldValue } = useFormikContext<Record<string, unknown>>();
    const partners = (values.partners as Partner[]) || [];
    const total = Number(getIn(values, 'totalContribution')) || 0;
    const amounts = partners.map((_, i) => Number(getIn(values, `contribution.${i}.amount`)) || 0);
    const percents = profitPercents(amounts, total);
    const sumAmount = amounts.reduce((s, a) => s + a, 0);
    const sumPct = percents.reduce((s, p) => s + p, 0);
    const amountOk = total > 0 && Math.round(sumAmount) === Math.round(total);

    // Persist the derived profit share so it's saved with the draft.
    useEffect(() => {
        if (!total) return;
        percents.forEach((p, i) => {
            if (String(getIn(values, `contribution.${i}.profitShare`) ?? '') !== String(p)) {
                setFieldValue(`contribution.${i}.profitShare`, String(p));
            }
        });
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [total, amounts.join(',')]);

    return (
        <div className="flex flex-col gap-4">
            <div>
                <Title level={3} className="!text-[24px] !font-semibold !text-[#1e293b] !mb-1 !leading-[32px]">
                    Capital Contribution & Profit Sharing
                </Title>
                <Paragraph className="!mb-0 text-[16px] text-[#6a7282] !leading-[24px]">
                    Each partner&apos;s capital contribution and profit-sharing percentage.
                </Paragraph>
            </div>

            <div className="border border-[#e4e4e7] rounded-[24px] p-4 sm:p-6 flex flex-col gap-6">
                <div className="flex flex-col gap-3">
                    <Text className="!text-[16px] !font-semibold !text-[#1e293b]">Total Capital Contribution</Text>
                    <div className="border border-[#e4e4e7] rounded-[24px] p-4 sm:p-6 [&_.ant-form-item]:!mb-0">
                        <TextInput
                            label="Total Capital Contribution (₹)"
                            name="totalContribution"
                            type="text"
                            placeholder="₹0"
                            allowNumbersOnly
                            size="large"
                        />
                    </div>
                </div>

                <div className="flex flex-col gap-3">
                    <Text className="!text-[16px] !font-semibold !text-[#1e293b]">Per-Partner Split</Text>
                    <div className="border border-[#e4e4e7] rounded-[16px] overflow-x-auto">
                        {/* The min-width only applies once the rows are a grid, so columns
                            still cannot crush on a small tablet while phones get cards. */}
                        <div className="sm:min-w-[480px]">
                            {/* Headings only make sense as a grid; each card carries its own. */}
                            <div className={`${COLS} hidden bg-[#fafafa] px-4 py-3 text-[13px] font-medium text-[#64748b]`}>
                                <span>Partner Name</span>
                                <span>Contribution (₹)</span>
                                <span>Profit Share (%)</span>
                            </div>
                            {partners.map((p, i) => {
                                const name =
                                    [p?.firstName, p?.lastName].filter(Boolean).join(' ') || `Partner ${i + 1}`;
                                return (
                                    <div
                                        key={i}
                                        className={`${COLS} flex flex-col gap-3 px-4 py-3 border-t border-[#ebebeb]`}
                                    >
                                        <Text className="!text-[14px] !text-[#1e293b]">{name}</Text>
                                        <div className="sm:pr-2 [&_.ant-form-item]:!mb-0">
                                            <Text className="sm:hidden !block !text-[12px] !text-[#64748b] !mb-1">
                                                Contribution (₹)
                                            </Text>
                                            <TextInput name={`contribution.${i}.amount`} type="text" placeholder="₹ 0" allowNumbersOnly />
                                        </div>
                                        <Text className="!text-[14px] !text-[#475569]">
                                            <span className="sm:hidden !text-[12px] !text-[#64748b] mr-1">Profit Share</span>
                                            {percents[i]}%
                                        </Text>
                                    </div>
                                );
                            })}
                            {/* Totals read as one line on a card rather than a stacked row. */}
                            <div
                                className={`${COLS} flex items-center justify-between gap-3 px-4 py-3 border-t border-[#ebebeb] bg-[#fafafa]`}
                            >
                                <Text className="!text-[14px] !font-semibold !text-[#1e293b]">Total</Text>
                                <Text className={`!text-[14px] ${amountOk ? '!text-[#16a34a]' : '!text-[#ef4444]'}`}>
                                    {formatINR(sumAmount)}
                                    {total ? ` / ${formatINR(total)}` : ''}
                                </Text>
                                <Text className={`!text-[14px] ${amountOk ? '!text-[#16a34a]' : '!text-[#64748b]'}`}>
                                    {sumPct}%
                                </Text>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="bg-[#fffbeb] border border-[#fde68a] rounded-[12px] flex gap-2 items-start px-4 py-3">
                    <ExclamationCircleOutlined className="text-[#f59e0b] mt-[3px]" style={{ fontSize: 16 }} />
                    <div>
                        <Text className="!block !text-[14px] !font-medium !text-[#1e293b] !mb-1">Please note:</Text>
                        <ul className="list-disc pl-4 flex flex-col gap-1">
                            <li className="text-[13px] text-[#475569]">
                                Partner contributions must add up to the total capital contribution.
                            </li>
                            <li className="text-[13px] text-[#475569]">
                                Profit share is calculated automatically from each partner&apos;s contribution.
                            </li>
                        </ul>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default CapitalContribution;
