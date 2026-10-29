import { useEffect, useRef, useState } from 'react';

import {
    AppstoreOutlined,
    ExclamationCircleFilled,
    PlusOutlined,
    SaveOutlined,
} from '@ant-design/icons';
import { Button, Card, Empty, Flex, Modal, Skeleton, Typography } from 'antd';
import { DndProvider } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';

import { useAppDispatch } from '@src/hooks/store';
import { showToast } from '@src/slices/apiSlice';

import AddNameDrawer from './AddNameDrawer';
import AddServiceDrawer from './AddServiceDrawer';
import DraggableServiceCard from './DraggableServiceCard';
import useUpdateRoles from '../../../hooks/useUpdateRoles';
import { CategoryNode, DeleteTarget, LeafServiceNode, ServiceNode } from '../../../types/systemUserTypes';

const { Title, Text } = Typography;

const RolesInitalAccess = () => {
    const dispatch = useAppDispatch();
    const { permissionData, saveInitialServicePermissions, isSaving } = useUpdateRoles();

    const [services, setServices] = useState<ServiceNode[]>([]);
    const [seeded, setSeeded] = useState(false);
    const [deleteTarget, setDeleteTarget] = useState<DeleteTarget>(null);
    const [serviceDrawerOpen, setServiceDrawerOpen] = useState(false);
    const [categoryTarget, setCategoryTarget] = useState<{
        serviceId: string;
        label: string;
    } | null>(null);
    const [leafTarget, setLeafTarget] = useState<{
        serviceId: string;
        categoryId: string;
        label: string;
    } | null>(null);

    // Monotonic id source — avoids Math.random and keeps keys stable across renders.
    const idCounter = useRef(0);
    const nextId = (prefix: string) => {
        idCounter.current += 1;
        return `${prefix}-${idCounter.current}`;
    };

    // Seed the editable 3-level tree from permissionData once it arrives.
    useEffect(() => {
        if (!permissionData || seeded) return;
        const seededServices: ServiceNode[] = permissionData.map(perm => ({
            id: nextId('svc'),
            label: perm.serviceCategory,
            hasAccess: perm.hasAccess,
            categories: (perm.services ?? []).map(cat => ({
                id: nextId('cat'),
                label: cat.category || cat.service || cat.label || 'Untitled',
                hasAccess: cat.hasAccess,
                services: (cat.services ?? []).map(leaf => ({
                    id: nextId('leaf'),
                    label: leaf.service || 'Untitled',
                    hasAccess: leaf.hasAccess,
                    view: leaf.view ?? false,
                    write: leaf.write ?? false,
                    update: leaf.update ?? false,
                })),
            })),
        }));
        setServices(seededServices);
        setSeeded(true);
    }, [permissionData, seeded]);

    /* ----------------------------- reordering ----------------------------- */
    const moveService = (dragIndex: number, hoverIndex: number) => {
        setServices(prev => {
            const updated = [...prev];
            const [moved] = updated.splice(dragIndex, 1);
            updated.splice(hoverIndex, 0, moved);
            return updated;
        });
    };

    const moveCategory = (serviceId: string, dragIndex: number, hoverIndex: number) => {
        setServices(prev =>
            prev.map(svc => {
                if (svc.id !== serviceId) return svc;
                const categories = [...svc.categories];
                const [moved] = categories.splice(dragIndex, 1);
                categories.splice(hoverIndex, 0, moved);
                return { ...svc, categories };
            })
        );
    };

    const moveLeaf = (categoryId: string, dragIndex: number, hoverIndex: number) => {
        setServices(prev =>
            prev.map(svc => ({
                ...svc,
                categories: svc.categories.map(cat => {
                    if (cat.id !== categoryId) return cat;
                    const leaves = [...cat.services];
                    const [moved] = leaves.splice(dragIndex, 1);
                    leaves.splice(hoverIndex, 0, moved);
                    return { ...cat, services: leaves };
                }),
            }))
        );
    };

    /* ------------------------------- helpers ------------------------------ */
    const updateService = (serviceId: string, fn: (svc: ServiceNode) => ServiceNode) =>
        setServices(prev => prev.map(svc => (svc.id === serviceId ? fn(svc) : svc)));

    const updateCategory = (
        serviceId: string,
        categoryId: string,
        fn: (cat: CategoryNode) => CategoryNode
    ) =>
        updateService(serviceId, svc => ({
            ...svc,
            categories: svc.categories.map(cat => (cat.id === categoryId ? fn(cat) : cat)),
        }));

    /* ------------------------------- add ---------------------------------- */
    const addService = (label: string) => {
        setServices(prev => [
            ...prev,
            { id: nextId('svc'), label, hasAccess: true, categories: [] },
        ]);
        dispatch(showToast({ description: `“${label}” added`, variant: 'success' }));
    };

    const addCategory = (serviceId: string, label: string) => {
        updateService(serviceId, svc => ({
            ...svc,
            categories: [
                ...svc.categories,
                { id: nextId('cat'), label, hasAccess: true, services: [] },
            ],
        }));
        dispatch(showToast({ description: `“${label}” added`, variant: 'success' }));
    };

    const addLeaf = (serviceId: string, categoryId: string, label: string) => {
        const leaf: LeafServiceNode = {
            id: nextId('leaf'),
            label,
            hasAccess: true,
            view: false,
            write: false,
            update: false,
        };
        updateCategory(serviceId, categoryId, cat => ({
            ...cat,
            services: [...cat.services, leaf],
        }));
        dispatch(showToast({ description: `“${label}” added`, variant: 'success' }));
    };

    /* ------------------------------- rename ------------------------------- */
    const renameService = (serviceId: string, label: string) =>
        updateService(serviceId, svc => ({ ...svc, label }));

    const renameCategory = (serviceId: string, categoryId: string, label: string) =>
        updateCategory(serviceId, categoryId, cat => ({ ...cat, label }));

    const renameLeaf = (serviceId: string, categoryId: string, leafId: string, label: string) =>
        updateCategory(serviceId, categoryId, cat => ({
            ...cat,
            services: cat.services.map(leaf => (leaf.id === leafId ? { ...leaf, label } : leaf)),
        }));

    /* ------------------------------- delete ------------------------------- */
    const confirmDelete = () => {
        if (!deleteTarget) return;
        if (deleteTarget.kind === 'service') {
            setServices(prev => prev.filter(svc => svc.id !== deleteTarget.serviceId));
        } else if (deleteTarget.kind === 'category') {
            updateService(deleteTarget.serviceId, svc => ({
                ...svc,
                categories: svc.categories.filter(cat => cat.id !== deleteTarget.categoryId),
            }));
        } else {
            updateCategory(deleteTarget.serviceId, deleteTarget.categoryId, cat => ({
                ...cat,
                services: cat.services.filter(leaf => leaf.id !== deleteTarget.leafId),
            }));
        }
        dispatch(showToast({ description: `“${deleteTarget.label}” removed`, variant: 'success' }));
        setDeleteTarget(null);
    };

    const deleteKindLabel = () => {
        if (deleteTarget?.kind === 'service') return 'service category';
        if (deleteTarget?.kind === 'category') return 'category';
        return 'service';
    };

    /* -------------------------------- save -------------------------------- */
    // Serialize the edited tree back into the 3-level shape
    // settings.initialServicePermissions is read as. Array order = saved order.
    const handleSave = async () => {
        const payload = services.map(svc => ({
            serviceCategory: svc.label,
            hasAccess: svc.hasAccess,
            services: svc.categories.map(cat => ({
                category: cat.label,
                hasAccess: cat.hasAccess,
                services: cat.services.map(leaf => ({
                    service: leaf.label,
                    hasAccess: leaf.hasAccess,
                    view: leaf.view,
                    write: leaf.write,
                    update: leaf.update,
                })),
            })),
        }));
        const res = await saveInitialServicePermissions(payload);
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

    const isLoading = !permissionData;

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
                        moveCategory={moveCategory}
                        moveLeaf={moveLeaf}
                        onRenameService={label => renameService(service.id, label)}
                        onAddCategory={() =>
                            setCategoryTarget({ serviceId: service.id, label: service.label })
                        }
                        onDeleteService={() =>
                            setDeleteTarget({
                                kind: 'service',
                                serviceId: service.id,
                                label: service.label,
                            })
                        }
                        onRenameCategory={(categoryId, label) =>
                            renameCategory(service.id, categoryId, label)
                        }
                        onDeleteCategory={(categoryId, label) =>
                            setDeleteTarget({
                                kind: 'category',
                                serviceId: service.id,
                                categoryId,
                                label,
                            })
                        }
                        onAddLeaf={(categoryId, categoryLabel) =>
                            setLeafTarget({
                                serviceId: service.id,
                                categoryId,
                                label: categoryLabel,
                            })
                        }
                        onRenameLeaf={(categoryId, leafId, label) =>
                            renameLeaf(service.id, categoryId, leafId, label)
                        }
                        onDeleteLeaf={(categoryId, leafId, label) =>
                            setDeleteTarget({
                                kind: 'leaf',
                                serviceId: service.id,
                                categoryId,
                                leafId,
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
                            <AppstoreOutlined />
                        </Flex>
                        <Flex vertical gap={2}>
                            <Title level={3} className="!m-0 !text-white">
                                System User Configuration
                            </Title>
                            <Text className="text-sm text-white/85">
                                Default service access for system-user roles · drag to reorder ·
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

            {/* Add service category (L1) drawer */}
            <AddServiceDrawer
                open={serviceDrawerOpen}
                onClose={() => setServiceDrawerOpen(false)}
                onAdd={addService}
            />

            {/* Add category (L2) drawer */}
            <AddNameDrawer
                open={!!categoryTarget}
                entity="Category"
                parentLabel={categoryTarget?.label}
                placeholder="e.g. Corporate"
                onClose={() => setCategoryTarget(null)}
                onAdd={label => {
                    if (categoryTarget) addCategory(categoryTarget.serviceId, label);
                }}
            />

            {/* Add service (L3) drawer */}
            <AddNameDrawer
                open={!!leafTarget}
                entity="Service"
                parentLabel={leafTarget?.label}
                placeholder="e.g. Corporate Users"
                onClose={() => setLeafTarget(null)}
                onAdd={label => {
                    if (leafTarget) addLeaf(leafTarget.serviceId, leafTarget.categoryId, label);
                }}
            />

            {/* Delete confirmation modal */}
            <Modal
                open={!!deleteTarget}
                centered
                title={
                    <Flex align="center" gap={10}>
                        <ExclamationCircleFilled className="text-xl text-brandColor" />
                        <span>Delete {deleteKindLabel()}?</span>
                    </Flex>
                }
                onCancel={() => setDeleteTarget(null)}
                okText="Delete"
                okButtonProps={{ danger: true }}
                cancelText="Cancel"
                onOk={confirmDelete}
            >
                <Text>
                    You are about to permanently remove{' '}
                    <Text strong>“{deleteTarget?.label}”</Text>
                    {deleteTarget?.kind !== 'leaf' ? ' and everything under it' : ''}. This action
                    cannot be undone.
                </Text>
            </Modal>
        </div>
    );
};

export default RolesInitalAccess;
