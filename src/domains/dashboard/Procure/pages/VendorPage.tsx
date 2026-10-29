import React, { useState } from 'react';

import { SearchOutlined } from '@ant-design/icons';
import { Card, Col, Flex, Input, Modal, Pagination, Row, Typography } from 'antd';

import GenericTable from '@components/atomic/GenericTable';
import ConfirmationModal from '@components/molecular/modals/ConfirmationModal';

import AddVendorDrawer from '../components/Vendor/AddVendorDrawer';
import EditVendorDrawer from '../components/Vendor/EditVendorDrawer';
import VendorDrawer from '../components/Vendor/VendorDrawer';
import VendorHeader from '../components/Vendor/VendorHeader';
import useFilter from '../hooks/useFilter';
import { useVendor } from '../hooks/useVendor';
import { vendorColumns } from '../utils/VendorColumns';

const { Title, Text } = Typography;

const initialFilters = {
    search: '',
    page: 1,
    limit: 10,
};

const VendorPage: React.FC = () => {
    const [filters, setFilters] = useState(initialFilters);
    const [selectedId, setSelectedId] = useState<string | undefined>();
    const [deleteId, setDeleteId] = useState<number | undefined>();
    const [isDeleting, setIsDeleting] = useState(false);
    const [addDrawerOpen, setAddDrawerOpen] = useState(false);
    const [editVendorId, setEditVendorId] = useState<string | undefined>();

    const { isLoading, vendors, count, fetchVendors } = useVendor(undefined, filters);
    const { detail, isLoading: isDetailLoading } = useVendor(selectedId);
    const { remove } = useVendor(undefined, undefined);
    const { handleSearch, handlePageChange } = useFilter({ setFilter: setFilters });

    const handleDelete = async () => {
        if (!deleteId) return;
        setIsDeleting(true);
        const ok = await remove(deleteId);
        setIsDeleting(false);
        setDeleteId(undefined);
        if (ok) fetchVendors();
    };
    const columns = vendorColumns(
        (id) => setSelectedId(String(id)),
        (id) => setDeleteId(id),
        (id) => setEditVendorId(String(id))
    );

    return (
        <Card className="rounded-3xl w-full !border-gray-100" styles={{ body: { padding: 32 }  }}>
        <Row gutter={[0, 16]}>
            <Col span={24}>
                <Row gutter={[12, 12]} align="middle">
                    <Col xs={24} lg={14}>
                        <Title level={4} style={{ fontWeight: 600, marginBottom: 0 }}>Vendor Directory</Title>
                        <Text className="text-[#475569]">Your central supplier book. Manage contacts, bank details, and procurement history.</Text>
                    </Col>
                    <Col xs={24} lg={10}>
                        <Flex gap={8} align="center" justify="flex-end" wrap="wrap">
                            <Input
                                placeholder="Search"
                                suffix={<SearchOutlined />}
                                allowClear
                                value={filters.search}
                                onChange={e => handleSearch(e.target.value.replace(/\p{Extended_Pictographic}(️|‍\p{Extended_Pictographic})*/gu, ''))}
                                maxLength={100}
                                className="w-full lg:w-[240px]"
                            />
                            <div className="w-full lg:w-auto">
                                <VendorHeader
                                    onAdd={() => setAddDrawerOpen(true)}
                                    onCSVImport={fetchVendors}
                                />
                            </div>
                        </Flex>
                    </Col>
                </Row>
            </Col>

            <Col span={24}>
                <GenericTable
                    columns={columns}
                    dataSource={vendors}
                    rowKey="id"
                    loading={isLoading}
                    className="w-full"
                    bordered={false}
                    pagination={false}
                />
            </Col>

            <Col span={24}>
                {vendors.length > 0 && (
                    <Pagination
                        current={filters.page}
                        size="default"
                        className="text-end pt-7"
                        total={count}
                        defaultPageSize={10}
                        onChange={handlePageChange}
                    />
                )}
            </Col>

            <Modal
                open={!!selectedId}
                onCancel={() => setSelectedId(undefined)}
                footer={null}
                width="min(780px, 95vw)"
                centered
                closable={false}
                styles={{ content: { borderRadius: 41, padding: 0 }, body: { padding: 0 } }}
                loading={isDetailLoading}
            >
                {detail && (
                    <VendorDrawer
                        record={detail}
                        onClose={() => setSelectedId(undefined)}
                        onEdit={() => { setSelectedId(undefined); setEditVendorId(String(detail.id)); }}
                    />
                )}
            </Modal>
        </Row>

        <ConfirmationModal
            isOpen={!!deleteId}
            handleCancel={() => setDeleteId(undefined)}
            title="Are you sure you want to delete this vendor?"
            description="This action cannot be undone."
            handleSubmit={handleDelete}
            isLoading={isDeleting}
        />

        <AddVendorDrawer
            open={addDrawerOpen}
            onClose={() => setAddDrawerOpen(false)}
            onSuccess={fetchVendors}
        />

        <EditVendorDrawer
            vendorId={editVendorId}
            open={!!editVendorId}
            onClose={() => setEditVendorId(undefined)}
            onSuccess={fetchVendors}
        />
        </Card>
    );
};

export default VendorPage;
