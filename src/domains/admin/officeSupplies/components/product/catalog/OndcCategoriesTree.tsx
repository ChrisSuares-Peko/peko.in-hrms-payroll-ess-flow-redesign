import { useState } from 'react';

import { Button, Flex, Image, Popconfirm, Switch, Table, Typography } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';

import { Pill } from '@src/domains/admin/officeSupplies/components/detail/DetailPrimitives';

import CategoryFormModal from './CategoryFormModal';
import useOndcCategories from '../../../hooks/products/useOndcCategories';
import { OndcCategoryRow, OndcCategoryTreeRow } from '../../../types/ondcCategory';

dayjs.extend(relativeTime);

const { Text } = Typography;

type ModalState = { open: boolean; parentId?: number; data?: OndcCategoryRow };

/**
 * Full CRUD category tree for the Categories tab (Manage > Products). Uses
 * antd's raw Table (not GenericTable, which strips out `expandable` for its
 * own responsive-column-overflow purpose and would conflict with tree
 * expand/collapse) with a manual expandedRowKeys/onExpand + a nested
 * headerless Table per parent for its subcategories.
 */
const OndcCategoriesTree = () => {
    const {
        isLoading,
        tree,
        createCategory,
        updateCategory,
        deleteCategory,
        toggleEnabled,
    } = useOndcCategories();
    const [expandedRowKeys, setExpandedRowKeys] = useState<React.Key[]>([]);
    const [modal, setModal] = useState<ModalState>({ open: false });

    const closeModal = () => setModal({ open: false });

    // Names already taken under the parent the modal is adding to / editing in,
    // so the form can flag a duplicate before the server rejects it.
    const modalParentId = modal.data ? modal.data.parentId : (modal.parentId ?? null);
    const siblingRows: OndcCategoryRow[] =
        modalParentId == null
            ? tree
            : (tree.find(row => row.id === modalParentId)?.subcategories ?? []);
    const siblingNames = siblingRows
        .filter(row => row.id !== modal.data?.id)
        .map(row => row.name);

    // One `columns` array drives both the parent table and the nested
    // subcategory one, so a row may or may not carry `subcategories`.
    const subcategoryCount = (record: OndcCategoryRow) =>
        (record as OndcCategoryTreeRow).subcategories?.length ?? 0;

    // Product counts are a server-side snapshot recomputed after catalog
    // ingestion, so surface their age rather than let them read as live.
    const countsUpdatedAt = tree.reduce<string | null>(
        (latest, row) =>
            row.productCountUpdatedAt && (!latest || row.productCountUpdatedAt > latest)
                ? row.productCountUpdatedAt
                : latest,
        null
    );

    const columns: ColumnsType<OndcCategoryRow> = [
        { title: 'Name', dataIndex: 'name', key: 'name' },
        {
            title: 'Icon',
            key: 'icon',
            width: 64,
            render: (_, record) =>
                record.parentId == null && record.iconUrl ? (
                    <Image
                        src={record.iconUrl}
                        alt={record.name}
                        width={36}
                        height={36}
                        preview={false}
                        style={{ borderRadius: '50%', objectFit: 'cover' }}
                    />
                ) : (
                    '-'
                ),
        },
        {
            title: 'ONDC Domain',
            key: 'domain',
            width: 140,
            render: (_, record) =>
                record.parentId != null && record.ondcDomain ? (
                    <Pill bg="#f0f5ff" color="#2f54eb">
                        {record.ondcDomain}
                    </Pill>
                ) : (
                    '-'
                ),
        },
        { title: 'Display Order', dataIndex: 'displayOrder', key: 'displayOrder', width: 130 },
        { title: 'Products', dataIndex: 'productCount', key: 'productCount', width: 110 },
        {
            title: 'Enabled',
            key: 'enabled',
            width: 90,
            render: (_, record) => (
                <Switch
                    checked={record.enabled}
                    onChange={checked => toggleEnabled(record.id, checked, !!record.parentId)}
                    style={{ backgroundColor: record.enabled ? '#22c55e' : undefined }}
                />
            ),
        },
        {
            title: 'Actions',
            key: 'actions',
            width: 280,
            render: (_, record) => {
                const children = subcategoryCount(record);
                return (
                    <Flex gap={12}>
                        <Typography.Link onClick={() => setModal({ open: true, data: record })}>
                            Edit
                        </Typography.Link>
                        {!record.parentId && (
                            <Typography.Link
                                onClick={() => setModal({ open: true, parentId: record.id })}
                            >
                                Add subcategory
                            </Typography.Link>
                        )}
                        <Popconfirm
                            title={`Delete "${record.name}"?`}
                            description={
                                children
                                    ? `This also deletes its ${children} subcategor${children === 1 ? 'y' : 'ies'}. Seller categories mapped to them go back to Review and their products are hidden. Disable it instead to keep them.`
                                    : 'Seller categories mapped to it go back to Review and their products are hidden. Disable it instead to keep them.'
                            }
                            onConfirm={() => deleteCategory(record.id)}
                            okText="Delete"
                            cancelText="Cancel"
                            okButtonProps={{ type: 'primary', danger: true }}
                            cancelButtonProps={{ type: 'default' }}
                        >
                            <Typography.Link type="danger">Delete</Typography.Link>
                        </Popconfirm>
                    </Flex>
                );
            },
        },
    ];

    return (
        <Flex vertical gap={12}>
            <Flex justify="space-between" align="center" wrap="wrap" gap={12}>
                <Flex vertical gap={2}>
                    <Text className="text-[13px] text-[#868686]">
                        Seller categories are mapped to these subcategories on the Review tab. Disabling
                        hides a category from the storefront; deleting is permanent and takes any
                        subcategories with it.
                    </Text>
                    <Text className="text-[12px] text-[#a0a0a0]">
                        {countsUpdatedAt
                            ? `Product counts last updated ${dayjs(countsUpdatedAt).fromNow()}.`
                            : 'Product counts update after the next catalog refresh.'}
                    </Text>
                </Flex>
                <Button type="primary" danger onClick={() => setModal({ open: true })}>
                    Add category
                </Button>
            </Flex>

            <Table<OndcCategoryTreeRow>
                rowKey="id"
                loading={isLoading}
                dataSource={tree}
                columns={columns as ColumnsType<OndcCategoryTreeRow>}
                pagination={false}
                expandable={{
                    expandedRowKeys,
                    onExpand: (expanded, record) =>
                        setExpandedRowKeys(prev =>
                            expanded ? [...prev, record.id] : prev.filter(k => k !== record.id)
                        ),
                    rowExpandable: record => record.subcategories.length > 0,
                    expandedRowRender: record => (
                        <Table<OndcCategoryRow>
                            rowKey="id"
                            showHeader={false}
                            pagination={false}
                            dataSource={record.subcategories}
                            columns={columns}
                        />
                    ),
                }}
            />

            {modal.open && (
                <CategoryFormModal
                    open={modal.open}
                    handleCancel={closeModal}
                    data={modal.data}
                    parentId={modal.parentId}
                    siblingNames={siblingNames}
                    createCategory={createCategory}
                    updateCategory={updateCategory}
                />
            )}

        </Flex>
    );
};

export default OndcCategoriesTree;
