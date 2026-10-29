import { useCallback, useEffect, useState } from 'react';

import { FileProtectOutlined, UndoOutlined } from '@ant-design/icons';
import { Button, Flex, InputNumber, Spin, Typography } from 'antd';

import { useAppDispatch, useAppSelector } from '@src/hooks/store';
import { showToast } from '@src/slices/apiSlice';

import {
    getDocumentSizeLimits,
    updateDocumentSizeLimits,
} from '../../api/corporateCardDocumentLimits';
import {
    DocumentSizeLimitRow,
    DocumentTotalKey,
    DocumentTotalLimits,
} from '../../types/corporateCardDocumentLimits';

const sizeLabel = (kb: number) => (kb % 1024 === 0 ? `${kb / 1024} MB` : `${kb} KB`);

const CorporateCardDocumentLimits = () => {
    const dispatch = useAppDispatch();
    const { role, id: userId } = useAppSelector(state => state.reducer.auth);

    const [rows, setRows] = useState<DocumentSizeLimitRow[]>([]);
    const [edited, setEdited] = useState<Record<string, number>>({});
    const [bounds, setBounds] = useState({
        minSizeKb: 100,
        maxSizeKb: 20 * 1024,
        minTotalKb: 1024,
        maxTotalKb: 100 * 1024,
    });
    const [totals, setTotals] = useState<DocumentTotalLimits | null>(null);
    const [editedTotals, setEditedTotals] = useState<Record<string, number>>({});
    const [isLoading, setIsLoading] = useState(false);
    const [isSaving, setIsSaving] = useState(false);

    const load = useCallback(async () => {
        setIsLoading(true);
        const resp = await getDocumentSizeLimits({ userType: role, userId });
        if (resp) {
            setRows(resp.documents);
            setTotals(resp.totals);
            setBounds({
                minSizeKb: resp.minSizeKb,
                maxSizeKb: resp.maxSizeKb,
                minTotalKb: resp.minTotalKb,
                maxTotalKb: resp.maxTotalKb,
            });
        }
        setEdited({});
        setEditedTotals({});
        setIsLoading(false);
    }, [role, userId]);

    useEffect(() => {
        load();
    }, [load]);

    const valueFor = (row: DocumentSizeLimitRow) => edited[row.documentName] ?? row.maxSizeKb;

    const changed = rows.filter(row => valueFor(row) !== row.maxSizeKb);

    const TOTAL_FIELDS: { key: DocumentTotalKey; label: string; helper: string }[] = [
        {
            key: 'totalUploadKb',
            label: 'Total documents a corporate may upload',
            helper: 'Checked when they submit for verification.',
        },
        {
            key: 'vendorPackKb',
            label: 'Total pack sent to the vendor',
            helper: 'Includes the signed agreement on top of the uploads.',
        },
    ];

    const totalValueFor = (key: keyof DocumentTotalLimits) =>
        editedTotals[key] ?? (totals?.[key] as number) ?? 0;

    const changedTotals = totals
        ? TOTAL_FIELDS.filter(field => totalValueFor(field.key) !== totals[field.key])
        : [];

    const totalsOutOfRange = changedTotals.some(field => {
        const value = totalValueFor(field.key);
        return !Number.isInteger(value) || value < bounds.minTotalKb || value > bounds.maxTotalKb;
    });

    const packTooSmall = !!totals && totalValueFor('vendorPackKb') < totalValueFor('totalUploadKb');

    const isOutOfRange = changed.some(row => {
        const value = valueFor(row);
        return !Number.isInteger(value) || value < bounds.minSizeKb || value > bounds.maxSizeKb;
    });

    const handleSave = async () => {
        setIsSaving(true);
        const limits = changed.reduce(
            (acc, row) => ({ ...acc, [row.documentName]: valueFor(row) }),
            {} as Record<string, number>
        );
        const nextTotals = changedTotals.reduce(
            (acc, field) => ({ ...acc, [field.key]: totalValueFor(field.key) }),
            {} as Record<string, number>
        );
        const resp = await updateDocumentSizeLimits(
            { userType: role, userId },
            {
                ...(changed.length ? { limits } : {}),
                ...(changedTotals.length ? { totals: nextTotals } : {}),
            }
        );
        setIsSaving(false);
        if (!resp) {
            dispatch(
                showToast({
                    variant: 'error',
                    description: 'Could not update the document size limits. Please try again.',
                })
            );
            return;
        }
        setRows(resp.documents);
        setTotals(resp.totals);
        setEdited({});
        setEditedTotals({});
        dispatch(showToast({ variant: 'success', description: 'Document size limits updated.' }));
    };

    return (
        <Flex vertical gap={20}>
            <Flex align="center" gap={12}>
                <div className="flex size-10 items-center justify-center rounded-xl bg-bgIconCard">
                    <FileProtectOutlined className="text-xl text-brandColor" />
                </div>
                <Flex vertical gap={2}>
                    <Typography.Title level={4} className="!mb-0">
                        Document Size Limits
                    </Typography.Title>
                    <Typography.Text className="text-sm text-textBody">
                        The largest file a corporate may upload for each KYB document. Between{' '}
                        {sizeLabel(bounds.minSizeKb)} and {sizeLabel(bounds.maxSizeKb)}.
                    </Typography.Text>
                </Flex>
            </Flex>

            <div className="rounded-2xl border border-borderCard bg-white p-4 sm:p-6">
                {isLoading && (
                    <Flex justify="center" className="py-10">
                        <Spin />
                    </Flex>
                )}

                {!isLoading && (
                    <Flex vertical>
                        {rows.map(row => {
                            const value = valueFor(row);
                            const isChanged = value !== row.maxSizeKb;
                            return (
                                <Flex
                                    key={row.documentName}
                                    justify="space-between"
                                    align="center"
                                    gap={12}
                                    wrap="wrap"
                                    className="border-b border-borderCard py-3 last:border-b-0"
                                >
                                    <Flex vertical gap={2} className="min-w-0 flex-1">
                                        <Typography.Text className="text-sm font-medium text-textHeadings">
                                            {row.label}
                                        </Typography.Text>
                                        <Typography.Text className="text-xs text-textGreyLight">
                                            Default {sizeLabel(row.defaultMaxSizeKb)}
                                        </Typography.Text>
                                    </Flex>
                                    <Flex align="center" gap={8}>
                                        <InputNumber
                                            value={value}
                                            min={bounds.minSizeKb}
                                            max={bounds.maxSizeKb}
                                            step={100}
                                            precision={0}
                                            addonAfter="KB"
                                            status={
                                                isChanged &&
                                                (value < bounds.minSizeKb ||
                                                    value > bounds.maxSizeKb)
                                                    ? 'error'
                                                    : ''
                                            }
                                            onChange={next =>
                                                setEdited(prev => ({
                                                    ...prev,
                                                    [row.documentName]: Number(next),
                                                }))
                                            }
                                        />
                                        <Button
                                            type="text"
                                            icon={<UndoOutlined />}
                                            disabled={value === row.defaultMaxSizeKb}
                                            title="Reset to default"
                                            onClick={() =>
                                                setEdited(prev => ({
                                                    ...prev,
                                                    [row.documentName]: row.defaultMaxSizeKb,
                                                }))
                                            }
                                        />
                                    </Flex>
                                </Flex>
                            );
                        })}
                    </Flex>
                )}
            </div>

            {!isLoading && totals && (
                <div className="rounded-2xl border border-borderCard bg-white p-4 sm:p-6">
                    <Flex vertical gap={2} className="mb-3">
                        <Typography.Text strong className="text-base text-textHeadings">
                            Totals
                        </Typography.Text>
                        <Typography.Text className="text-xs text-textGreyLight">
                            Between {sizeLabel(bounds.minTotalKb)} and{' '}
                            {sizeLabel(bounds.maxTotalKb)}.
                        </Typography.Text>
                    </Flex>
                    <Flex vertical>
                        {TOTAL_FIELDS.map(field => (
                            <Flex
                                key={field.key}
                                justify="space-between"
                                align="center"
                                gap={12}
                                wrap="wrap"
                                className="border-b border-borderCard py-3 last:border-b-0"
                            >
                                <Flex vertical gap={2} className="min-w-0 flex-1">
                                    <Typography.Text className="text-sm font-medium text-textHeadings">
                                        {field.label}
                                    </Typography.Text>
                                    <Typography.Text className="text-xs text-textGreyLight">
                                        {field.helper} Default{' '}
                                        {sizeLabel(totals.defaults[field.key])}
                                    </Typography.Text>
                                </Flex>
                                <InputNumber
                                    value={totalValueFor(field.key)}
                                    min={bounds.minTotalKb}
                                    max={bounds.maxTotalKb}
                                    step={1024}
                                    precision={0}
                                    addonAfter="KB"
                                    onChange={next =>
                                        setEditedTotals(prev => ({
                                            ...prev,
                                            [field.key]: Number(next),
                                        }))
                                    }
                                />
                            </Flex>
                        ))}
                    </Flex>
                    {packTooSmall && (
                        <Typography.Text className="mt-3 block text-xs text-errorTextRed">
                            The vendor pack must be at least as large as the upload total — it also
                            carries the signed agreement.
                        </Typography.Text>
                    )}
                </div>
            )}

            <Flex justify="end" gap={12}>
                <Button
                    onClick={load}
                    disabled={isSaving || (!changed.length && !changedTotals.length)}
                >
                    Discard
                </Button>
                <Button
                    type="primary"
                    loading={isSaving}
                    disabled={
                        (!changed.length && !changedTotals.length) ||
                        isOutOfRange ||
                        totalsOutOfRange ||
                        packTooSmall
                    }
                    onClick={handleSave}
                >
                    Save {changed.length + changedTotals.length || ''}
                </Button>
            </Flex>
        </Flex>
    );
};

export default CorporateCardDocumentLimits;
