import React, { useEffect, useMemo, useState } from 'react';

import {
    CheckCircleFilled,
    CloseCircleFilled,
    ExclamationCircleOutlined,
    LinkOutlined,
    SwapOutlined,
} from '@ant-design/icons';
import {
    Badge,
    Button,
    Card,
    Checkbox,
    Col,
    Empty,
    Flex,
    Progress,
    Row,
    Select,
    Space,
    Table,
    Tag,
    Typography,
} from 'antd';

import { useAppDispatch } from '@src/hooks/store';
import { showToast } from '@src/slices/apiSlice';
import { formatNumberWithLocalString, formatNumberWithoutCommas } from '@utils/priceFormat';

import { MappingRow } from './helpers';
import useCopyCashback from '../../hooks/useCopyCashback';
import { CopyCashback, CopyComparePayload } from '../../types/cashbackCopy';

type Props = {
    compareData: CopyComparePayload;
    setCompareData: (data: CopyComparePayload) => void;
    mappings: MappingRow[];
    fromPartnerLabel: string;
    toPartnerLabel: string;
    onSaved?: () => void;
};

const CashbackSyncSection = ({
    compareData,
    setCompareData,
    mappings,
    fromPartnerLabel,
    toPartnerLabel,
    onSaved,
}: Props) => {
    const dispatch = useAppDispatch();
    const { addCashbacksToPackage } = useCopyCashback();

    const [activeIdx, setActiveIdx] = useState(0);
    const [selectedMissingIds, setSelectedMissingIds] = useState<number[]>([]);
    const [savedPairs, setSavedPairs] = useState<Set<number>>(new Set());
    const [submitting, setSubmitting] = useState(false);

    const mappedPairs = useMemo(() => mappings.filter(m => m.toId != null), [mappings]);

    const fromPackagesById = useMemo(
        () => new Map(compareData.from.packages.map(p => [p.id, p])),
        [compareData]
    );
    const toPackagesById = useMemo(
        () => new Map(compareData.to.packages.map(p => [p.id, p])),
        [compareData]
    );

    useEffect(() => {
        setSelectedMissingIds([]);
    }, [activeIdx]);

    const activePair = mappedPairs[activeIdx];
    const activeFromPkg = activePair ? fromPackagesById.get(activePair.fromId) : undefined;
    const activeToPkg = activePair?.toId ? toPackagesById.get(activePair.toId) : undefined;

    const sourceCashbacks = useMemo(() => {
        if (!activePair) return [];
        return compareData.from.cashbacks.filter(cb => cb.packageId === activePair.fromId);
    }, [compareData, activePair]);

    const targetOperatorIds = useMemo(() => {
        if (!activePair || activePair.toId == null) return new Set<number>();
        return new Set(
            compareData.to.cashbacks
                .filter(cb => cb.packageId === activePair.toId)
                .map(cb => cb.serviceOperatorId)
        );
    }, [compareData, activePair]);

    const missingCashbacks = useMemo(
        () => sourceCashbacks.filter(cb => !targetOperatorIds.has(cb.serviceOperatorId)),
        [sourceCashbacks, targetOperatorIds]
    );

    const matchedCount = sourceCashbacks.length - missingCashbacks.length;

    if (mappedPairs.length === 0) {
        return (
            <Card>
                <Empty description="No mapped packages yet. Go back and map at least one." />
            </Card>
        );
    }

    const pairOptions = mappedPairs.map((m, idx) => {
        const from = fromPackagesById.get(m.fromId);
        const to = m.toId != null ? toPackagesById.get(m.toId) : undefined;
        return {
            value: idx,
            label: `${from?.packageName ?? '?'}  →  ${to?.packageName ?? '?'}${
                savedPairs.has(m.fromId) ? '   ✓' : ''
            }`,
        };
    });

    const columns = [
        {
            title: (
                <Checkbox
                    checked={
                        missingCashbacks.length > 0 &&
                        selectedMissingIds.length === missingCashbacks.length
                    }
                    indeterminate={
                        selectedMissingIds.length > 0 &&
                        selectedMissingIds.length < missingCashbacks.length
                    }
                    onChange={e =>
                        setSelectedMissingIds(
                            e.target.checked ? missingCashbacks.map(cb => cb.id) : []
                        )
                    }
                />
            ),
            key: 'select',
            width: 50,
            render: (_: any, cb: CopyCashback) => {
                const isMissing = !targetOperatorIds.has(cb.serviceOperatorId);
                if (!isMissing) return null;
                return (
                    <Checkbox
                        checked={selectedMissingIds.includes(cb.id)}
                        onChange={e =>
                            setSelectedMissingIds(prev =>
                                e.target.checked
                                    ? [...prev, cb.id]
                                    : prev.filter(id => id !== cb.id)
                            )
                        }
                    />
                );
            },
        },
        {
            title: 'Service Operator',
            key: 'op',
            render: (_: any, cb: CopyCashback) => (
                <Space direction="vertical" size={0}>
                    <Typography.Text>{cb.serviceOperator?.serviceProvider}</Typography.Text>
                    <Typography.Text type="secondary" className="text-xs">
                        ID: {cb.serviceOperator?.id}
                    </Typography.Text>
                </Space>
            ),
        },
        {
            title: 'Cashback',
            key: 'cashback',
            render: (_: any, cb: CopyCashback) => (
                <Typography.Text>
                    {cb.cashbackType === 'PERCENTAGE'
                        ? `${formatNumberWithoutCommas(cb.cashback)} %`
                        : `₹ ${formatNumberWithLocalString(cb.cashback) ?? '0.00'}`}
                </Typography.Text>
            ),
        },
        {
            title: 'Surcharge',
            key: 'surcharge',
            render: (_: any, cb: CopyCashback) => (
                <Typography.Text>
                    {cb.surchargeType === 'PERCENTAGE'
                        ? `${formatNumberWithoutCommas(cb.surcharge)} %`
                        : `₹ ${formatNumberWithLocalString(cb.surcharge) ?? '0.00'}`}
                </Typography.Text>
            ),
        },
        {
            title: 'Status on target',
            key: 'onTarget',
            render: (_: any, cb: CopyCashback) => {
                const isMissing = !targetOperatorIds.has(cb.serviceOperatorId);
                return isMissing ? (
                    <Tag icon={<CloseCircleFilled />} color="orange">
                        Missing
                    </Tag>
                ) : (
                    <Tag icon={<CheckCircleFilled />} color="green">
                        Matched
                    </Tag>
                );
            },
        },
    ];

    const progressPct =
        mappedPairs.length === 0 ? 0 : Math.round((savedPairs.size / mappedPairs.length) * 100);

    const handleAddSelected = async () => {
        if (!activePair || activePair.toId == null) return;
        if (selectedMissingIds.length === 0) {
            dispatch(showToast({ description: 'Select at least one cashback', variant: 'error' }));
            return;
        }
        setSubmitting(true);
        const res = await addCashbacksToPackage({
            toPackageId: activePair.toId,
            sourceCashbackIds: selectedMissingIds,
        });
        setSubmitting(false);
        if (res && (res as any).status === true) {
            const result: any = (res as any).data;
            if (result?.created?.length) {
                setCompareData({
                    ...compareData,
                    to: {
                        ...compareData.to,
                        cashbacks: [...compareData.to.cashbacks, ...result.created],
                    },
                });
            }
            setSavedPairs(prev => new Set(prev).add(activePair.fromId));
            setSelectedMissingIds([]);
            dispatch(
                showToast({
                    description: `${result?.createdCount ?? 0} cashback added successfully.${
                        result?.skippedDuplicates?.length
                            ? ` ${result.skippedDuplicates.length} duplicate(s) skipped.`
                            : ''
                    }`,
                    variant: 'success',
                })
            );
            onSaved?.();
        } else if (res && (res as any).status === false) {
            dispatch(
                showToast({ description: (res as any).message ?? 'Failed', variant: 'error' })
            );
        }
    };

    return (
        <Card>
            <Flex justify="space-between" align="center" className="mb-3">
                <div>
                    <Typography.Text type="secondary" className="text-xs uppercase tracking-wide">
                        Step 3 · Sync cashbacks per pair
                    </Typography.Text>
                    <Typography.Title level={5} className="!m-0">
                        Pair {activeIdx + 1} of {mappedPairs.length}
                    </Typography.Title>
                    <Typography.Text className="text-xs text-gray-500">
                        <b>{fromPartnerLabel}</b> <SwapOutlined className="mx-1 text-brandColor" />{' '}
                        <b>{toPartnerLabel}</b>
                    </Typography.Text>
                </div>
                <Space direction="vertical" align="end" size={2}>
                    <Typography.Text type="secondary" className="text-xs">
                        {savedPairs.size} / {mappedPairs.length} saved
                    </Typography.Text>
                    <Progress
                        percent={progressPct}
                        showInfo={false}
                        size="small"
                        style={{ width: 180 }}
                    />
                </Space>
            </Flex>

            <Select
                className="w-full mb-3"
                value={activeIdx}
                options={pairOptions}
                onChange={value => setActiveIdx(value)}
                showSearch
                filterOption={(input, option) =>
                    (option?.label ?? '').toString().toLowerCase().includes(input.toLowerCase())
                }
            />

            {activePair && activeFromPkg && activeToPkg && (
                <>
                    <Row gutter={16} className="mb-3">
                        <Col span={11}>
                            <Card size="small" className="!bg-gray-50">
                                <Typography.Text type="secondary" className="text-xs uppercase">
                                    From · {fromPartnerLabel}
                                </Typography.Text>
                                <Flex align="center" justify="space-between">
                                    <Typography.Title level={5} className="!m-0">
                                        {activeFromPkg.packageName}
                                    </Typography.Title>
                                    <Badge
                                        count={sourceCashbacks.length}
                                        showZero
                                        style={{ backgroundColor: '#1677ff' }}
                                    />
                                </Flex>
                            </Card>
                        </Col>
                        <Col span={2} className="flex items-center justify-center text-brandColor">
                            <LinkOutlined style={{ fontSize: 20 }} />
                        </Col>
                        <Col span={11}>
                            <Card size="small" className="!bg-gray-50">
                                <Typography.Text type="secondary" className="text-xs uppercase">
                                    To · {toPartnerLabel}
                                </Typography.Text>
                                <Flex align="center" justify="space-between">
                                    <Typography.Title level={5} className="!m-0">
                                        {activeToPkg.packageName}
                                    </Typography.Title>
                                    <Badge
                                        count={matchedCount}
                                        showZero
                                        style={{ backgroundColor: '#52c41a' }}
                                    />
                                </Flex>
                            </Card>
                        </Col>
                    </Row>

                    <Flex gap={16} className="mb-3">
                        <Tag icon={<CheckCircleFilled />} color="green">
                            Matched: {matchedCount}
                        </Tag>
                        <Tag icon={<ExclamationCircleOutlined />} color="orange">
                            Missing: {missingCashbacks.length}
                        </Tag>
                        {savedPairs.has(activePair.fromId) && <Tag color="blue">Saved</Tag>}
                    </Flex>

                    <Table
                        size="small"
                        rowKey="id"
                        columns={columns}
                        dataSource={sourceCashbacks}
                        pagination={false}
                        scroll={{ y: 300 }}
                        locale={{
                            emptyText: <Empty description="No cashbacks on the source package" />,
                        }}
                        rowClassName={cb =>
                            targetOperatorIds.has(cb.serviceOperatorId) ? '' : '!bg-yellow-50'
                        }
                    />

                    <Flex justify="space-between" align="center" className="mt-3">
                        <Space>
                            <Button
                                onClick={() => setActiveIdx(idx => Math.max(idx - 1, 0))}
                                disabled={activeIdx === 0}
                            >
                                Previous
                            </Button>
                            <Button
                                onClick={() =>
                                    setActiveIdx(idx => Math.min(idx + 1, mappedPairs.length - 1))
                                }
                                disabled={activeIdx >= mappedPairs.length - 1}
                            >
                                Next Package
                            </Button>
                        </Space>
                        <Space>
                            <Typography.Text type="secondary" className="text-xs">
                                {selectedMissingIds.length} selected
                            </Typography.Text>
                            <Button
                                type="primary"
                                danger
                                loading={submitting}
                                disabled={selectedMissingIds.length === 0}
                                onClick={handleAddSelected}
                            >
                                Add Selected Cashbacks
                            </Button>
                        </Space>
                    </Flex>
                </>
            )}
        </Card>
    );
};

export default CashbackSyncSection;
