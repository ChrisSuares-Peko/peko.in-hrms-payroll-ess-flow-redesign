import { ReactNode, useState } from 'react';

import { CloseOutlined, ReloadOutlined, SyncOutlined } from '@ant-design/icons';
import { Button, Drawer, Empty, Flex, Result, Select, Skeleton, Tag, Typography } from 'antd';
import moment from 'moment';

import useScreenSize from '@src/hooks/useScreenSize';

import SyncOpSection from './SyncOpSection';
import SyncResult from './SyncResult';
import usePackageSync from '../../hooks/usePackageSync';
import useSyncProviders from '../../hooks/useSyncProviders';
import { PackageSyncType, SyncPartnerPreview } from '../../types/packageSync';
import { groupOps, hasPendingChanges, SYNC_KIND_META, SYNC_KINDS } from '../../utils/packageSync';

type PartnerOption = { value: string | number | null; label: string };

type Props = {
    open: boolean;
    type: PackageSyncType;
    partnerOptions: PartnerOption[];
    initialPartnerIds: string[];
    onClose: () => void;
    handleRefresh: () => void;
};

const PackageSyncDrawer = ({ open, type, partnerOptions, initialPartnerIds, onClose, handleRefresh }: Props) => {
    const screens = useScreenSize();
    const { providers, isLoading: providersLoading, hasError: providersError, loadProviders } =
        useSyncProviders();
    const {
        preview,
        previewing,
        previewError,
        selection,
        selectedCount,
        applying,
        result,
        loadPreview,
        reset,
        toggle,
        apply,
    } = usePackageSync(type);
    const [accessKey, setAccessKey] = useState<string>();
    const [partnerIds, setPartnerIds] = useState<string[]>(initialPartnerIds);

    const provider = providers.find(p => p.accessKey === accessKey);
    const busy = previewing || applying;
    const canCheck = Boolean(provider) && partnerIds.length > 0 && !busy && !result;

    const partnerLabel = (partnerId: string) =>
        partnerOptions.find(p => String(p.value) === partnerId)?.label ?? `Partner #${partnerId}`;

    const handleServiceChange = (value: string) => {
        setAccessKey(value);
        reset();
    };

    const handlePartnersChange = (value: string[]) => {
        setPartnerIds(value);
        reset();
    };

    const handleCheck = () => {
        if (provider) loadPreview(provider.accessKey, partnerIds);
    };

    const handleApply = async () => {
        if (!provider) return;
        const res = await apply(provider.accessKey);
        if (res) handleRefresh();
    };

    const handleClose = () => {
        if (!busy) onClose();
    };

    const renderPartner = (p: SyncPartnerPreview) => {
        const grouped = groupOps(p.ops);
        return (
            <div key={p.partnerId} className="rounded-xl border border-borderCard p-4">
                <Flex vertical gap={4} className="mb-3">
                    <Typography.Text strong className="text-base text-textHeadings">
                        {partnerLabel(p.partnerId)}
                    </Typography.Text>
                    <Flex gap={4} wrap="wrap">
                        {SYNC_KINDS.filter(k => p.summary[k] > 0).map(k => (
                            <Tag key={k} color={SYNC_KIND_META[k].color} className="m-0">
                                {SYNC_KIND_META[k].label} {p.summary[k]}
                            </Tag>
                        ))}
                    </Flex>
                </Flex>
                {p.ops.length === 0 ? (
                    <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="No packages for this partner" />
                ) : (
                    <Flex vertical gap={16}>
                        {SYNC_KINDS.map(kind => (
                            <SyncOpSection
                                key={kind}
                                kind={kind}
                                ops={grouped[kind]}
                                selected={selection[p.partnerId]}
                                disabled={applying}
                                onToggle={(ids, checked) => toggle(p.partnerId, ids, checked)}
                            />
                        ))}
                    </Flex>
                )}
            </div>
        );
    };

    let body: ReactNode = null;
    if (result && preview) {
        body = <SyncResult result={result} preview={preview} partnerLabel={partnerLabel} />;
    } else if (previewing) {
        body = <Skeleton active paragraph={{ rows: 10 }} />;
    } else if (previewError) {
        body = (
            <Result
                status="error"
                title="Could not fetch plans from the vendor"
                subTitle={previewError}
                extra={
                    <Button icon={<ReloadOutlined />} onClick={handleCheck}>
                        Retry
                    </Button>
                }
            />
        );
    } else if (preview) {
        body = (
            <Flex vertical gap={20}>
                {!hasPendingChanges(preview) && (
                    <Result
                        status="success"
                        title="Everything is in sync"
                        subTitle={`${preview.vendor.count} vendor plans checked`}
                        style={{ padding: 0 }}
                    />
                )}
                {preview.partners.map(renderPartner)}
            </Flex>
        );
    } else if (!providersLoading && !providersError && providers.length === 0) {
        body = <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="No services support vendor sync yet." />;
    } else if (providersError) {
        body = (
            <Result
                status="error"
                title="Could not load services"
                extra={
                    <Button icon={<ReloadOutlined />} onClick={loadProviders}>
                        Retry
                    </Button>
                }
            />
        );
    }

    return (
        <Drawer
            open={open}
            onClose={handleClose}
            width={screens.md ? 640 : '100%'}
            closeIcon={null}
            extra={
                !busy && (
                    <CloseOutlined onClick={onClose} className="cursor-pointer text-base text-textHeadings" />
                )
            }
            maskClosable={!busy}
            keyboard={!busy}
            styles={{ body: { paddingInline: 20, paddingBlock: 16 } }}
            title={
                <Flex vertical gap={2}>
                    <Typography.Text strong className="text-base">
                        Auto Update
                    </Typography.Text>
                    {preview && (
                        <Typography.Text className="text-xs text-textGreyLight">
                            {preview.provider.label} · {preview.vendor.count} vendor plans · fetched{' '}
                            {moment(preview.vendor.fetchedAt).format('DD MMM YYYY, HH:mm')}
                        </Typography.Text>
                    )}
                </Flex>
            }
            footer={
                <Flex justify="end" gap={12}>
                    {result ? (
                        <Button type="primary" danger onClick={onClose}>
                            Done
                        </Button>
                    ) : (
                        <>
                            <Button onClick={onClose} disabled={busy}>
                                Cancel
                            </Button>
                            <Button
                                type="primary"
                                danger
                                loading={applying}
                                disabled={!preview || previewing || !!previewError || selectedCount === 0}
                                onClick={handleApply}
                            >
                                Apply selected ({selectedCount})
                            </Button>
                        </>
                    )}
                </Flex>
            }
        >
            <Flex vertical gap={16}>
                <Flex vertical gap={6}>
                    <Typography.Text className="text-sm text-textGreyLight">Service</Typography.Text>
                    <Select
                        className="w-full"
                        placeholder="Select service"
                        showSearch
                        optionFilterProp="label"
                        loading={providersLoading}
                        disabled={busy || !!result || providersLoading}
                        value={accessKey}
                        onChange={handleServiceChange}
                        options={providers.map(p => ({ value: p.accessKey, label: p.label }))}
                    />
                    {provider && (
                        <Flex gap={6} wrap="wrap" align="center">
                            <Typography.Text type="secondary" className="text-xs">
                                Fields compared:
                            </Typography.Text>
                            {provider.syncedFields.map(f => (
                                <Tag key={f} className="m-0">
                                    {f}
                                </Tag>
                            ))}
                        </Flex>
                    )}
                </Flex>
                <Flex vertical gap={6}>
                    <Typography.Text className="text-sm text-textGreyLight">Partners</Typography.Text>
                    <Select
                        mode="multiple"
                        className="w-full"
                        placeholder="Select partners"
                        maxTagCount="responsive"
                        showSearch
                        optionFilterProp="label"
                        value={partnerIds}
                        onChange={handlePartnersChange}
                        disabled={busy || !!result}
                        options={partnerOptions
                            .filter(p => p.value !== null && p.value !== undefined)
                            .map(p => ({ value: String(p.value), label: p.label }))}
                    />
                </Flex>
                {!result && (
                    <Flex justify="end">
                        <Button
                            type="primary"
                            danger
                            icon={<SyncOutlined />}
                            loading={previewing}
                            disabled={!canCheck}
                            onClick={handleCheck}
                        >
                            Check for updates with vendor
                        </Button>
                    </Flex>
                )}
                {body}
            </Flex>
        </Drawer>
    );
};

export default PackageSyncDrawer;
