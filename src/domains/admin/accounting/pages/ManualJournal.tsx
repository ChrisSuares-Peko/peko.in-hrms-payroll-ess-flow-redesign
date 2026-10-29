import { useEffect, useState } from 'react';

import { SearchOutlined } from '@ant-design/icons';
import { Alert, Button, Card, Flex, Input, Skeleton, Tooltip, Typography } from 'antd';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';

import GenericTable from '@components/atomic/GenericTable';
import { useAppSelector } from '@src/hooks/store';
import { useFindRolesService } from '@utils/findRolesService';

import JournalEditor, {
    NO_PERMISSION_TEXT,
    postedDescription,
} from '../components/manualOperations/JournalEditor';
import {
    eventColumns,
    historyColumns,
    orderSummaryItems,
} from '../components/manualOperations/manualJournalColumns';
import SummaryStrip from '../components/serviceDetail/SummaryStrip';
import TabHeader from '../components/serviceDetail/TabHeader';
import { manualJournalPath } from '../config/manualOperations';
import { ACCOUNTING_SERVICE_CATEGORY } from '../config/servicePaths';
import { withFaqTitles } from '../faq/FaqHint';
import useManualJournal from '../hooks/useManualJournal';
import { ManualJournalEvent, ManualJournalKey, ManualJournalResult } from '../types/manualJournal';

export const MANUAL_JOURNAL_INTRO =
    'Find the order by its transaction id. Each of its accounting events shows whether it is in the books; record the ones that never got there.';

const EVENT_KEYS: ManualJournalKey[] = [
    'transaction',
    'refund',
    'adminRefund',
    'cashback',
    'cashbackReversal',
];

const eventKeyOf = (value: string | null): ManualJournalKey | null =>
    EVENT_KEYS.includes(value as ManualJournalKey) ? (value as ManualJournalKey) : null;

const ManualJournal = () => {
    const { corporateTxnId = '' } = useParams();
    const [searchParams, setSearchParams] = useSearchParams();
    const navigate = useNavigate();
    const { services } = useAppSelector(state => state.reducer.services) ?? {};
    const access = useFindRolesService(
        services?.data,
        'Manual Operations',
        ACCOUNTING_SERVICE_CATEGORY
    );
    const canPost = Boolean(access?.update);

    const [search, setSearch] = useState(corporateTxnId);
    const { lookup, notFound, isLoading, accounts, refetch, preview, generateSplit, post } =
        useManualJournal(corporateTxnId || null);

    const requestedEvent = eventKeyOf(searchParams.get('event'));
    const [selected, setSelected] = useState<ManualJournalKey | null>(null);
    const [posted, setPosted] = useState<ManualJournalResult | null>(null);

    useEffect(() => {
        setSearch(corporateTxnId);
        setSelected(null);
        setPosted(null);
    }, [corporateTxnId]);

    useEffect(() => {
        if (!canPost || !lookup || !requestedEvent || selected) return;
        const event = lookup.events.find(item => item.key === requestedEvent);
        if (!event) return;
        if (event.eligibility.canRecord) setSelected(event.key);
    }, [canPost, lookup, requestedEvent, selected]);

    const open = (event: ManualJournalEvent) => {
        setPosted(null);
        setSelected(event.key);
        navigate(manualJournalPath(corporateTxnId, event.key), { replace: true });
    };

    const close = () => {
        setSelected(null);
        if (!requestedEvent) return;
        const next = new URLSearchParams(searchParams);
        next.delete('event');
        setSearchParams(next, { replace: true });
    };

    const onSearch = (value: string) => {
        const trimmed = value.trim();
        if (!trimmed) return;
        navigate(manualJournalPath(trimmed));
    };

    const renderActions = (event: ManualJournalEvent) => {
        const { canRecord, reasons } = event.eligibility;
        const enabled = canPost && canRecord;
        let hint = '';
        if (!canPost) hint = NO_PERMISSION_TEXT;
        else if (!canRecord) hint = reasons[0] || '';
        return (
            <Tooltip title={hint}>
                <Button
                    size="small"
                    type="primary"
                    disabled={!enabled}
                    onClick={() => open(event)}
                    aria-label={`Record ${event.label}`}
                >
                    Record
                </Button>
            </Tooltip>
        );
    };

    const selectedEvent =
        selected && lookup ? lookup.events.find(event => event.key === selected) : null;

    return (
        <Flex vertical gap={20}>
            <TabHeader
                title="Journal"
                description={MANUAL_JOURNAL_INTRO}
                action={
                    <Input.Search
                        className="w-[320px] max-w-full"
                        placeholder="Transaction id"
                        enterButton={<SearchOutlined />}
                        value={search}
                        onChange={changed => setSearch(changed.target.value)}
                        onSearch={onSearch}
                        aria-label="Transaction id"
                    />
                }
            />

            {isLoading && !lookup && <Skeleton active paragraph={{ rows: 6 }} />}

            {!isLoading && notFound && (
                <Card className="rounded-xl border border-borderCard shadow-none text-center">
                    <Typography.Title level={5} className="!text-textHeadings">
                        No order with transaction id {corporateTxnId}
                    </Typography.Title>
                    <Typography.Text className="text-textBody">
                        Check the id on Order Journals or on the customer’s receipt and try again.
                    </Typography.Text>
                </Card>
            )}

            {lookup && (
                <>
                    {lookup.recordingPaused && (
                        <Alert
                            type="warning"
                            showIcon
                            message="Journal recording is paused across the platform, so nothing can be posted until it is resumed."
                        />
                    )}
                    {lookup.beforeGoLive && (
                        <Alert
                            type="info"
                            showIcon
                            message="This order is dated before the accounting go-live date, so its entries are not kept in these books."
                        />
                    )}
                    <SummaryStrip
                        items={orderSummaryItems(lookup.order)}
                        faq={{ screen: 'Manual Operations', tab: 'Order' }}
                        distribution="space-between"
                    />
                    {posted && (
                        <Alert
                            type="success"
                            showIcon
                            closable
                            onClose={() => setPosted(null)}
                            message="Posted to the books"
                            description={postedDescription(posted)}
                        />
                    )}
                    <GenericTable
                        rowKey="key"
                        columns={withFaqTitles(
                            eventColumns(renderActions),
                            'Manual Operations',
                            'Events'
                        )}
                        dataSource={lookup.events}
                        pagination={false}
                    />
                    {selected && selectedEvent && (
                        <JournalEditor
                            key={`${lookup.order.corporateTxnId}:${selected}`}
                            lookup={lookup}
                            event={selectedEvent}
                            accounts={accounts}
                            canPost={canPost}
                            onPreview={body => preview(selected, body)}
                            onGenerateSplit={setup => generateSplit(selected, setup)}
                            onSubmit={payload => post(selected, payload)}
                            onPosted={result => {
                                if (result.success) {
                                    setPosted(result);
                                    close();
                                }
                                if (result.success || result.pending) refetch();
                            }}
                            onCancel={close}
                        />
                    )}
                    <Flex vertical gap={8}>
                        <Typography.Text strong>History</Typography.Text>
                        <GenericTable
                            rowKey="id"
                            columns={withFaqTitles(historyColumns, 'Manual Operations', 'History')}
                            dataSource={lookup.history}
                            pagination={false}
                            locale={{
                                emptyText:
                                    'Nothing has been posted or changed by hand for this order',
                            }}
                        />
                    </Flex>
                </>
            )}
        </Flex>
    );
};

export default ManualJournal;
