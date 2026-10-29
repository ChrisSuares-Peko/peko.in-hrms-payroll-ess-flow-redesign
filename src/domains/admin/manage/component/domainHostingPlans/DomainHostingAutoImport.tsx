import React, { useCallback, useEffect, useMemo, useState } from 'react';

import {
    CheckCircleOutlined,
    CloseCircleOutlined,
    ExclamationCircleOutlined,
    LoadingOutlined,
    ReloadOutlined,
    WarningOutlined,
} from '@ant-design/icons';
import {
    Alert,
    Button,
    Checkbox,
    Collapse,
    Flex,
    Input,
    Modal,
    Progress,
    Result,
    Select,
    Statistic,
    Steps,
    Table,
    Tag,
    Typography,
} from 'antd';
import { useDispatch } from 'react-redux';

import { showToast } from '@src/slices/apiSlice';

import useAutoImportDomainHostingPlans from '../../hooks/domainHostingPlans/useAutoImportDomainHostingPlans';
import {
    PLAN_TYPE_COLORS,
    PLAN_TYPE_LABELS,
    PLAN_TYPE_OPTIONS,
    PLAN_TYPES,
    type PlanType,
} from '../../types/domainHostingPlan';

function isKnownPlanType(type: string): type is PlanType {
    return (PLAN_TYPES as readonly string[]).includes(type);
}

function planTypeDisplayLabel(type: string): string {
    return isKnownPlanType(type) ? PLAN_TYPE_LABELS[type] : type;
}

function planTypeDisplayColor(type: string): string {
    return isKnownPlanType(type) ? PLAN_TYPE_COLORS[type] : 'default';
}

const { Text, Title } = Typography;
const { Search } = Input;

interface Props {
    open: boolean;
    onClose: () => void;
    setRefresh: React.Dispatch<React.SetStateAction<boolean>>;
}

type PlanRow = {
    planId: string;
    planName: string;
    productId: string;
    planType: string | null;
    status: string;
    description: string | null;
};

const rowKey = (p: PlanRow) => `${p.productId}_${p.planId}`;

const PlanTypeTag = ({ type }: { type: string | null }) =>
    type ? (
        <Tag color={planTypeDisplayColor(type)}>{planTypeDisplayLabel(type)}</Tag>
    ) : (
        <Tag color="warning" icon={<WarningOutlined />}>
            Unassigned
        </Tag>
    );

const DomainHostingAutoImport = ({ open, onClose, setRefresh }: Props) => {
    const dispatch = useDispatch();
    const {
        loadingKeys,
        keysError,
        loadingPlans,
        keyFetchStates,
        importing,
        getProductKeys,
        fetchAllPlans,
        importPlans,
    } = useAutoImportDomainHostingPlans();

    const [step, setStep] = useState(0);
    const [productKeys, setProductKeys] = useState<any[]>([]);
    const [selectedKeys, setSelectedKeys] = useState<string[]>([]);
    const [keyTypeOverrides, setKeyTypeOverrides] = useState<Record<string, string>>({});
    const [fetchProgress, setFetchProgress] = useState(0);
    const [fetchedPlans, setFetchedPlans] = useState<PlanRow[]>([]);
    const [planTypeEdits, setPlanTypeEdits] = useState<Record<string, string>>({});
    const [selectedPlanIds, setSelectedPlanIds] = useState<string[]>([]);
    const [planSearch, setPlanSearch] = useState('');
    const [planTypeFilter, setPlanTypeFilter] = useState<string | null>(null);
    const [importResult, setImportResult] = useState<any>(null);

    const reset = useCallback(() => {
        setStep(0);
        setProductKeys([]);
        setSelectedKeys([]);
        setKeyTypeOverrides({});
        setFetchProgress(0);
        setFetchedPlans([]);
        setPlanTypeEdits({});
        setSelectedPlanIds([]);
        setPlanSearch('');
        setPlanTypeFilter(null);
        setImportResult(null);
    }, []);

    const loadKeys = useCallback(async () => {
        const data = await getProductKeys();
        if (data && Array.isArray(data)) {
            setProductKeys(data);
            setSelectedKeys(data.map((k: any) => k.productKey));
        }
    }, [getProductKeys]);

    useEffect(() => {
        if (open) {
            reset();
            loadKeys();
        }
    }, [open, reset, loadKeys]);

    // Group product keys by planType
    const groupedKeys = useMemo(
        () =>
            productKeys.reduce<Record<string, any[]>>((acc, k) => {
                const type = k.planType || '__unknown__';
                if (!acc[type]) acc[type] = [];
                acc[type].push(k);
                return acc;
            }, {}),
        [productKeys]
    );

    const handleFetchPlans = async () => {
        if (selectedKeys.length === 0) {
            dispatch(
                showToast({
                    description: 'Please select at least one product key',
                    variant: 'error',
                })
            );
            return;
        }
        setFetchedPlans([]);
        setPlanTypeEdits({});
        setSelectedPlanIds([]);
        setFetchProgress(0);
        setStep(1);

        const plans = await fetchAllPlans(selectedKeys, keyTypeOverrides, setFetchProgress);
        setFetchedPlans(plans);
        setSelectedPlanIds(plans.map(rowKey));
    };

    // Effective plans — merge inline type edits
    const effectivePlans = useMemo(
        () => fetchedPlans.map(p => ({ ...p, planType: planTypeEdits[rowKey(p)] ?? p.planType })),
        [fetchedPlans, planTypeEdits]
    );

    const filteredPlans = useMemo(() => {
        let plans = effectivePlans;
        if (planTypeFilter) plans = plans.filter(p => p.planType === planTypeFilter);
        if (planSearch) {
            const q = planSearch.toLowerCase();
            plans = plans.filter(
                p => p.planName.toLowerCase().includes(q) || p.planId.toLowerCase().includes(q)
            );
        }
        return plans;
    }, [effectivePlans, planTypeFilter, planSearch]);

    const selectedPlans = useMemo(
        () => effectivePlans.filter(p => selectedPlanIds.includes(rowKey(p))),
        [effectivePlans, selectedPlanIds]
    );

    const unassignedSelected = selectedPlans.filter(p => !p.planType);

    const handleImport = async () => {
        if (selectedPlans.length === 0) {
            dispatch(
                showToast({
                    description: 'Please select at least one plan to import',
                    variant: 'error',
                })
            );
            return;
        }
        if (unassignedSelected.length > 0) {
            dispatch(
                showToast({
                    description: `Assign a type to all selected plans before importing`,
                    variant: 'error',
                })
            );
            return;
        }
        const result: any = await importPlans(selectedPlans);
        if (result && result.status) {
            setImportResult(result.data);
            setStep(2);
            if ((result.data?.imported?.length ?? 0) > 0) setRefresh(prev => !prev);
        } else {
            dispatch(
                showToast({ description: 'Import failed. Please try again.', variant: 'error' })
            );
        }
    };

    // ─── Step 0: Select Product Keys ───────────────────────────────────────────

    const renderKeyGroup = (type: string, keys: any[]) => {
        const isUnknownGroup = type === '__unknown__';
        const groupLabel = isUnknownGroup ? 'Unknown / Unrecognised' : planTypeDisplayLabel(type);
        const groupColor = isUnknownGroup ? 'default' : planTypeDisplayColor(type);
        const allSelected = keys.every(k => selectedKeys.includes(k.productKey));
        const someSelected = keys.some(k => selectedKeys.includes(k.productKey));

        return (
            <div key={type} style={{ marginBottom: 16 }}>
                <Flex align="center" gap={8} style={{ marginBottom: 6 }}>
                    <Checkbox
                        checked={allSelected}
                        indeterminate={!allSelected && someSelected}
                        onChange={e => {
                            const keyList = keys.map(k => k.productKey);
                            if (e.target.checked) {
                                setSelectedKeys(prev => [...new Set([...prev, ...keyList])]);
                            } else {
                                setSelectedKeys(prev => prev.filter(x => !keyList.includes(x)));
                            }
                        }}
                    />
                    <Tag color={groupColor} style={{ margin: 0 }}>
                        {groupLabel}
                    </Tag>
                    <Text type="secondary" style={{ fontSize: 12 }}>
                        {keys.length} key{keys.length > 1 ? 's' : ''}
                    </Text>
                </Flex>
                <div style={{ paddingLeft: 24, display: 'flex', flexDirection: 'column', gap: 6 }}>
                    {keys.map(k => (
                        <Flex key={k.productKey} align="center" gap={10}>
                            <Checkbox
                                checked={selectedKeys.includes(k.productKey)}
                                onChange={e => {
                                    if (e.target.checked) {
                                        setSelectedKeys(prev => [...prev, k.productKey]);
                                    } else {
                                        setSelectedKeys(prev =>
                                            prev.filter(x => x !== k.productKey)
                                        );
                                    }
                                }}
                            >
                                <Text code style={{ fontSize: 12 }}>
                                    {k.productKey}
                                </Text>
                            </Checkbox>
                            {isUnknownGroup && (
                                <Select
                                    size="small"
                                    style={{ width: 150 }}
                                    placeholder="Assign type"
                                    value={keyTypeOverrides[k.productKey] || undefined}
                                    options={PLAN_TYPE_OPTIONS}
                                    onChange={val =>
                                        setKeyTypeOverrides(prev => ({
                                            ...prev,
                                            [k.productKey]: val,
                                        }))
                                    }
                                />
                            )}
                        </Flex>
                    ))}
                </div>
            </div>
        );
    };

    const renderStep0 = () => {
        let step0Content: React.ReactNode;
        if (keysError) {
            step0Content = (
                <Result
                    status="error"
                    title="Failed to fetch product keys"
                    subTitle="Could not reach the vendor API. Check credentials and try again."
                    extra={
                        <Button icon={<ReloadOutlined />} onClick={loadKeys}>
                            Retry
                        </Button>
                    }
                />
            );
        } else if (loadingKeys) {
            step0Content = (
                <Flex justify="center" align="center" style={{ minHeight: 200 }}>
                    <Flex vertical align="center" gap={12}>
                        <LoadingOutlined style={{ fontSize: 28 }} />
                        <Text type="secondary">Loading product keys from vendor…</Text>
                    </Flex>
                </Flex>
            );
        } else {
            step0Content = (
                <>
                    <Flex justify="space-between" align="center">
                        <Text type="secondary">
                            <Text strong>{selectedKeys.length}</Text> of {productKeys.length}{' '}
                            product keys selected
                        </Text>
                        <Flex gap={8}>
                            <Button
                                size="small"
                                onClick={() => setSelectedKeys(productKeys.map(k => k.productKey))}
                            >
                                Select All
                            </Button>
                            <Button size="small" onClick={() => setSelectedKeys([])}>
                                Clear
                            </Button>
                        </Flex>
                    </Flex>

                    {groupedKeys.__unknown__ && (
                        <Alert
                            type="warning"
                            showIcon
                            message="Some product keys are not recognised. You can assign a plan type manually before fetching plans."
                            style={{ padding: '6px 12px' }}
                        />
                    )}

                    <div style={{ maxHeight: 380, overflowY: 'auto', paddingRight: 4 }}>
                        {Object.entries(groupedKeys)
                            .sort(([a]) => (a === '__unknown__' ? 1 : -1))
                            .map(([type, keys]) => renderKeyGroup(type, keys))}
                    </div>

                    <Flex
                        justify="flex-end"
                        gap={8}
                        style={{ paddingTop: 4, borderTop: '1px solid #f0f0f0' }}
                    >
                        <Button onClick={onClose}>Cancel</Button>
                        <Button
                            type="primary"
                            disabled={selectedKeys.length === 0}
                            onClick={handleFetchPlans}
                        >
                            Fetch Plans ({selectedKeys.length} selected)
                        </Button>
                    </Flex>
                </>
            );
        }
        return (
            <Flex vertical gap={16}>
                {step0Content}
            </Flex>
        );
    };

    // ─── Step 1: Review Plans ───────────────────────────────────────────────────

    const fetchingKey = keyFetchStates.find(s => s.status === 'loading')?.key;
    const doneCount = keyFetchStates.filter(
        s => s.status === 'done' || s.status === 'error'
    ).length;

    const planTableColumns = [
        {
            title: 'Plan Name',
            dataIndex: 'planName',
            key: 'planName',
            ellipsis: true,
            render: (v: string) => <Text>{v}</Text>,
        },
        {
            title: 'Plan ID',
            dataIndex: 'planId',
            key: 'planId',
            width: 90,
            render: (v: string) => (
                <Text code style={{ fontSize: 11 }}>
                    {v}
                </Text>
            ),
        },
        {
            title: 'Product Key',
            dataIndex: 'productId',
            key: 'productId',
            ellipsis: true,
            render: (v: string) => (
                <Text code style={{ fontSize: 11 }}>
                    {v}
                </Text>
            ),
        },
        {
            title: 'Type',
            dataIndex: 'planType',
            key: 'planType',
            width: 160,
            render: (v: string | null, record: PlanRow) => {
                const key = rowKey(record);
                const current = planTypeEdits[key] ?? v;
                if (current) return <PlanTypeTag type={current} />;
                return (
                    <Select
                        size="small"
                        style={{ width: 140 }}
                        placeholder="Assign type"
                        value={planTypeEdits[key] || undefined}
                        options={PLAN_TYPE_OPTIONS}
                        onChange={val => setPlanTypeEdits(prev => ({ ...prev, [key]: val }))}
                    />
                );
            },
        },
        {
            title: 'Status',
            dataIndex: 'status',
            key: 'status',
            width: 80,
            render: (v: string) => <Tag color={v === 'Active' ? 'success' : 'default'}>{v}</Tag>,
        },
    ];

    const typeFilterOptions = [
        { label: 'All Types', value: '' },
        ...PLAN_TYPE_OPTIONS,
        { label: 'Unassigned', value: '__unassigned__' },
    ];

    const renderStep1 = () => (
        <Flex vertical gap={16}>
            {loadingPlans ? (
                <Flex vertical gap={20} style={{ minHeight: 240, paddingTop: 16 }}>
                    <Flex vertical gap={4}>
                        <Flex justify="space-between">
                            <Text>
                                {fetchingKey ? (
                                    <>
                                        Fetching{' '}
                                        <Text code style={{ fontSize: 12 }}>
                                            {fetchingKey}
                                        </Text>
                                        …
                                    </>
                                ) : (
                                    'Starting…'
                                )}
                            </Text>
                            <Text type="secondary">
                                {doneCount} / {selectedKeys.length}
                            </Text>
                        </Flex>
                        <Progress percent={fetchProgress} strokeColor="#1677ff" />
                    </Flex>
                    <div
                        style={{
                            maxHeight: 260,
                            overflowY: 'auto',
                            display: 'flex',
                            flexDirection: 'column',
                            gap: 4,
                        }}
                    >
                        {keyFetchStates.map(s => (
                            <Flex key={s.key} align="center" gap={8}>
                                {s.status === 'loading' && (
                                    <LoadingOutlined style={{ color: '#1677ff', fontSize: 13 }} />
                                )}
                                {s.status === 'done' && (
                                    <CheckCircleOutlined
                                        style={{ color: '#52c41a', fontSize: 13 }}
                                    />
                                )}
                                {s.status === 'error' && (
                                    <CloseCircleOutlined
                                        style={{ color: '#ff4d4f', fontSize: 13 }}
                                    />
                                )}
                                {s.status === 'pending' && (
                                    <span style={{ width: 13, display: 'inline-block' }} />
                                )}
                                <Text code style={{ fontSize: 11 }}>
                                    {s.key}
                                </Text>
                                {s.status === 'error' && (
                                    <Text type="danger" style={{ fontSize: 11 }}>
                                        failed
                                    </Text>
                                )}
                            </Flex>
                        ))}
                    </div>
                </Flex>
            ) : (
                <>
                    {unassignedSelected.length > 0 && (
                        <Alert
                            type="warning"
                            showIcon
                            message={`${unassignedSelected.length} selected plan${unassignedSelected.length > 1 ? 's have' : ' has'} no type assigned — assign before importing.`}
                        />
                    )}
                    {keyFetchStates.some(s => s.status === 'error') && (
                        <Alert
                            type="error"
                            showIcon
                            message={`Failed to fetch plans for: ${keyFetchStates
                                .filter(s => s.status === 'error')
                                .map(s => s.key)
                                .join(', ')}`}
                        />
                    )}

                    <Flex justify="space-between" align="center" wrap="wrap" gap={8}>
                        <Flex gap={8} align="center">
                            <Search
                                placeholder="Search plan name or ID"
                                allowClear
                                style={{ width: 220 }}
                                onSearch={setPlanSearch}
                                onChange={e => !e.target.value && setPlanSearch('')}
                            />
                            <Select
                                style={{ width: 150 }}
                                value={planTypeFilter || ''}
                                options={typeFilterOptions}
                                onChange={v => setPlanTypeFilter(v || null)}
                            />
                        </Flex>
                        <Flex gap={8} align="center">
                            <Text type="secondary" style={{ fontSize: 12 }}>
                                {selectedPlanIds.length} selected / {effectivePlans.length} total
                            </Text>
                            <Button
                                size="small"
                                onClick={() => setSelectedPlanIds(effectivePlans.map(rowKey))}
                            >
                                Select All
                            </Button>
                            <Button size="small" onClick={() => setSelectedPlanIds([])}>
                                Clear
                            </Button>
                        </Flex>
                    </Flex>

                    <Table
                        rowKey={r => rowKey(r as PlanRow)}
                        columns={planTableColumns}
                        dataSource={filteredPlans as any[]}
                        size="small"
                        scroll={{ y: 300 }}
                        pagination={false}
                        rowSelection={{
                            selectedRowKeys: selectedPlanIds,
                            onChange: keys => setSelectedPlanIds(keys as string[]),
                        }}
                        locale={{ emptyText: 'No plans found' }}
                    />

                    <Flex
                        justify="space-between"
                        align="center"
                        style={{ paddingTop: 4, borderTop: '1px solid #f0f0f0' }}
                    >
                        <Button onClick={() => setStep(0)}>← Back</Button>
                        <Button
                            type="primary"
                            loading={importing}
                            disabled={selectedPlanIds.length === 0 || unassignedSelected.length > 0}
                            onClick={handleImport}
                        >
                            Import {selectedPlanIds.length > 0 ? `(${selectedPlanIds.length})` : ''}
                        </Button>
                    </Flex>
                </>
            )}
        </Flex>
    );

    // ─── Step 2: Import Result ──────────────────────────────────────────────────

    const renderPlanList = (plans: any[]) => (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 4, paddingTop: 4 }}>
            {plans.map((p: any) => (
                <Flex key={`${p.productId}_${p.planId}`} align="center" gap={8}>
                    <PlanTypeTag type={p.planType} />
                    <Text style={{ fontSize: 13 }}>{p.planName}</Text>
                    <Text code style={{ fontSize: 11 }}>
                        {p.planId}
                    </Text>
                </Flex>
            ))}
        </div>
    );

    const renderStep2 = () => {
        const importedCount = importResult?.imported?.length ?? 0;
        const existsCount = importResult?.alreadyExists?.length ?? 0;
        const failedCount = importResult?.failed?.length ?? 0;
        const hasFailures = failedCount > 0;

        let resultIcon: React.ReactNode;
        if (importedCount > 0) {
            resultIcon = <CheckCircleOutlined style={{ color: '#52c41a' }} />;
        } else if (hasFailures && importedCount === 0) {
            resultIcon = <CloseCircleOutlined style={{ color: '#ff4d4f' }} />;
        } else {
            resultIcon = <ExclamationCircleOutlined style={{ color: '#faad14' }} />;
        }

        let resultTitle: string;
        if (importedCount > 0) {
            resultTitle = 'Import Complete';
        } else if (hasFailures) {
            resultTitle = 'Import Failed';
        } else {
            resultTitle = 'Nothing New to Import';
        }

        return (
            <Flex vertical gap={20}>
                <Result
                    icon={resultIcon}
                    title={resultTitle}
                    style={{ paddingTop: 8, paddingBottom: 0 }}
                />

                <Flex justify="center" gap={40}>
                    <Statistic
                        title="Imported"
                        value={importedCount}
                        valueStyle={{ color: '#52c41a' }}
                        prefix={<CheckCircleOutlined />}
                    />
                    <Statistic
                        title="Already Existed"
                        value={existsCount}
                        valueStyle={{ color: '#faad14' }}
                        prefix={<ExclamationCircleOutlined />}
                    />
                    {hasFailures && (
                        <Statistic
                            title="Failed"
                            value={failedCount}
                            valueStyle={{ color: '#ff4d4f' }}
                            prefix={<CloseCircleOutlined />}
                        />
                    )}
                </Flex>

                {(existsCount > 0 || hasFailures) && (
                    <Collapse
                        size="small"
                        items={[
                            ...(existsCount > 0
                                ? [
                                      {
                                          key: 'exists',
                                          label: (
                                              <Flex gap={8} align="center">
                                                  <ExclamationCircleOutlined
                                                      style={{ color: '#faad14' }}
                                                  />
                                                  <Text>Already in database ({existsCount})</Text>
                                              </Flex>
                                          ),
                                          children: renderPlanList(importResult.alreadyExists),
                                      },
                                  ]
                                : []),
                            ...(hasFailures
                                ? [
                                      {
                                          key: 'failed',
                                          label: (
                                              <Flex gap={8} align="center">
                                                  <CloseCircleOutlined
                                                      style={{ color: '#ff4d4f' }}
                                                  />
                                                  <Text>Failed ({failedCount})</Text>
                                              </Flex>
                                          ),
                                          children: (
                                              <div
                                                  style={{
                                                      display: 'flex',
                                                      flexDirection: 'column',
                                                      gap: 4,
                                                      paddingTop: 4,
                                                  }}
                                              >
                                                  {importResult.failed.map((p: any) => (
                                                      <Flex
                                                          key={`${p.productId}_${p.planId}`}
                                                          align="center"
                                                          gap={8}
                                                          wrap="wrap"
                                                      >
                                                          <PlanTypeTag type={p.planType} />
                                                          <Text style={{ fontSize: 13 }}>
                                                              {p.planName || p.planId}
                                                          </Text>
                                                          <Text
                                                              type="danger"
                                                              style={{ fontSize: 12 }}
                                                          >
                                                              — {p.reason}
                                                          </Text>
                                                      </Flex>
                                                  ))}
                                              </div>
                                          ),
                                      },
                                  ]
                                : []),
                        ]}
                    />
                )}

                <Flex
                    justify="flex-end"
                    gap={8}
                    style={{ paddingTop: 4, borderTop: '1px solid #f0f0f0' }}
                >
                    <Button
                        onClick={() => {
                            reset();
                            loadKeys();
                        }}
                    >
                        Import More
                    </Button>
                    <Button type="primary" onClick={onClose}>
                        Done
                    </Button>
                </Flex>
            </Flex>
        );
    };

    // ─── Render ─────────────────────────────────────────────────────────────────

    return (
        <Modal
            open={open}
            onCancel={loadingPlans || importing ? undefined : onClose}
            closable={!loadingPlans && !importing}
            maskClosable={!loadingPlans && !importing}
            footer={null}
            width={900}
            title={
                <Flex align="center" gap={10}>
                    <Title level={5} style={{ margin: 0 }}>
                        Auto Import Plans from Vendor
                    </Title>
                </Flex>
            }
            destroyOnClose
        >
            <Flex vertical gap={24} style={{ paddingTop: 8 }}>
                <Steps
                    current={step}
                    size="small"
                    items={[
                        { title: 'Select Product Keys' },
                        { title: 'Review & Select Plans' },
                        { title: 'Import Result' },
                    ]}
                />
                <div>
                    {step === 0 && renderStep0()}
                    {step === 1 && renderStep1()}
                    {step === 2 && renderStep2()}
                </div>
            </Flex>
        </Modal>
    );
};

export default DomainHostingAutoImport;
