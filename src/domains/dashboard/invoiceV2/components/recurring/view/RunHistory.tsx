import React from 'react';

import { Tag } from 'antd';
import dayjs from 'dayjs';
import { useNavigate } from 'react-router-dom';

import { paths } from '@src/routes/paths';

import type { RecurringScheduleApiData } from '../../../types/recurring';
import { computeNextRuns, toRule } from '../../../utils/recurrenceEngine';

type RunItem = {
    date: string;
    label: string;
    done: boolean;
    invoiceId?: string;
    invoiceLabel?: string;
};

type Props = { schedule: RecurringScheduleApiData };

const RunHistory: React.FC<Props> = ({ schedule }) => {
    const navigate = useNavigate();
    const items: RunItem[] = [];

    if (schedule.completedRuns > 0) {
        let cursor = schedule.startDate;
        for (let i = 0; i < schedule.completedRuns; i += 1) {
            const gen = schedule.generatedInvoices?.[i];
            items.push({
                date: cursor,
                label: dayjs(cursor).format('ddd, DD MMM YYYY'),
                done: true,
                invoiceId: gen?.invoiceId ? String(gen.invoiceId) : undefined,
                invoiceLabel: gen ? `${gen.prefix}${gen.invoiceNo}` : undefined,
            });
            const next = computeNextRuns(toRule(schedule), 0, cursor, 1)[0];
            if (!next) break;
            cursor = next;
        }
    }

    const upcoming = computeNextRuns(
        toRule(schedule),
        schedule.completedRuns,
        schedule.nextRunDate ?? schedule.startDate,
        Math.max(4, 8 - items.length)
    );
    upcoming.forEach(d => {
        items.push({
            date: d,
            label: dayjs(d).format('ddd, DD MMM YYYY'),
            done: false,
        });
    });

    if (items.length === 0) {
        return (
            <p className="text-sm text-gray-400 py-4">
                No runs yet — first run on{' '}
                {schedule.startDate ? dayjs(schedule.startDate).format('DD MMM YYYY') : '—'}
            </p>
        );
    }

    const handleInvoiceClick = (invoiceId: string) => {
        navigate(`/${paths.invoice.index}/${paths.invoice.invoicedetails}`.replace(':id', invoiceId));
    };

    return (
        <div className="relative">
            <div className="absolute left-[7px] top-3 bottom-3 w-px bg-green-200" />
            <div className="space-y-5">
                {items.map((item, idx) => (
                    <div key={item.date + idx} className="flex items-start gap-4 relative">
                        <div
                            className={`w-4 h-4 rounded-full border-2 shrink-0 mt-0.5 z-10 ${
                                item.done
                                    ? 'bg-green-500 border-green-500'
                                    : 'bg-white border-green-400'
                            }`}
                        />
                        <div className="flex-1 flex items-start justify-between gap-2">
                            <div>
                                <p className="text-sm font-semibold text-gray-800">{item.label}</p>
                                {!item.done && (
                                    <p className="text-xs mt-0.5 text-gray-400">Scheduled</p>
                                )}
                                {item.done && item.invoiceId && item.invoiceLabel && (
                                    <span
                                        className="text-xs mt-0.5 text-red-500 cursor-pointer hover:underline font-medium"
                                        role="button"
                                        tabIndex={0}
                                        onClick={() => handleInvoiceClick(item.invoiceId!)}
                                        onKeyDown={e =>
                                            e.key === 'Enter' && handleInvoiceClick(item.invoiceId!)
                                        }
                                    >
                                        {item.invoiceLabel}
                                    </span>
                                )}
                                {item.done && !(item.invoiceId && item.invoiceLabel) && (
                                    <p className="text-xs mt-0.5 text-green-600">Generated</p>
                                )}
                            </div>
                            {item.done && (
                                <Tag className="!border !border-green-400 !text-green-600 !bg-transparent !text-[10px] !font-semibold !tracking-wider !rounded-sm shrink-0">
                                    GENERATED
                                </Tag>
                            )}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default RunHistory;
