import { ReactNode, useState } from 'react';

import { DownloadOutlined } from '@ant-design/icons';
import { Button, Modal, Segmented, Typography } from 'antd';

import { useAppDispatch, useAppSelector } from '@src/hooks/store';
import { showToast } from '@src/slices/apiSlice';

import { exportCardAudit } from '../../api/admin/cardLimitsApi';
import controlIcon from '../../assets/icons/control.svg';
import lifeCycleIcon from '../../assets/icons/lifeCycle.svg';
import limitIcon from '../../assets/icons/limit.svg';
import securityIcon from '../../assets/icons/security.svg';
import { useAuditTrailApi } from '../../hooks/admin/useAuditTrailApi';
import { AUDIT_FILTERS, AUDIT_TRAIL_SUBTITLE } from '../../utils/auditTrailData';
import { CardAuditCategory } from '../../utils/types';
import { MODAL_CLOSE_ICON, PineLabsFooter, ROUNDED_MODAL_CLASSNAMES } from '../common/modalProps';

const { Title, Text } = Typography;

type Filter = (typeof AUDIT_FILTERS)[number];

interface AuditTrailModalProps {
    open: boolean;
    onClose: () => void;
    last4?: string;
    cardIssuanceId?: string;
}

const CATEGORY_ICON: Record<CardAuditCategory, ReactNode> = {
    Lifecycle: <img src={lifeCycleIcon} alt="" className="h-4 w-4" />,
    Limits: <img src={limitIcon} alt="" className="h-4 w-4" />,
    Controls: <img src={controlIcon} alt="" className="h-4 w-4" />,
    Security: <img src={securityIcon} alt="" className="h-4 w-4" />,
};

const CATEGORY_PILL: Record<CardAuditCategory, string> = {
    Lifecycle: 'bg-listBg text-textBody',
    Limits: 'bg-bgLightBlue text-bgDodgerblue',
    Controls: 'bg-bgOrangeShade text-textOrange',
    Security: 'bg-bgLightPink text-errorTextRed',
};

/** Per-card audit trail modal: filterable chronological log + CSV export. */
const AuditTrailModal = ({ open, onClose, last4, cardIssuanceId }: AuditTrailModalProps) => {
    const dispatch = useAppDispatch();
    const { role, id } = useAppSelector(state => state.reducer.auth);
    const [filter, setFilter] = useState<Filter>('All events');
    const [exporting, setExporting] = useState(false);

    const { events: allEvents, isLoading } = useAuditTrailApi(
        open ? (cardIssuanceId ?? null) : null
    );

    const events =
        filter === 'All events' ? allEvents : allEvents.filter(event => event.category === filter);

    const handleClose = () => {
        setFilter('All events');
        onClose();
    };

    const handleExport = async () => {
        if (!cardIssuanceId || allEvents.length === 0) return;
        setExporting(true);
        const res = await exportCardAudit(role, id, cardIssuanceId);
        setExporting(false);
        if (res) {
            const url = URL.createObjectURL(res);
            const a = document.createElement('a');
            a.href = url;
            a.download = `audit-trail-${last4}.csv`;
            a.click();
            URL.revokeObjectURL(url);
            dispatch(
                showToast({ variant: 'success', description: 'Audit trail exported successfully' })
            );
        }
    };

    return (
        <Modal
            open={open}
            onCancel={handleClose}
            footer={null}
            centered
            width={560}
            destroyOnHidden
            classNames={ROUNDED_MODAL_CLASSNAMES}
            closeIcon={MODAL_CLOSE_ICON}
        >
            <div className="flex flex-col gap-5">
                <div className="flex flex-col gap-2">
                    <Title level={4} className="!mb-0 !text-textHeadings">
                        {last4 ? `Audit trail · •• ${last4}` : 'Audit Trail'}
                    </Title>
                    <Text className="text-sm text-textBody">{AUDIT_TRAIL_SUBTITLE}</Text>
                </div>

                <div className="hide-scrollbar -mx-1 overflow-x-auto px-1">
                    <Segmented
                        block
                        value={filter}
                        onChange={value => setFilter(value as Filter)}
                        options={AUDIT_FILTERS as unknown as string[]}
                        style={{ borderRadius: 9999, padding: '4px' }}
                        className="!w-max sm:!w-full [&_.ant-segmented-item]:!flex-none sm:[&_.ant-segmented-item]:!flex-1 [&_.ant-segmented-item]:!rounded-full [&_.ant-segmented-thumb]:!rounded-full [&_.ant-segmented-item-selected]:!rounded-full [&_.ant-segmented-item-selected]:!text-textLightRed [&_.ant-segmented-item:not(.ant-segmented-item-selected):hover]:!bg-transparent [&_.ant-segmented-item-label]:!whitespace-nowrap"
                    />
                </div>

                <ul className="hide-scrollbar flex max-h-[55vh] flex-col gap-3 overflow-y-auto">
                    {isLoading && (
                        <li className="py-8 text-center text-sm text-textBody">Loading…</li>
                    )}
                    {!isLoading && events.length === 0 && (
                        <li className="py-8 text-center text-sm text-textBody">
                            No audit events found.
                        </li>
                    )}
                    {!isLoading &&
                        events.map(event => (
                            <li
                                key={event.key}
                                className="flex items-start gap-3 rounded-2xl border border-borderCard p-4"
                            >
                                <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-listBg text-textHeadings">
                                    {CATEGORY_ICON[event.category]}
                                </span>
                                <div className="flex min-w-0 flex-1 flex-col gap-1">
                                    <Text className="text-sm font-semibold text-textHeadings">
                                        {event.title}
                                    </Text>
                                    <Text className="text-sm text-textBody">
                                        {event.description}
                                    </Text>
                                    <Text className="text-xs text-textGreyLight">
                                        {event.timestamp} · {event.actor}
                                    </Text>
                                </div>
                                <span
                                    className={`shrink-0 self-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
                                        CATEGORY_PILL[event.category]
                                    }`}
                                >
                                    {event.category}
                                </span>
                            </li>
                        ))}
                </ul>

                <div className="flex flex-col gap-4">
                    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                        <Button danger onClick={handleClose} className="font-medium">
                            Close
                        </Button>
                        <Button
                            type="primary"
                            icon={<DownloadOutlined />}
                            loading={exporting}
                            disabled={isLoading || events.length === 0}
                            onClick={handleExport}
                            className="font-medium"
                        >
                            Export CSV
                        </Button>
                    </div>
                    <PineLabsFooter />
                </div>
            </div>
        </Modal>
    );
};

export default AuditTrailModal;
