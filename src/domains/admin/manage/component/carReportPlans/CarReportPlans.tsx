import React, { useEffect, useState } from 'react';

import { CheckOutlined, CloseOutlined, EditOutlined, SearchOutlined } from '@ant-design/icons';
import { Button, Flex, Input, Pagination, Row, Tag, Tooltip, Typography } from 'antd';

import BeforeCommissionNote from '@components/atomic/BeforeCommissionNote';
import GenericTable from '@components/atomic/GenericTable';
import { useAppSelector } from '@src/hooks/store';
import useDebounceSearch from '@src/hooks/useDebounceSearch';
import { useFindRolesService } from '@utils/findRolesService';
import { formatNumberWithLocalString } from '@utils/priceFormat';

import CarReportPlansModal from './CarReportPlansModal';
import useGetAllCarReportPlans from '../../hooks/carReportPlans/useGetAllCarReportPlans';
import useFilter from '../../hooks/useFilters';
import { CarReportPlan, REPORT_TYPE_COLORS } from '../../types/carReportPlan';
import { RolePermissionAccessData } from '../../types/domainHostingPlan';

const NO_PERMISSION = 'Sorry, you do not have permission to perform this action';

// Turbo Car Report pricing (carReportPlans) — prices, package availability and the
// Droom product codes the booking runs on. An inspection plan without a product code
// stays on sale but auto-refunds, so the missing-code state is called out in red.
const CarReportPlans = () => {
    const [filters, setFilters] = useState({
        searchText: '',
        page: 1,
        itemsPerPage: 10,
        sort: 'ASC',
        sortField: 'sortOrder',
    });
    const [openModal, setOpenModal] = useState(false);
    const [modalData, setModalData] = useState<CarReportPlan | undefined>();
    const [accessPermission, setAccessPermission] = useState<RolePermissionAccessData>();

    const { services } = useAppSelector(state => state.reducer.services) ?? {};
    const service = useFindRolesService(services?.data, 'Car Report Plans');
    useEffect(() => {
        if (service) setAccessPermission(service);
    }, [service]);

    const { searchText, updateSearchText } = useDebounceSearch(setFilters);
    const { tableData, count, loading, setRefresh, updateStatus } = useGetAllCarReportPlans(filters);
    const { handlePageChange, handleTableChange } = useFilter({ setFilters });

    const canEdit = !!accessPermission?.update;

    const columns = [
        {
            title: 'Product',
            dataIndex: 'displayName',
            key: 'displayName',
            sorter: true,
            render: (name: string, record: CarReportPlan) => (
                <Flex vertical>
                    <Typography.Text>{name}</Typography.Text>
                    {record.packageId && (
                        <Typography.Text type="secondary">{record.packageId}</Typography.Text>
                    )}
                </Flex>
            ),
        },
        {
            title: 'Type',
            dataIndex: 'reportType',
            key: 'reportType',
            render: (type: string) => <Tag color={REPORT_TYPE_COLORS[type]}>{type}</Tag>,
        },
        {
            title: 'Price',
            dataIndex: 'price',
            key: 'price',
            sorter: true,
            render: (price: number, record: CarReportPlan) => (
                <Flex vertical>
                    <Typography.Text>{`₹ ${formatNumberWithLocalString(Number(price))}`}</Typography.Text>
                    <BeforeCommissionNote amount={price} totalCommission={record.totalCommission} />
                </Flex>
            ),
        },
        {
            title: 'Droom Product Code',
            dataIndex: 'vendorProductCode',
            key: 'vendorProductCode',
            render: (code: string, record: CarReportPlan) => {
                if (record.reportType !== 'inspection') return '—';
                return code ? (
                    <Typography.Text code>{code}</Typography.Text>
                ) : (
                    <Tag color="red">Not configured — purchases refund</Tag>
                );
            },
        },
        {
            title: 'Status',
            dataIndex: 'status',
            key: 'status',
            render: (status: boolean | number, record: CarReportPlan) => (
                <Tooltip placement="top" title={!canEdit ? NO_PERMISSION : ''}>
                    <span>
                        {status === 1 || status === true ? (
                            <CheckOutlined
                                className={`cursor-pointer ${canEdit ? 'text-textLime' : 'text-gray-400'}`}
                                style={{ cursor: canEdit ? 'pointer' : 'not-allowed' }}
                                onClick={() => canEdit && updateStatus({ id: record.id!, status: false })}
                            />
                        ) : (
                            <CloseOutlined
                                className={`cursor-pointer ${canEdit ? 'text-brandColor' : 'text-gray-400'}`}
                                style={{ cursor: canEdit ? 'pointer' : 'not-allowed' }}
                                onClick={() => canEdit && updateStatus({ id: record.id!, status: true })}
                            />
                        )}
                    </span>
                </Tooltip>
            ),
        },
        {
            title: 'Action',
            key: 'action',
            render: (_: unknown, record: CarReportPlan) => (
                <Tooltip title={!canEdit ? NO_PERMISSION : ''}>
                    <EditOutlined
                        style={!canEdit ? { color: 'gray', cursor: 'not-allowed' } : undefined}
                        onClick={() => {
                            if (!canEdit) return;
                            setModalData(record);
                            setOpenModal(true);
                        }}
                    />
                </Tooltip>
            ),
        },
    ];

    return (
        <Flex vertical gap={20}>
            <Row justify="space-between" className="w-full gap-5">
                <Input
                    className="max-w-80"
                    prefix={<SearchOutlined />}
                    placeholder="Search plans"
                    value={searchText}
                    onChange={updateSearchText}
                    allowClear
                />
                <Tooltip title={!canEdit ? NO_PERMISSION : ''}>
                    <Button type="primary" danger disabled={!canEdit} onClick={() => setOpenModal(true)}>
                        Add Plan
                    </Button>
                </Tooltip>
            </Row>
            <GenericTable
                rowKey={(record: CarReportPlan) => String(record.id)}
                columns={columns}
                dataSource={tableData}
                pagination={false}
                loading={loading}
                onChange={handleTableChange}
            />
            <Pagination
                current={filters.page}
                size="default"
                className="justify-end text-end pt-7"
                onChange={handlePageChange}
                total={count}
                showSizeChanger={false}
            />
            {openModal && (
                <CarReportPlansModal
                    setRefresh={setRefresh}
                    data={modalData}
                    open={openModal}
                    handleCancel={() => {
                        setOpenModal(false);
                        setModalData(undefined);
                    }}
                />
            )}
        </Flex>
    );
};

export default CarReportPlans;
