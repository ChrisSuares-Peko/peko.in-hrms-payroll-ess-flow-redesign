import { useEffect, useRef, useState } from 'react';

import {
    BankOutlined,
    ExclamationCircleFilled,
    PlusOutlined,
    SaveOutlined,
} from '@ant-design/icons';
import { Button, Card, Empty, Flex, Modal, Skeleton, Typography } from 'antd';
import { DndProvider } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';

import { useAppDispatch } from '@src/hooks/store';
import { showToast } from '@src/slices/apiSlice';

import AddNameDrawer, { SearchMeta, SelectedOperator } from './AddNameDrawer';
import DraggableServiceCard from './DraggableServiceCard';
import useCorporateConfig from '../../../hooks/useCorporateConfig';
import useServiceOperators from '../../../hooks/useServiceOperators';
import {
    CorpDeleteTarget,
    CorpSearchServiceEntry,
    CorpServiceNode,
} from '../../../types/systemUserTypes';

const { Title, Text } = Typography;

const CorporateUserConfiguration = () => {
    const dispatch = useAppDispatch();
    const { sidebarData, saveCorporateConfig, isSaving } = useCorporateConfig();
    const { operators, isLoading: operatorLoading } = useServiceOperators();

    const [services, setServices] = useState<CorpServiceNode[]>([]);
    const [seeded, setSeeded] = useState(false);
    const [deleteTarget, setDeleteTarget] = useState<CorpDeleteTarget>(null);
    const [serviceDrawerOpen, setServiceDrawerOpen] = useState(false);
    const [subServiceTarget, setSubServiceTarget] = useState<{
        serviceId: string;
        label: string;
    } | null>(null);
    // Edit targets carry the current name + operator + search metadata so the drawer prefills.
    const [serviceEditTarget, setServiceEditTarget] = useState<{
        serviceId: string;
        label: string;
        operatorValue?: string;
        pathKey?: string;
        tags?: string[];
    } | null>(null);
    const [subServiceEditTarget, setSubServiceEditTarget] = useState<{
        serviceId: string;
        serviceLabel: string;
        subServiceId: string;
        label: string;
        operatorValue?: string;
        pathKey?: string;
        tags?: string[];
    } | null>(null);

    // Monotonic id source — avoids Math.random and keeps keys stable across renders.
    const idCounter = useRef(0);
    const nextId = (prefix: string) => {
        idCounter.current += 1;
        return `${prefix}-${idCounter.current}`;
    };

    // Dashboard is always accessible by default; every other service defaults to no access.
    const isDashboardLabel = (label: string) => label.trim().toLowerCase() === 'dashboard';

    // Seed the editable 2-level tree from the partner sidebar once it arrives.
    useEffect(() => {
        if (!sidebarData || seeded) return;
        const seededServices: CorpServiceNode[] = sidebarData.map(svc => ({
            id: nextId('svc'),
            label: svc.label,
            hasAccess: isDashboardLabel(svc.label),
            alias: svc.alias,
            icon: svc.icon,
            enableMoreService: svc.enableMoreService,
            serviceProviderId: svc.serviceProviderId,
            accessKey: svc.accessKey,
            pathKey: svc.pathKey,
            tags: svc.tags,
            subServices: (svc.subServices ?? []).map(sub => ({
                id: nextId('sub'),
                label: sub.label,
                hasAccess: isDashboardLabel(sub.label),
                serviceProviderId: sub.serviceProviderId,
                accessKey: sub.accessKey,
                pathKey: sub.pathKey,
                tags: sub.tags,
            })),
        }));
        setServices(seededServices);
        setSeeded(true);
    }, [sidebarData, seeded]);

    /* ----------------------------- reordering ----------------------------- */
    const moveService = (dragIndex: number, hoverIndex: number) => {
        setServices(prev => {
            const updated = [...prev];
            const [moved] = updated.splice(dragIndex, 1);
            updated.splice(hoverIndex, 0, moved);
            return updated;
        });
    };

    const moveSubService = (parentId: string, dragIndex: number, hoverIndex: number) => {
        setServices(prev =>
            prev.map(svc => {
                if (svc.id !== parentId) return svc;
                const subServices = [...svc.subServices];
                const [moved] = subServices.splice(dragIndex, 1);
                subServices.splice(hoverIndex, 0, moved);
                return { ...svc, subServices };
            })
        );
    };

    /* ------------------------------- helpers ------------------------------ */
    const updateService = (serviceId: string, fn: (svc: CorpServiceNode) => CorpServiceNode) =>
        setServices(prev => prev.map(svc => (svc.id === serviceId ? fn(svc) : svc)));

    /* ------------------------------- add ---------------------------------- */
    const addService = (label: string, operator?: SelectedOperator, meta?: SearchMeta) => {
        setServices(prev => [
            ...prev,
            {
                id: nextId('svc'),
                label,
                hasAccess: isDashboardLabel(label),
                serviceProviderId: operator?.serviceProviderId,
                accessKey: operator?.accessKey,
                pathKey: meta?.pathKey,
                tags: meta?.tags,
                subServices: [],
            },
        ]);
        dispatch(showToast({ description: `“${label}” added`, variant: 'success' }));
    };

    const addSubService = (
        serviceId: string,
        label: string,
        operator?: SelectedOperator,
        meta?: SearchMeta
    ) => {
        updateService(serviceId, svc => ({
            ...svc,
            subServices: [
                ...svc.subServices,
                {
                    id: nextId('sub'),
                    label,
                    hasAccess: isDashboardLabel(label),
                    serviceProviderId: operator?.serviceProviderId,
                    accessKey: operator?.accessKey,
                    pathKey: meta?.pathKey,
                    tags: meta?.tags,
                },
            ],
        }));
        dispatch(showToast({ description: `“${label}” added`, variant: 'success' }));
    };

    /* -------------------------------- edit -------------------------------- */
    // Full edit (name + operator + search metadata). Passing no operator clears
    // serviceProviderId/accessKey.
    const editService = (
        serviceId: string,
        label: string,
        operator?: SelectedOperator,
        meta?: SearchMeta
    ) => {
        updateService(serviceId, svc => ({
            ...svc,
            label,
            serviceProviderId: operator?.serviceProviderId,
            accessKey: operator?.accessKey,
            pathKey: meta?.pathKey,
            tags: meta?.tags,
        }));
        dispatch(showToast({ description: `“${label}” updated`, variant: 'success' }));
    };

    const editSubService = (
        serviceId: string,
        subServiceId: string,
        label: string,
        operator?: SelectedOperator,
        meta?: SearchMeta
    ) => {
        updateService(serviceId, svc => ({
            ...svc,
            subServices: svc.subServices.map(sub =>
                sub.id === subServiceId
                    ? {
                          ...sub,
                          label,
                          serviceProviderId: operator?.serviceProviderId,
                          accessKey: operator?.accessKey,
                          pathKey: meta?.pathKey,
                          tags: meta?.tags,
                      }
                    : sub
            ),
        }));
        dispatch(showToast({ description: `“${label}” updated`, variant: 'success' }));
    };

    /* ------------------------------- rename ------------------------------- */
    const renameService = (serviceId: string, label: string) =>
        updateService(serviceId, svc => ({ ...svc, label }));

    const renameSubService = (serviceId: string, subServiceId: string, label: string) =>
        updateService(serviceId, svc => ({
            ...svc,
            subServices: svc.subServices.map(sub =>
                sub.id === subServiceId ? { ...sub, label } : sub
            ),
        }));

    /* ------------------------------- delete ------------------------------- */
    const confirmDelete = () => {
        if (!deleteTarget) return;
        if (deleteTarget.kind === 'service') {
            setServices(prev => prev.filter(svc => svc.id !== deleteTarget.serviceId));
        } else {
            updateService(deleteTarget.serviceId, svc => ({
                ...svc,
                subServices: svc.subServices.filter(sub => sub.id !== deleteTarget.subServiceId),
            }));
        }
        dispatch(showToast({ description: `“${deleteTarget.label}” removed`, variant: 'success' }));
        setDeleteTarget(null);
    };

    /* -------------------------------- save -------------------------------- */
    // Serialize the edited tree back into the partner sidebar shape
    // settings.partnerInitialAccessesibleServices is read as. Array order = saved order.
    const handleSave = async () => {
        const payload = services.map(svc => ({
            label: svc.label,
            hasAccess: svc.hasAccess,
            alias: svc.alias,
            icon: svc.icon,
            enableMoreService: svc.enableMoreService,
            serviceProviderId: svc.serviceProviderId,
            accessKey: svc.accessKey,
            subServices: svc.subServices.map(sub => ({
                label: sub.label,
                hasAccess: sub.hasAccess,
                serviceProviderId: sub.serviceProviderId,
                accessKey: sub.accessKey,
            })),
        }));
        // Flattened one entry per service + sub-service — persisted to settings.searchServices
        // and used to power search-by-tag/name lookups on the frontend.
        // A service and its sub-service can share a label — merge those into one entry.
        const searchServiceMap = new Map<string, CorpSearchServiceEntry>();
        services
            .flatMap(svc => [svc, ...svc.subServices])
            .forEach(node => {
                const key = node.label.trim().toLowerCase();
                const existing = searchServiceMap.get(key);
                if (existing) {
                    existing.tags = Array.from(new Set([...existing.tags, ...(node.tags ?? [])]));
                    existing.pathKey = existing.pathKey || node.pathKey || '';
                } else {
                    searchServiceMap.set(key, {
                        name: node.label,
                        tags: node.tags ?? [],
                        pathKey: node.pathKey ?? '',
                    });
                }
            });
        const searchServices = Array.from(searchServiceMap.values());
        const res = await saveCorporateConfig(payload, searchServices);
        if (res && res.status) {
            dispatch(showToast({ description: res.message, variant: 'success' }));
        } else {
            dispatch(
                showToast({
                    description: (res && res.message) || 'Failed to save structure',
                    variant: 'error',
                })
            );
        }
    };

    const isLoading = !sidebarData;

    const renderBody = () => {
        if (isLoading) {
            return (
                <Card className="rounded-2xl">
                    <Skeleton active paragraph={{ rows: 8 }} />
                </Card>
            );
        }
        if (services.length === 0) {
            return (
                <Card className="rounded-2xl py-10">
                    <Empty description="No services yet">
                        <Button
                            type="primary"
                            danger
                            icon={<PlusOutlined />}
                            onClick={() => setServiceDrawerOpen(true)}
                        >
                            Add your first service
                        </Button>
                    </Empty>
                </Card>
            );
        }
        return (
            <DndProvider backend={HTML5Backend}>
                {services.map((service, index) => (
                    <DraggableServiceCard
                        key={service.id}
                        index={index}
                        service={service}
                        moveService={moveService}
                        moveSubService={moveSubService}
                        onRenameService={label => renameService(service.id, label)}
                        onEditService={() =>
                            setServiceEditTarget({
                                serviceId: service.id,
                                label: service.label,
                                operatorValue: service.serviceProviderId?.toString(),
                                pathKey: service.pathKey,
                                tags: service.tags,
                            })
                        }
                        onAddSubService={() =>
                            setSubServiceTarget({ serviceId: service.id, label: service.label })
                        }
                        onDeleteService={() =>
                            setDeleteTarget({
                                kind: 'service',
                                serviceId: service.id,
                                label: service.label,
                            })
                        }
                        onRenameSubService={(subServiceId, label) =>
                            renameSubService(service.id, subServiceId, label)
                        }
                        onEditSubService={subServiceId => {
                            const sub = service.subServices.find(s => s.id === subServiceId);
                            setSubServiceEditTarget({
                                serviceId: service.id,
                                serviceLabel: service.label,
                                subServiceId,
                                label: sub?.label ?? '',
                                operatorValue: sub?.serviceProviderId?.toString(),
                                pathKey: sub?.pathKey,
                                tags: sub?.tags,
                            });
                        }}
                        onDeleteSubService={(subServiceId, label) =>
                            setDeleteTarget({
                                kind: 'subService',
                                serviceId: service.id,
                                subServiceId,
                                label,
                            })
                        }
                    />
                ))}
            </DndProvider>
        );
    };

    return (
        <div className="min-h-screen bg-gradient-to-b from-red-50/40 via-white to-white p-4 sm:p-6">
            {/* Hero header */}
            <Card
                className="mb-6 overflow-hidden rounded-2xl border-none shadow-sm"
                styles={{ body: { padding: 0 } }}
            >
                <Flex
                    align="center"
                    justify="space-between"
                    gap={16}
                    wrap="wrap"
                    className="bg-gradient-to-r from-brandColor to-[#ff6a6a] px-6 py-6"
                >
                    <Flex align="center" gap={16}>
                        <Flex
                            align="center"
                            justify="center"
                            className="h-14 w-14 rounded-2xl bg-white/20 text-2xl text-white backdrop-blur"
                        >
                            <BankOutlined />
                        </Flex>
                        <Flex vertical gap={2}>
                            <Title level={3} className="!m-0 !text-white">
                                Corporate User Configuration
                            </Title>
                            <Text className="text-sm text-white/85">
                                Default service access for corporate accounts · drag to reorder ·
                                click a name to rename
                            </Text>
                        </Flex>
                    </Flex>
                    <Button
                        size="large"
                        icon={<PlusOutlined />}
                        onClick={() => setServiceDrawerOpen(true)}
                        className="border-none bg-white font-semibold text-brandColor hover:!bg-white/90 hover:!text-brandColor"
                    >
                        Add New Service
                    </Button>
                </Flex>
            </Card>

            {/* Body */}
            {renderBody()}

            {/* Sticky save bar */}
            {!isLoading && services.length > 0 && (
                <Flex justify="flex-end" className="sticky bottom-0 mt-4 py-3">
                    <Button
                        type="primary"
                        danger
                        size="large"
                        icon={<SaveOutlined />}
                        className="px-8"
                        loading={isSaving}
                        onClick={handleSave}
                    >
                        Save Structure
                    </Button>
                </Flex>
            )}

            {/* Add service (L1) drawer */}
            <AddNameDrawer
                open={serviceDrawerOpen}
                entity="Service"
                placeholder="e.g. Bill Payments"
                operators={operators}
                operatorLoading={operatorLoading}
                onClose={() => setServiceDrawerOpen(false)}
                onSubmitValue={addService}
            />

            {/* Add sub-service (L2) drawer */}
            <AddNameDrawer
                open={!!subServiceTarget}
                entity="Sub-service"
                parentLabel={subServiceTarget?.label}
                placeholder="e.g. Electricity Bill"
                operators={operators}
                operatorLoading={operatorLoading}
                onClose={() => setSubServiceTarget(null)}
                onSubmitValue={(label, operator, meta) => {
                    if (subServiceTarget)
                        addSubService(subServiceTarget.serviceId, label, operator, meta);
                }}
            />

            {/* Edit service (L1) drawer */}
            <AddNameDrawer
                open={!!serviceEditTarget}
                entity="Service"
                isEdit
                initialLabel={serviceEditTarget?.label}
                initialOperatorValue={serviceEditTarget?.operatorValue}
                initialPathKey={serviceEditTarget?.pathKey}
                initialTags={serviceEditTarget?.tags}
                operators={operators}
                operatorLoading={operatorLoading}
                onClose={() => setServiceEditTarget(null)}
                onSubmitValue={(label, operator, meta) => {
                    if (serviceEditTarget)
                        editService(serviceEditTarget.serviceId, label, operator, meta);
                }}
            />

            {/* Edit sub-service (L2) drawer */}
            <AddNameDrawer
                open={!!subServiceEditTarget}
                entity="Sub-service"
                isEdit
                parentLabel={subServiceEditTarget?.serviceLabel}
                initialLabel={subServiceEditTarget?.label}
                initialOperatorValue={subServiceEditTarget?.operatorValue}
                initialPathKey={subServiceEditTarget?.pathKey}
                initialTags={subServiceEditTarget?.tags}
                operators={operators}
                operatorLoading={operatorLoading}
                onClose={() => setSubServiceEditTarget(null)}
                onSubmitValue={(label, operator, meta) => {
                    if (subServiceEditTarget)
                        editSubService(
                            subServiceEditTarget.serviceId,
                            subServiceEditTarget.subServiceId,
                            label,
                            operator,
                            meta
                        );
                }}
            />

            {/* Delete confirmation modal */}
            <Modal
                open={!!deleteTarget}
                centered
                title={
                    <Flex align="center" gap={10}>
                        <ExclamationCircleFilled className="text-xl text-brandColor" />
                        <span>
                            Delete {deleteTarget?.kind === 'service' ? 'service' : 'sub-service'}?
                        </span>
                    </Flex>
                }
                onCancel={() => setDeleteTarget(null)}
                okText="Delete"
                okButtonProps={{ danger: true }}
                cancelText="Cancel"
                onOk={confirmDelete}
            >
                <Text>
                    You are about to permanently remove <Text strong>“{deleteTarget?.label}”</Text>
                    {deleteTarget?.kind === 'service' ? ' and all of its sub-services' : ''}. This
                    action cannot be undone.
                </Text>
            </Modal>
        </div>
    );
};

export default CorporateUserConfiguration;
