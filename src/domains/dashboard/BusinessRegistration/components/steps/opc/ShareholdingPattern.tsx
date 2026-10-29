import { useEffect, useState } from 'react';

import { EyeOutlined } from '@ant-design/icons';
import { Button, Typography } from 'antd';
import { useFormikContext } from 'formik';

import TextInput from '@components/atomic/inputs/TextInput';

import { EntityType } from '../../../types';
import { shareholdingPeople, shareholdingRow, shareholdingTotal } from '../../../utils/person';
import { isDirectorOnly, PROMOTER_TYPE_OPTIONS } from '../../../utils/proprietorKyc';
import PersonViewModal, { ViewablePerson } from '../PersonViewModal';

const { Text } = Typography;

interface Person {
    firstName?: string;
    lastName?: string;
    pan?: string;
    promoterType?: string;
}

const roleLabel = (role?: string) =>
    PROMOTER_TYPE_OPTIONS.find(o => o.value === role)?.label ?? 'Promoter';

// Shareholding pattern table — read-only people list + share allotment. Promoters
// are added/managed on the Promoters step now; here we only allot shares. A pure
// "Director" row is hidden per the vendor role rules. % holding from shares.
const ShareholdingPattern = () => {
    const { values, setFieldValue } = useFormikContext<Record<string, unknown>>();
    const isPvt = values.entityType === EntityType.PRIVATE_LIMITED;
    const people = shareholdingPeople(values) as Person[];
    const total = shareholdingTotal(values);
    // Row index whose person details are open in the read-only View modal.
    const [viewIndex, setViewIndex] = useState<number | null>(null);

    // Role drives shareholding (vendor doc): a director whose role is "Director"
    // only is NOT a shareholder — keep its shareholding row slot (the backend
    // aligns shares by the directors-first order) but mark it excluded so it's
    // dropped from the pattern and the shareholder-count check. Empty role stays
    // included (pre-role drafts). Additional shareholders are untouched.
    useEffect(() => {
        if (!isPvt) return;
        const directors = (values.directors as Person[]) || [];
        directors.forEach((d, i) => {
            const shouldExclude = isDirectorOnly(d?.promoterType);
            const current = Boolean((values.shareholding as Record<string, { excluded?: boolean }>)?.[i]?.excluded);
            if (shouldExclude !== current) {
                setFieldValue(`shareholding.${i}.excluded`, shouldExclude);
                if (shouldExclude) setFieldValue(`shareholding.${i}.shares`, '');
            }
        });
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [isPvt, JSON.stringify(((values.directors as Person[]) || []).map(d => d?.promoterType))]);

    // Stacked cards below sm, the table grid from sm up. A fixed four-column grid with a
    // 640px min-width meant a 320px phone scrolled sideways twice its own width to reach
    // % Holding and the View action.
    const cols = isPvt
        ? 'sm:grid sm:grid-cols-[1.4fr_1fr_0.8fr_0.6fr] sm:gap-2 sm:items-center'
        : 'sm:grid sm:grid-cols-[1.4fr_1fr_0.8fr] sm:gap-2 sm:items-center';

    const rowLabel = (person: Person, i: number) => {
        const name = [person?.firstName, person?.lastName].filter(Boolean).join(' ');
        return name || `${roleLabel(person?.promoterType)} ${i + 1}`;
    };

    return (
        <div className="flex flex-col gap-3">
            <div className="border border-[#e4e4e7] rounded-[16px] overflow-x-auto">
                {/* The min-width only applies once the rows are a grid, so the columns still
                    cannot crush on a small tablet while phones get cards instead. */}
                <div className="sm:min-w-[560px]">
                    {/* Column headings only make sense once the rows are a grid; each card
                        carries its own labels below sm. */}
                    <div className={`${cols} hidden bg-[#fafafa] px-4 py-3 text-[13px] font-medium text-[#64748b]`}>
                        <span>Shareholder Name</span>
                        <span>Shares Allotted</span>
                        <span>% Holding</span>
                        {isPvt && <span>Actions</span>}
                    </div>
                    {people.map((person, i) => {
                        // A pure "Director" never appears on the Shareholder page (vendor
                        // role rules). The row slot is kept for backend index alignment.
                        if (isPvt && isDirectorOnly(person?.promoterType)) return null;
                        const { shares } = shareholdingRow(values, i);
                        const pct = total ? Math.round((shares / total) * 100) : 0;
                        return (
                            <div
                                key={i}
                                className={`${cols} flex flex-col gap-3 px-4 py-3 border-t border-[#ebebeb]`}
                            >
                                <div>
                                    <Text className="!text-[14px] !text-[#1e293b]">{rowLabel(person, i)}</Text>
                                    <Text className="!block !text-[12px] !text-[#9ca3af]">
                                        {roleLabel(person?.promoterType)}
                                    </Text>
                                </div>
                                <div className="sm:pr-2 [&_.ant-form-item]:!mb-0">
                                    <Text className="sm:hidden !block !text-[12px] !text-[#64748b] !mb-1">
                                        Shares Allotted
                                    </Text>
                                    <TextInput name={`shareholding.${i}.shares`} type="text" placeholder="0" allowNumbersOnly />
                                </div>
                                {/* One line on a card, two separate grid cells from sm up —
                                    sm:contents drops this wrapper out of the grid entirely. */}
                                <div className="flex items-center justify-between sm:contents">
                                    <Text className="!text-[14px] !text-[#475569]">
                                        <span className="sm:hidden !text-[12px] !text-[#64748b] mr-1">% Holding</span>
                                        {`${pct}%`}
                                    </Text>
                                    {isPvt && (
                                        <div className="flex items-center gap-1 text-[#ff4f4f]">
                                            <Button
                                                type="text"
                                                size="small"
                                                icon={<EyeOutlined />}
                                                title="View details"
                                                onClick={() => setViewIndex(i)}
                                                className="!text-[#ff4f4f] !px-1"
                                            />
                                        </div>
                                    )}
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>

            {viewIndex !== null && people[viewIndex] && (
                <PersonViewModal
                    open
                    person={people[viewIndex] as ViewablePerson}
                    title={rowLabel(people[viewIndex], viewIndex)}
                    onClose={() => setViewIndex(null)}
                />
            )}
        </div>
    );
};

export default ShareholdingPattern;
