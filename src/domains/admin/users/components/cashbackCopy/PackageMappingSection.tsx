import React, { useMemo, useState } from 'react';

import { ArrowRightOutlined, PlusOutlined, SwapOutlined } from '@ant-design/icons';
import {
    Alert,
    Button,
    Card,
    Col,
    Divider,
    Empty,
    Flex,
    Row,
    Select,
    Space,
    Tag,
    Tooltip,
    Typography,
} from 'antd';

import CreatePackageModal from './CreatePackageModal';
import { MappingRow, autoMap } from './helpers';
import { CopyComparePayload, CopyPackage } from '../../types/cashbackCopy';

type Props = {
    compareData: CopyComparePayload;
    fromPartnerLabel: string;
    toPartnerLabel: string;
    toPartnerId: string | undefined;
    mappings: MappingRow[];
    setMappings: React.Dispatch<React.SetStateAction<MappingRow[]>>;
    onPackageCreated: (newPkg: CopyPackage, forFromId: number) => void;
};

const PackageMappingSection = ({
    compareData,
    fromPartnerLabel,
    toPartnerLabel,
    toPartnerId,
    mappings,
    setMappings,
    onPackageCreated,
}: Props) => {
    const [createForFromId, setCreateForFromId] = useState<number | null>(null);

    const fromPackagesById = useMemo(
        () => new Map(compareData.from.packages.map(p => [p.id, p])),
        [compareData]
    );

    const mappedPairs = useMemo(() => mappings.filter(m => m.toId != null), [mappings]);
    const usedToIds = useMemo(() => new Set(mappedPairs.map(m => m.toId as number)), [mappedPairs]);

    const setMappingFor = (fromId: number, toId: number | null) => {
        setMappings(prev =>
            prev.map(m => (m.fromId === fromId ? { ...m, toId, isAuto: false } : m))
        );
    };

    const mappedCount = mappedPairs.length;
    const totalFromCount = compareData.from.packages.length;

    const sourceForCreate =
        createForFromId != null ? fromPackagesById.get(createForFromId) : undefined;

    return (
        <Card className="!mb-4">
            <Flex justify="space-between" align="center" className="mb-3">
                <div>
                    <Typography.Text type="secondary" className="text-xs uppercase tracking-wide">
                        Step 2 · Map packages
                    </Typography.Text>
                    <Typography.Title level={5} className="!m-0">
                        {fromPartnerLabel} <SwapOutlined className="mx-2 text-brandColor" />{' '}
                        {toPartnerLabel}
                    </Typography.Title>
                </div>
                <Space>
                    <Tag color="blue">
                        {mappedCount} / {totalFromCount} mapped
                    </Tag>
                    <Button
                        size="small"
                        onClick={() =>
                            setMappings(autoMap(compareData.from.packages, compareData.to.packages))
                        }
                    >
                        Auto-map
                    </Button>
                    <Button
                        size="small"
                        onClick={() =>
                            setMappings(prev =>
                                prev.map(m => ({ ...m, toId: null, isAuto: false }))
                            )
                        }
                    >
                        Clear all
                    </Button>
                </Space>
            </Flex>

            <Alert
                className="mb-3"
                type="info"
                showIcon
                message={
                    <span>
                        Individual packages are matched automatically using their access code. Group
                        packages are suggested when the source name looks similar to a target
                        partner package name. If nothing matches, click <b>Create</b> to copy a
                        source package into the target partner.
                    </span>
                }
            />

            <Row gutter={[8, 8]}>
                <Col span={10}>
                    <Typography.Text strong>From package</Typography.Text>
                </Col>
                <Col span={2} />
                <Col span={12}>
                    <Typography.Text strong>Maps to (To partner)</Typography.Text>
                </Col>
            </Row>
            <Divider className="!my-2" />

            <div style={{ maxHeight: 380, overflowY: 'auto', paddingRight: 4 }}>
                {mappings.length === 0 && <Empty description="No packages on the source partner" />}
                {mappings.map(m => {
                    const fromPkg = fromPackagesById.get(m.fromId);
                    if (!fromPkg) return null;

                    const toOptions = compareData.to.packages
                        .filter(t =>
                            fromPkg.packageType === 'INDIVIDUAL'
                                ? t.packageType === 'INDIVIDUAL'
                                : t.packageType !== 'INDIVIDUAL'
                        )
                        .filter(t => !usedToIds.has(t.id) || t.id === m.toId)
                        .map(t => ({
                            value: t.id,
                            label: t.aliasName
                                ? `${t.packageName} (${t.aliasName})`
                                : t.packageName,
                        }));

                    return (
                        <Row
                            key={m.fromId}
                            gutter={[8, 8]}
                            align="middle"
                            className="mb-2"
                            style={{
                                padding: '8px 4px',
                                borderRadius: 6,
                                background: m.toId != null ? '#f6ffed' : '#fafafa',
                            }}
                        >
                            <Col span={10}>
                                <Flex vertical>
                                    <Space size={6}>
                                        <Typography.Text strong>
                                            {fromPkg.packageName}
                                        </Typography.Text>
                                        <Tag
                                            color={
                                                fromPkg.packageType === 'INDIVIDUAL'
                                                    ? 'purple'
                                                    : 'geekblue'
                                            }
                                        >
                                            {fromPkg.packageType ?? 'GROUP'}
                                        </Tag>
                                        {fromPkg.packageType === 'INDIVIDUAL' &&
                                            fromPkg.accessCode && (
                                                <Typography.Text
                                                    type="secondary"
                                                    className="text-xs"
                                                >
                                                    {fromPkg.accessCode}
                                                </Typography.Text>
                                            )}
                                    </Space>
                                    {fromPkg.aliasName && (
                                        <Typography.Text type="secondary" className="text-xs">
                                            {fromPkg.aliasName}
                                        </Typography.Text>
                                    )}
                                </Flex>
                            </Col>
                            <Col span={2}>
                                <Flex justify="center">
                                    <ArrowRightOutlined
                                        style={{ color: m.toId != null ? '#52c41a' : '#bfbfbf' }}
                                    />
                                </Flex>
                            </Col>
                            <Col span={12}>
                                <Flex gap={6} align="center">
                                    <div className="flex-1 min-w-0">
                                        <Select
                                            className="w-full"
                                            value={m.toId ?? undefined}
                                            options={toOptions}
                                            placeholder="Select target package (or leave unmapped)"
                                            allowClear
                                            showSearch
                                            filterOption={(input, option) =>
                                                (option?.label ?? '')
                                                    .toString()
                                                    .toLowerCase()
                                                    .includes(input.toLowerCase())
                                            }
                                            onChange={value =>
                                                setMappingFor(
                                                    m.fromId,
                                                    typeof value === 'number' ? value : null
                                                )
                                            }
                                        />
                                    </div>
                                    <Tooltip title="Duplicate this source package into the To partner (you can edit its name and prices)">
                                        <Button
                                            size="small"
                                            icon={<PlusOutlined />}
                                            onClick={() => setCreateForFromId(m.fromId)}
                                        >
                                            Create
                                        </Button>
                                    </Tooltip>
                                    {m.toId != null && m.isAuto && (
                                        <Tooltip title="Auto-detected — you can change or clear it">
                                            <Tag
                                                color="gold"
                                                style={{
                                                    margin: 0,
                                                    width: 84,
                                                    textAlign: 'center',
                                                }}
                                            >
                                                Auto
                                            </Tag>
                                        </Tooltip>
                                    )}
                                    {m.toId != null && !m.isAuto && (
                                        <Tag
                                            color="green"
                                            style={{
                                                margin: 0,
                                                width: 84,
                                                textAlign: 'center',
                                            }}
                                        >
                                            Manual
                                        </Tag>
                                    )}
                                    {m.toId == null && (
                                        <Tag
                                            color="default"
                                            style={{
                                                margin: 0,
                                                width: 84,
                                                textAlign: 'center',
                                            }}
                                        >
                                            Unmapped
                                        </Tag>
                                    )}
                                </Flex>
                            </Col>
                        </Row>
                    );
                })}
            </div>

            <CreatePackageModal
                open={createForFromId != null}
                source={sourceForCreate}
                toPartnerId={toPartnerId}
                toPartnerLabel={toPartnerLabel}
                onCancel={() => setCreateForFromId(null)}
                onCreated={newPkg => {
                    if (createForFromId != null) {
                        onPackageCreated(newPkg, createForFromId);
                    }
                    setCreateForFromId(null);
                }}
            />
        </Card>
    );
};

export default PackageMappingSection;
