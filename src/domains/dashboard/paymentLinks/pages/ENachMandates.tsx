import { useCallback, useMemo, useState } from 'react';

import { SearchOutlined } from '@ant-design/icons';
import { Button, Flex, Input, Pagination, TableProps, Typography } from 'antd';

import GenericTable from '@src/components/atomic/GenericTable';

import ENachManageModal from '../components/ENachManageModal';
import ENachMandateModal from '../components/ENachMandateModal';
import useGetENachMandates from '../hooks/useGetENachMandates';
import { ENachMandateListItem } from '../types/paymentLinkTypes';
import { columnsEnachMandate } from '../utils/data';

const ENachMandates = () => {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isManageModalOpen, setIsManageModalOpen] = useState(false);
    const [selectedMandate, setSelectedMandate] = useState<ENachMandateListItem | null>(null);
    const { isLoading, mandates, total, page, pageSize, setPage, search, setSearch, fetchMandates } =
        useGetENachMandates();
    const openManageModal = useCallback((record: ENachMandateListItem) => {
        setSelectedMandate(record);
        setIsManageModalOpen(true);
    }, []);

    const enachColumns = useMemo<TableProps<ENachMandateListItem>['columns']>(
        () => [
            ...(columnsEnachMandate || []),
            {
                title: 'Actions',
                key: 'actions',
                width: 120,
                render: (_, record) => (
                    <Button
                        type="link"
                        className="!p-0"
                        onClick={() => openManageModal(record)}
                        disabled={!record?.reference_id}
                    >
                        Manage
                    </Button>
                ),
            },
        ],
        [openManageModal]
    );

    return (
        <Flex vertical gap={20} className="p-4 md:p-6">
            <Flex justify="space-between" align="center" wrap="wrap" gap={12}>
                <Flex vertical gap={4}>
                    <Typography.Title level={3} className="!mb-0 !font-bold">
                        eNACH Mandates
                    </Typography.Title>
                    <Typography.Text className="text-gray-500">
                        View all eNACH mandates and create new recurring debit mandates.
                    </Typography.Text>
                </Flex>
                <Button type="primary" danger size="large" onClick={() => setIsModalOpen(true)}>
                    Add eNACH Mandate
                </Button>
            </Flex>

            <Input
                size="large"
                placeholder="Search by customer name, email, or phone"
                prefix={<SearchOutlined className="text-gray-400" />}
                value={search}
                onChange={e => {
                    setSearch(e.target.value);
                    setPage(1);
                }}
                allowClear
                className="w-full"
            />

            <GenericTable
                columns={enachColumns}
                dataSource={mandates}
                loading={isLoading}
                rowKey={record => record.id || record.reference_id || String(record.createdAt)}
                pagination={false}
            />

            <Flex justify="end">
                <Pagination
                    current={page}
                    total={total}
                    pageSize={pageSize}
                    showSizeChanger={false}
                    onChange={setPage}
                />
            </Flex>

            <ENachMandateModal
                open={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                onSuccess={() => {
                    if (page !== 1) {
                        setPage(1);
                        return;
                    }
                    fetchMandates();
                }}
            />

            <ENachManageModal
                open={isManageModalOpen}
                mandate={selectedMandate}
                onClose={() => {
                    setIsManageModalOpen(false);
                    setSelectedMandate(null);
                }}
                onUpdated={fetchMandates}
            />
        </Flex>
    );
};

export default ENachMandates;
