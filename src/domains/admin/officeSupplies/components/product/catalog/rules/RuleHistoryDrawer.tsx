import { FC, useEffect, useState } from 'react';

import { Spin } from 'antd';

import DrawerModal from '@src/components/atomic/DrawerModal';

import { SECTION_TITLES, plural, timeAgo } from './ruleUtils';
import { RuleHistoryEntry, RuleSectionKey } from '../../../../types/ondcCatalogRules';

export type HistoryTarget = RuleSectionKey | 'all';

interface Props {
    target: HistoryTarget | null;
    fetchHistory: (section?: RuleSectionKey) => Promise<RuleHistoryEntry[]>;
    onClose: () => void;
}

/** One readable line from an audit row's `detail`. */
const detailText = (e: RuleHistoryEntry) => {
    const d = e.detail || {};
    const parts: string[] = [];
    if (Array.isArray(d.words) && e.action.startsWith('Added')) parts.push(d.words.join(', '));
    if (typeof d.reason === 'string' && d.reason) parts.push(d.reason);
    if (d.deletedCount) parts.push(`${plural(d.deletedCount, 'existing product')} deleted`);
    return parts.join(' · ');
};

const RuleHistoryDrawer: FC<Props> = ({ target, fetchHistory, onClose }) => {
    const [entries, setEntries] = useState<RuleHistoryEntry[]>([]);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (!target) return undefined;
        let cancelled = false;
        setLoading(true);
        setEntries([]);
        fetchHistory(target === 'all' ? undefined : target).then(rows => {
            if (cancelled) return;
            setEntries(rows);
            setLoading(false);
        });
        return () => {
            cancelled = true;
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [target]);

    let title = '';
    if (target) title = target === 'all' ? 'Rule history' : `${SECTION_TITLES[target]} · History`;

    let body;
    if (loading) {
        body = (
            <div className="flex justify-center py-10">
                <Spin />
            </div>
        );
    } else if (!entries.length) {
        body = (
            <div className="py-10 text-center text-[13px] text-[#98A2B3]">
                No changes recorded yet.
            </div>
        );
    } else {
        body = (
            <ol className="m-0 flex list-none flex-col p-0">
                {entries.map((e, i) => {
                    const detail = detailText(e);
                    return (
                        <li key={e.id} className="relative flex gap-3 pb-5">
                            {i < entries.length - 1 && (
                                <span className="absolute left-[4px] top-3 h-full w-px bg-[#EAECF0]" />
                            )}
                            <span className="mt-1.5 h-[9px] w-[9px] shrink-0 rounded-full border-2 border-[#101828] bg-white" />
                            <div className="flex min-w-0 flex-col gap-0.5">
                                <span className="text-[13px] font-medium text-[#101828]">
                                    {e.action}
                                </span>
                                {detail && (
                                    <span className="break-words text-[12px] text-[#475467]">
                                        {detail}
                                    </span>
                                )}
                                <span className="text-[11px] text-[#98A2B3]">
                                    {target === 'all' &&
                                        `${SECTION_TITLES[e.section] ?? e.section} · `}
                                    {e.actorName || 'Admin'} · {timeAgo(e.createdAt)}
                                </span>
                            </div>
                        </li>
                    );
                })}
            </ol>
        );
    }

    return (
        <DrawerModal open={!!target} handleCancel={onClose} modalTitle={title} closeIcon>
            {body}
        </DrawerModal>
    );
};

export default RuleHistoryDrawer;
