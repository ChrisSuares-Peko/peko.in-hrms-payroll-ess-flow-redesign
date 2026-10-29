import React from 'react';

import { Skeleton, Tag } from 'antd';
import dayjs from 'dayjs';
import { useNavigate } from 'react-router-dom';

import { paths } from '@src/routes/paths';

import type { RecurringScheduleApiData, RecurringScheduleStatus } from '../../../types/recurring';
import { endTextFromApi, freqTextFromApi } from '../../../utils/recurrenceEngine';

type Props = { schedule: RecurringScheduleApiData | null; isLoading: boolean };

const STATUS_CONFIG: Record<RecurringScheduleStatus, { bg: string; color: string; label: string }> =
    {
        ACTIVE: { bg: '#ECFDF5', color: '#059669', label: 'Active' },
        PAUSED: { bg: '#FFFBEB', color: '#D97706', label: 'Paused' },
        ENDED: { bg: '#F3F4F6', color: '#6B7280', label: 'Ended' },
    };

const Row = ({ label, children }: { label: string; children: React.ReactNode }) => (
    <div className="flex items-start justify-between py-2 border-b border-gray-100 last:border-0">
        <span className="text-sm text-gray-500 shrink-0 mr-4">{label}</span>
        <span className="text-sm text-gray-900 text-right">{children}</span>
    </div>
);

const RecurringScheduleCard: React.FC<Props> = ({ schedule, isLoading }) => {
    const navigate = useNavigate();

    if (isLoading) return <Skeleton active paragraph={{ rows: 6 }} />;

    const sourceInvoiceLabel = schedule?.sourceInvoice
        ? `${schedule.sourceInvoice.prefix ?? ''}${schedule.sourceInvoice.invoiceNumber ?? ''}`
        : null;

    const handleInvoiceClick = () => {
        if (!schedule?.sourceInvoiceId) return;
        navigate(`/${paths.invoice.index}/${paths.invoice.invoicedetails}`.replace(':id', String(schedule.sourceInvoiceId)));
    };

    const statusCfg = schedule?.status ? STATUS_CONFIG[schedule.status] : null;

    return (
        <div>
            <Row label="Status">
                {statusCfg ? (
                    <Tag
                        className="!rounded-full !border-0 !text-xs !font-medium !px-3 !py-0.5"
                        style={{ backgroundColor: statusCfg.bg, color: statusCfg.color }}
                    >
                        {statusCfg.label}
                    </Tag>
                ) : '—'}
            </Row>
            <Row label="Frequency">
                {schedule ? freqTextFromApi(schedule.frequency) : '—'}
            </Row>
            <Row label="Start Date">
                {schedule?.startDate ? dayjs(schedule.startDate).format('DD MMM YYYY') : '—'}
            </Row>
            <Row label="End">
                <span
                    style={{
                        color: schedule?.endCondition.type === 'FOREVER' ? '#059669' : undefined,
                    }}
                >
                    {schedule ? endTextFromApi(schedule.endCondition) : '—'}
                </span>
            </Row>
            <Row label="Next Run">
                {schedule?.nextRunDate ? dayjs(schedule.nextRunDate).format('DD MMM YYYY') : '—'}
            </Row>
            <Row label="Completed Runs">{schedule?.completedRuns ?? 0}</Row>
            {/* <Row label="Type">
                <Tag className="!rounded !border-gray-300 !text-gray-600 !bg-white !text-xs">
                    Standard
                </Tag>
            </Row> */}
            {sourceInvoiceLabel && (
                <Row label="Source Invoice">
                    <span
                        className="text-red-500 cursor-pointer hover:underline font-medium"
                        role="button"
                        tabIndex={0}
                        onClick={handleInvoiceClick}
                        onKeyDown={e => e.key === 'Enter' && handleInvoiceClick()}
                    >
                        {sourceInvoiceLabel}
                    </span>
                </Row>
            )}
        </div>
    );
};

export default RecurringScheduleCard;
