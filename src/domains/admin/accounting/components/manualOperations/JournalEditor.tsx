import { HTMLAttributes, createContext, useContext, useEffect, useMemo, useState } from 'react';

import { DeleteOutlined, HolderOutlined, PlusOutlined, ReloadOutlined } from '@ant-design/icons';
import type { DragDropEventMap } from '@dnd-kit/abstract';
import { move } from '@dnd-kit/helpers';
import { DragDropProvider } from '@dnd-kit/react';
import { useSortable } from '@dnd-kit/react/sortable';
import {
    Alert,
    Button,
    Col,
    DatePicker,
    Flex,
    Input,
    InputNumber,
    Row,
    Select,
    Table,
    Tooltip,
    Typography,
} from 'antd';
import dayjs, { Dayjs } from 'dayjs';

import {
    FIELD_LABELS,
    MANUAL_SPLIT_KEYS,
    camelToTitle,
    getFinancialFields,
} from '@src/domains/admin/reports/components/OrderJournal/journalFields';

import JournalSetup from './JournalSetup';
import { EDITOR_LABELS } from './manualJournalColumns';
import {
    ManualJournalAccount,
    ManualJournalEntryPayload,
    ManualJournalEvent,
    ManualJournalLookup,
    ManualJournalPreview,
    ManualJournalPreviewLine,
    ManualJournalPreviewPayload,
    ManualJournalResult,
    ManualJournalSetup,
    ManualJournalSplitTemplate,
    ManualJournalSplitValue,
} from '../../types/manualJournal';
import { formatInr } from '../../utils/commission';
import StatusPill from '../common/StatusPill';
import TabHeader from '../serviceDetail/TabHeader';

type EditableLine = {
    key: number;
    accountId: string;
    accountName: string | null;
    direction: 'debit' | 'credit';
    amount: number | null;
    description: string;
};

type Props = {
    lookup: ManualJournalLookup;
    event: ManualJournalEvent;
    accounts: ManualJournalAccount[];
    canPost: boolean;
    onPreview: (body: ManualJournalPreviewPayload) => Promise<ManualJournalPreview | false>;
    onGenerateSplit?: (setup: ManualJournalSetup) => Promise<ManualJournalSplitTemplate | false>;
    onSubmit: (payload: ManualJournalEntryPayload) => Promise<ManualJournalResult>;
    onPosted: (result: ManualJournalResult) => void;
    onCancel: () => void;
};

// The lines post in the order they are listed, so a row can be dragged by its handle. The
// table renders each row through SortableLineRow, which registers the row with dnd-kit and
// hands its drag handle down to the handle cell.
const LineOrderContext = createContext<{ keys: number[]; disabled: boolean }>({
    keys: [],
    disabled: true,
});

type HandleRef = ReturnType<typeof useSortable>['handleRef'];

const LineHandleContext = createContext<HandleRef | null>(null);

type SortableLineRowProps = HTMLAttributes<HTMLTableRowElement> & {
    'data-row-key'?: number;
};

const SortableLineRow = ({ 'data-row-key': rowKey, className, ...props }: SortableLineRowProps) => {
    const { keys, disabled } = useContext(LineOrderContext);
    const index = rowKey === undefined ? -1 : keys.indexOf(Number(rowKey));
    const { ref, handleRef, isDragging } = useSortable({
        id: rowKey === undefined ? 'placeholder' : Number(rowKey),
        index: Math.max(index, 0),
        disabled: disabled || index < 0,
    });

    return (
        <LineHandleContext.Provider value={handleRef}>
            <tr
                ref={ref}
                className={`${className ?? ''}${isDragging ? ' opacity-40' : ''}`}
                {...props}
            />
        </LineHandleContext.Provider>
    );
};

const LineDragHandle = ({ label, disabled }: { label: string; disabled: boolean }) => {
    const handleRef = useContext(LineHandleContext);
    return (
        <span
            ref={disabled ? undefined : handleRef}
            role="button"
            aria-label={label}
            aria-disabled={disabled}
            title={disabled ? undefined : 'Drag to reorder'}
            className={`flex justify-center text-textGrey ${
                disabled
                    ? 'cursor-not-allowed opacity-40'
                    : 'cursor-grab hover:text-brandColor active:cursor-grabbing'
            }`}
        >
            <HolderOutlined />
        </span>
    );
};

export const postedDescription = (result: ManualJournalResult) =>
    `Entry reference ${result.providerJournalId}.`;

const WALLET_KEYS = new Set(['cashback', 'cashbackReversal']);

const round2 = (value: number) => Math.round((value + Number.EPSILON) * 100) / 100;

type Side = 'debit' | 'credit';

const SIDES: Side[] = ['debit', 'credit'];

const sideChange = (
    line: EditableLine,
    side: Side,
    value: number | null
): Partial<EditableLine> => {
    if (value === null) return line.direction === side ? { amount: null } : {};
    return { direction: side, amount: value };
};

const signatureOf = (lines: { accountId: string; direction: string; amount: number | null }[]) =>
    JSON.stringify(
        lines
            .map(line => `${line.accountId}|${line.direction}|${round2(Number(line.amount) || 0)}`)
            .sort()
    );

const toEditable = (lines: ManualJournalPreviewLine[]): EditableLine[] =>
    lines.map((line, index) => ({
        key: index + 1,
        accountId: line.accountId ? String(line.accountId) : '',
        accountName: line.accountName ?? null,
        direction: line.direction,
        amount: line.amount === null || line.amount === undefined ? null : Number(line.amount),
        description: line.description || '',
    }));

const SUGGESTED_NOTE =
    'The lines could not be worked out from the order, so only the rows the order itself knows are suggested: the gateway, the wallet, the platform fee with its GST and the partner rows. Add the commission, vendor deposit or sales rows by hand and check every figure before posting.';

export const NO_PERMISSION_TEXT = 'Your role can view journals here but cannot post or change them';

export const SPLIT_NOT_GENERATED_TEXT = 'Generate the split figures from the set-up above first.';
export const LINES_NOT_BUILT_TEXT = 'Rebuild the lines from the split figures first.';

// The full set of figures a hand-recorded sale can carry, for an order whose breakdown was
// never worked out; which of them are editable comes from the generated template.
const MANUAL_SPLIT_FIELDS = MANUAL_SPLIT_KEYS.map(key => ({
    key,
    label: FIELD_LABELS[key] ?? camelToTitle(key),
    isPercent: false,
}));

const JournalEditor = ({
    lookup,
    event,
    accounts,
    canPost,
    onPreview,
    onGenerateSplit,
    onSubmit,
    onPosted,
    onCancel,
}: Props) => {
    const isWallet = WALLET_KEYS.has(event.key);
    // An order whose breakdown was never worked out is set up first: how it was sold decides
    // which figures apply, and nothing is guessed from a service setting or from the lines.
    const needsSetup = Boolean(lookup.setup) && event.key === 'transaction';
    const [setup, setSetup] = useState<ManualJournalSetup | null>(lookup.setup);
    const [template, setTemplate] = useState<ManualJournalSplitTemplate | null>(null);
    const [setupStale, setSetupStale] = useState(false);
    const [isGenerating, setIsGenerating] = useState(false);
    const [linesReady, setLinesReady] = useState(!needsSetup);
    const [splitFacts, setSplitFacts] = useState<Record<string, ManualJournalSplitValue>>({});
    const [splitSource, setSplitSource] = useState<Record<string, unknown>>(lookup.split);
    const storedFields = useMemo(() => getFinancialFields(splitSource), [splitSource]);
    const splitFields = needsSetup ? MANUAL_SPLIT_FIELDS : storedFields;
    const splitEnabled = (key: string) =>
        !needsSetup || Boolean(template && template.enabledKeys.includes(key));

    const [split, setSplit] = useState<Record<string, number | null>>(() =>
        Object.fromEntries(
            (needsSetup ? MANUAL_SPLIT_FIELDS : storedFields).map(({ key }) => [
                key,
                needsSetup ? null : Number(lookup.split[key]) || 0,
            ])
        )
    );
    const splitPayload = (): Record<string, ManualJournalSplitValue> => ({
        ...splitFacts,
        ...(Object.fromEntries(
            Object.entries(split).filter(
                ([key, value]) => value !== null && value !== undefined && splitEnabled(key)
            )
        ) as Record<string, number>),
    });
    const [amount, setAmount] = useState<number | null>(event.defaults.amount ?? null);
    const [lines, setLines] = useState<EditableLine[]>([]);
    const [journalAccountIds, setJournalAccountIds] = useState<Record<string, unknown> | null>(
        null
    );
    const [journalDate, setJournalDate] = useState<string>(event.defaults.journalDate);
    const [reason, setReason] = useState('');
    const [previewSignature, setPreviewSignature] = useState<string | null>(null);
    const [previewReason, setPreviewReason] = useState<string | null>(null);
    const [isPreviewing, setIsPreviewing] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [outcome, setOutcome] = useState<ManualJournalResult | null>(null);
    const [nextKey, setNextKey] = useState(() => lines.length + 1);

    const clearGenerated = () => {
        setTemplate(null);
        setSplitFacts({});
        setJournalAccountIds(null);
        setSplit(previous => Object.fromEntries(Object.keys(previous).map(key => [key, null])));
        setLines([]);
        setLinesReady(false);
        setPreviewSignature(null);
        setPreviewReason(null);
    };

    const onSetupChange = (next: ManualJournalSetup) => {
        setSetup(next);
        if (template) {
            clearGenerated();
            setSetupStale(true);
        }
    };

    const generate = async () => {
        if (!onGenerateSplit || !setup) return;
        setIsGenerating(true);
        const result = await onGenerateSplit(setup);
        setIsGenerating(false);
        if (!result) {
            setPreviewReason('The split figures could not be worked out from the set-up');
            return;
        }
        clearGenerated();
        setTemplate(result);
        setSetupStale(false);
        setSplit(
            Object.fromEntries(MANUAL_SPLIT_KEYS.map(key => [key, result.split[key] ?? null]))
        );
        setSplitFacts(result.facts);
        setJournalAccountIds(result.journalAccountIds);
    };

    const rebuild = async () => {
        if (needsSetup && !template) return;
        setIsPreviewing(true);
        setPreviewReason(null);
        const preview = await onPreview({
            ...(splitFields.length ? { journalData: splitPayload() } : {}),
            ...(isWallet && amount ? { amount } : {}),
        });
        setIsPreviewing(false);
        if (!preview || !preview.ok) {
            const suggested =
                preview && preview.suggested && preview.lineItems.length
                    ? toEditable(preview.lineItems)
                    : null;
            const refusal = (preview && preview.reason) || null;
            const suggestedSplit = (preview && preview.split) || null;
            if (suggested) {
                setLines(suggested);
                setNextKey(suggested.length + 1);
                setLinesReady(true);
                if (!needsSetup && suggestedSplit && Object.keys(suggestedSplit).length) {
                    // A suggested blank never wipes a figure already typed or stored; it only
                    // adds the field so it can be filled in.
                    const known = Object.entries(suggestedSplit).filter(
                        ([, value]) => value !== null && value !== undefined
                    );
                    setSplitSource(previous => ({
                        ...Object.fromEntries(Object.keys(suggestedSplit).map(key => [key, 0])),
                        ...previous,
                        ...Object.fromEntries(known),
                    }));
                    setSplit(previous => ({
                        ...Object.fromEntries(Object.keys(suggestedSplit).map(key => [key, null])),
                        ...previous,
                        ...Object.fromEntries(known),
                    }));
                }
                setPreviewReason(refusal ? `${SUGGESTED_NOTE} (${refusal})` : SUGGESTED_NOTE);
                return;
            }
            setPreviewReason(refusal || 'The lines could not be worked out');
            return;
        }
        const rebuilt = toEditable(preview.lineItems);
        setLines(rebuilt);
        setNextKey(rebuilt.length + 1);
        setLinesReady(true);
        setJournalAccountIds(previous => preview.journalAccountIds ?? previous);
        setPreviewSignature(signatureOf(rebuilt));
        if (!preview.balanced && preview.reason) setPreviewReason(preview.reason);
    };

    useEffect(() => {
        if (!needsSetup) rebuild();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [event.key]);

    const totals = useMemo(() => {
        const sum = (direction: 'debit' | 'credit') =>
            round2(
                lines.reduce(
                    (total, line) =>
                        total + (line.direction === direction ? Number(line.amount) || 0 : 0),
                    0
                )
            );
        return { debit: sum('debit'), credit: sum('credit') };
    }, [lines]);
    const isBalanced = lines.length >= 2 && Math.abs(totals.debit - totals.credit) < 0.005;
    const linesComplete = lines.every(line => line.accountId && Number(line.amount) > 0);
    const driftsFromSplit = previewSignature !== null && signatureOf(lines) !== previewSignature;
    const refundPosted =
        event.key === 'transaction' && event.warnings.some(text => text.includes('refund entry'));
    const canSubmit =
        canPost &&
        linesReady &&
        isBalanced &&
        linesComplete &&
        reason.trim().length >= 3 &&
        Boolean(journalDate) &&
        !isSubmitting;

    const accountOptions = useMemo(() => {
        const options = accounts.map(account => ({ value: account.id, label: account.name }));
        lines.forEach(line => {
            if (line.accountId && !options.some(option => option.value === line.accountId)) {
                options.push({ value: line.accountId, label: line.accountName || line.accountId });
            }
        });
        return options;
    }, [accounts, lines]);

    const updateLine = (key: number, patch: Partial<EditableLine>) =>
        setLines(previous =>
            previous.map(line => (line.key === key ? { ...line, ...patch } : line))
        );

    const addLine = () => {
        setLines(previous => [
            ...previous,
            {
                key: nextKey,
                accountId: '',
                accountName: null,
                direction: 'debit',
                amount: null,
                description: '',
            },
        ]);
        setNextKey(nextKey + 1);
    };

    const removeLine = (key: number) =>
        setLines(previous => previous.filter(line => line.key !== key));

    const lineKeys = useMemo(() => lines.map(line => line.key), [lines]);
    const lineOrder = useMemo(
        () => ({ keys: lineKeys, disabled: !canPost || !linesReady }),
        [lineKeys, canPost, linesReady]
    );

    // move() resolves the new order from the ids dnd-kit tracked during the drag, which is
    // steadier than index arithmetic against our own array while the rows are animating.
    const onLinesDragEnd = (dragEnd: DragDropEventMap<any, any, any>['dragend']) => {
        if (dragEnd.canceled) return;
        const reordered = move(lineKeys, dragEnd);
        if (reordered === lineKeys) return;
        const byKey = new Map(lines.map(line => [line.key, line]));
        setLines(reordered.map(key => byKey.get(key) as EditableLine));
    };

    const disabledDate = (current: Dayjs) =>
        current.isAfter(dayjs(), 'day') || !current.isAfter(dayjs(lookup.accountingFloor), 'day');

    const submit = async () => {
        if (!canSubmit) return;
        setIsSubmitting(true);
        const result = await onSubmit({
            journalDate,
            lineItems: lines.map(line => ({
                accountId: line.accountId,
                direction: line.direction,
                amount: round2(Number(line.amount)),
                description: line.description || undefined,
            })),
            ...(splitFields.length ? { journalData: splitPayload() } : {}),
            ...(journalAccountIds ? { journalAccountIds } : {}),
            reason: reason.trim(),
        });
        setIsSubmitting(false);
        setOutcome(result);
        onPosted(result);
    };

    const lineColumns = [
        {
            title: '',
            key: 'move',
            width: 40,
            render: (_: unknown, line: EditableLine) => (
                <LineDragHandle
                    label={`Move line ${line.key}`}
                    disabled={!canPost || !linesReady}
                />
            ),
        },
        {
            title: EDITOR_LABELS.account,
            key: 'account',
            render: (_: unknown, line: EditableLine) => (
                <Select
                    showSearch
                    className="w-full"
                    placeholder={line.accountName || 'Pick an account'}
                    optionFilterProp="label"
                    value={line.accountId || undefined}
                    options={accountOptions}
                    disabled={!canPost}
                    onChange={value =>
                        updateLine(line.key, {
                            accountId: value,
                            accountName:
                                accountOptions.find(option => option.value === value)?.label ||
                                null,
                        })
                    }
                    aria-label={`Account for line ${line.key}`}
                />
            ),
        },
        ...SIDES.map(side => ({
            title: EDITOR_LABELS[side],
            key: side,
            width: 150,
            render: (_: unknown, line: EditableLine) => (
                <InputNumber
                    className="w-full"
                    min={0}
                    precision={2}
                    value={line.direction === side ? line.amount : null}
                    disabled={!canPost}
                    onChange={value => updateLine(line.key, sideChange(line, side, value))}
                    aria-label={`${EDITOR_LABELS[side]} for line ${line.key}`}
                />
            ),
        })),
        {
            title: EDITOR_LABELS.description,
            key: 'description',
            width: 220,
            render: (_: unknown, line: EditableLine) => (
                <Input
                    value={line.description}
                    placeholder={lookup.order.corporateTxnId}
                    maxLength={200}
                    disabled={!canPost}
                    onChange={changed =>
                        updateLine(line.key, { description: changed.target.value })
                    }
                    aria-label={`Description for line ${line.key}`}
                />
            ),
        },
        {
            title: '',
            key: 'remove',
            width: 56,
            render: (_: unknown, line: EditableLine) => (
                <Button
                    type="text"
                    size="small"
                    danger
                    icon={<DeleteOutlined />}
                    disabled={!canPost}
                    onClick={() => removeLine(line.key)}
                    aria-label={`Remove line ${line.key}`}
                />
            ),
        },
    ];

    const title = `Record the ${event.label.toLowerCase()} entry`;
    const description = needsSetup
        ? 'State how the order was sold, generate the split figures, rebuild the lines from them, say why, and post.'
        : 'The lines below are what the pipeline would have posted. Adjust them if needed, say why, and post.';

    return (
        <Flex vertical gap={16} className="rounded-xl border border-solid border-borderCard p-5">
            <TabHeader
                title={title}
                description={description}
                action={
                    <Button onClick={onCancel} disabled={isSubmitting}>
                        Close
                    </Button>
                }
            />

            {event.warnings.map(text => (
                <Alert key={text} type="warning" showIcon message={text} />
            ))}
            {!canPost && <Alert type="info" showIcon message={NO_PERMISSION_TEXT} />}
            {outcome && !outcome.success && (
                <Alert
                    type="error"
                    showIcon
                    message={outcome.pending ? 'Still posting' : 'Not posted'}
                    description={outcome.reason || 'The books did not accept the entry'}
                />
            )}

            {needsSetup && setup && (
                <Flex vertical gap={8}>
                    <Typography.Text strong>{EDITOR_LABELS.setup}</Typography.Text>
                    <JournalSetup
                        value={setup}
                        accounts={accounts}
                        disabled={!canPost}
                        generating={isGenerating}
                        stale={setupStale}
                        onChange={onSetupChange}
                        onGenerate={generate}
                    />
                </Flex>
            )}

            {splitFields.length > 0 && !isWallet && (
                <Flex vertical gap={8}>
                    <Flex justify="space-between" align="center" wrap="wrap" gap={8}>
                        <Flex gap={8} align="center" wrap="wrap">
                            <Typography.Text strong>{EDITOR_LABELS.split}</Typography.Text>
                            {needsSetup && !template && (
                                <Typography.Text className="text-xs text-textBody">
                                    {SPLIT_NOT_GENERATED_TEXT}
                                </Typography.Text>
                            )}
                        </Flex>
                        <Button
                            icon={<ReloadOutlined />}
                            loading={isPreviewing}
                            disabled={!canPost || (needsSetup && !template)}
                            onClick={rebuild}
                        >
                            Rebuild lines from split
                        </Button>
                    </Flex>
                    <Row gutter={[12, 12]}>
                        {splitFields.map(({ key, label }) => (
                            <Col xs={24} sm={12} xl={6} key={key}>
                                <Flex vertical gap={2}>
                                    <Typography.Text className="text-xs text-textBody">
                                        {label}
                                    </Typography.Text>
                                    <InputNumber
                                        className="w-full"
                                        min={0}
                                        precision={2}
                                        value={split[key]}
                                        disabled={!canPost || !splitEnabled(key)}
                                        onChange={value =>
                                            setSplit(previous => ({
                                                ...previous,
                                                [key]: value === null ? null : Number(value),
                                            }))
                                        }
                                        aria-label={label}
                                    />
                                </Flex>
                            </Col>
                        ))}
                    </Row>
                    {refundPosted && (
                        <Typography.Text className="text-xs text-muted">
                            The posted refund keeps the split it was worked out from; edit it as its
                            own event if the split changes.
                        </Typography.Text>
                    )}
                </Flex>
            )}

            {isWallet && (
                <Flex gap={12} align="end" wrap="wrap">
                    <Flex vertical gap={2}>
                        <Typography.Text className="text-xs text-textBody">
                            {EDITOR_LABELS.amount}
                        </Typography.Text>
                        <InputNumber
                            min={0}
                            precision={2}
                            value={amount}
                            disabled={!canPost}
                            onChange={value => setAmount(value)}
                            aria-label="Wallet amount"
                        />
                    </Flex>
                    <Button
                        icon={<ReloadOutlined />}
                        loading={isPreviewing}
                        disabled={!canPost}
                        onClick={rebuild}
                    >
                        Rebuild lines
                    </Button>
                </Flex>
            )}

            {previewReason && <Alert type="warning" showIcon message={previewReason} />}

            <Flex vertical gap={8}>
                <Flex justify="space-between" align="center" wrap="wrap" gap={8}>
                    <Flex gap={8} align="center">
                        <Typography.Text strong>{EDITOR_LABELS.lines}</Typography.Text>
                        <StatusPill
                            label={isBalanced ? 'Balanced' : 'Not balanced'}
                            tone={isBalanced ? 'success' : 'warning'}
                        />
                        {driftsFromSplit && (
                            <Tooltip title="The lines no longer match what the split would rebuild. What you post is what you see.">
                                <span>
                                    <StatusPill label="Differs from split" tone="neutral" />
                                </span>
                            </Tooltip>
                        )}
                    </Flex>
                    <Button
                        icon={<PlusOutlined />}
                        disabled={!canPost || !linesReady}
                        onClick={addLine}
                    >
                        Add line
                    </Button>
                </Flex>
                <DragDropProvider onDragEnd={onLinesDragEnd}>
                    <LineOrderContext.Provider value={lineOrder}>
                        <Table
                            rowKey="key"
                            columns={lineColumns}
                            dataSource={lines}
                            components={{ body: { row: SortableLineRow } }}
                            pagination={false}
                            size="small"
                            locale={{
                                emptyText: linesReady ? 'No lines yet' : LINES_NOT_BUILT_TEXT,
                            }}
                            summary={() => (
                                <Table.Summary.Row>
                                    <Table.Summary.Cell index={0} colSpan={2}>
                                        <Typography.Text strong>Total</Typography.Text>
                                    </Table.Summary.Cell>
                                    <Table.Summary.Cell index={2} colSpan={2}>
                                        <Typography.Text strong>
                                            Debit {formatInr(totals.debit)} · Credit{' '}
                                            {formatInr(totals.credit)}
                                        </Typography.Text>
                                    </Table.Summary.Cell>
                                    <Table.Summary.Cell index={4} colSpan={2} />
                                </Table.Summary.Row>
                            )}
                        />
                    </LineOrderContext.Provider>
                </DragDropProvider>
            </Flex>

            <Row gutter={[16, 16]}>
                <Col xs={24} md={8}>
                    <Flex vertical gap={2}>
                        <Typography.Text className="text-xs text-textBody">
                            {EDITOR_LABELS.journalDate}
                        </Typography.Text>
                        <DatePicker
                            className="w-full"
                            allowClear={false}
                            format="YYYY-MM-DD"
                            value={journalDate ? dayjs(journalDate) : null}
                            disabledDate={disabledDate}
                            disabled={!canPost}
                            onChange={value => value && setJournalDate(value.format('YYYY-MM-DD'))}
                            aria-label={EDITOR_LABELS.journalDate}
                        />
                    </Flex>
                </Col>
                <Col xs={24} md={16}>
                    <Flex vertical gap={2}>
                        <Typography.Text className="text-xs text-textBody">
                            {EDITOR_LABELS.reason}
                        </Typography.Text>
                        <Input.TextArea
                            rows={2}
                            maxLength={200}
                            showCount
                            value={reason}
                            disabled={!canPost}
                            placeholder="Why this entry is being posted or changed"
                            onChange={changed => setReason(changed.target.value)}
                            aria-label={EDITOR_LABELS.reason}
                        />
                    </Flex>
                </Col>
            </Row>

            <Flex justify="end" gap={10}>
                <Tooltip title={canPost ? '' : NO_PERMISSION_TEXT}>
                    <Button
                        type="primary"
                        loading={isSubmitting}
                        disabled={!canSubmit}
                        onClick={submit}
                    >
                        Post to the books
                    </Button>
                </Tooltip>
            </Flex>
        </Flex>
    );
};

export default JournalEditor;
