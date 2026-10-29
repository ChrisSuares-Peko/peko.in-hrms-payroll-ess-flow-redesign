import React, { useEffect, useState } from 'react';

import {
    CheckOutlined,
    CloseOutlined,
    DeleteOutlined,
    EditOutlined,
    InfoCircleOutlined,
} from '@ant-design/icons';
import { Flex, Pagination, Popover, Tag, Tooltip, Typography } from 'antd';

import GenericTable from '@components/atomic/GenericTable';
import ConfirmationModal from '@components/molecular/modals/ConfirmationModal';
import { useAppDispatch, useAppSelector } from '@src/hooks/store';
import useDebounceSearch from '@src/hooks/useDebounceSearch';
import { showToast } from '@src/slices/apiSlice';
import { formattedDateOnly, formattedTime } from '@utils/dateFormat';
import { useFindRolesService } from '@utils/findRolesService';

import DomainHostingPlansHeader from './DomainHostingPlansHeader';
import DomainHostingPlansModal from './DomainHostingPlansModal';
import useGetAllDomainHostingPlans from '../../hooks/domainHostingPlans/useGetAllDomainHostingPlans';
import useRefetchDomainHostingPricing from '../../hooks/domainHostingPlans/useRefetchDomainHostingPricing';
import useFilter from '../../hooks/useFilters';
import {
    PLAN_TYPE_COLORS,
    PLAN_TYPE_LABELS,
    RolePermissionAccessData,
    PlanType,
} from '../../types/domainHostingPlan';

const DomainHostingPlans = () => {
    const initialValues = {
        searchText: '',
        page: 1,
        itemsPerPage: 10,
        sort: 'DESC',
        sortField: '',
    };
    const [filters, setFilters] = useState(initialValues);
    const [openModal, setOpenModal] = useState(false);
    const [modalData, setModalData] = useState<any>();
    const [deleteModal, setDeleteModal] = useState(false);
    const [accessPermission, setAccessPermission] = useState<RolePermissionAccessData>();

    const dispatch = useAppDispatch();
    const { services } = useAppSelector(state => state.reducer.services) ?? {};
    const service = useFindRolesService(services?.data, 'Domain & Hosting Plans');
    useEffect(() => {
        if (service) setAccessPermission(service);
    }, [service]);

    const { searchText, updateSearchText } = useDebounceSearch(setFilters);
    const { tableData, count, loading, setRefresh, updateStatus, deletePlan, downloadReport } =
        useGetAllDomainHostingPlans(filters);
    const { isLoading: refetchPricingLoading, refetchPricing } = useRefetchDomainHostingPricing();
    const { handlePageChange, handleTableChange } = useFilter({ setFilters });

    const handleRefetchPricing = async () => {
        const result = await refetchPricing();
        if (result) {
            dispatch(
                showToast({ description: 'Pricing refreshed successfully', variant: 'success' })
            );
            setRefresh(prev => !prev);
        }
    };

    const handleEdit = (record: any) => {
        setModalData(record);
        setOpenModal(true);
    };

    const handleToggleStatus = (id: number | string, status: any) => {
        updateStatus({ id, status: !(status === 1 || status === true) });
    };

    const handleConfirmation = (record: any) => {
        setModalData(record);
        setDeleteModal(true);
    };

    const handleDelete = () => {
        deletePlan(modalData?.id);
        setDeleteModal(false);
    };

    const columns = [
        {
            title: 'Date',
            dataIndex: 'createdAt',
            sorter: true,
            key: 'createdAt',
            render: (createdAt: any) => (
                <Flex vertical>
                    <Typography.Text>{formattedDateOnly(new Date(createdAt))}</Typography.Text>
                    <Typography.Text>{formattedTime(new Date(createdAt))}</Typography.Text>
                </Flex>
            ),
        },
        {
            title: 'Plan Name',
            dataIndex: 'planName',
            sorter: true,
            key: 'planName',
            render: (data: string) => <Typography.Text>{data || '-'}</Typography.Text>,
        },
        {
            title: 'Plan Type',
            dataIndex: 'planType',
            key: 'planType',
            render: (data: string) => (
                <Tag color={PLAN_TYPE_COLORS[data as PlanType] || 'default'}>
                    {PLAN_TYPE_LABELS[data as PlanType] || data || '-'}
                </Tag>
            ),
        },
        {
            title: 'Product ID',
            dataIndex: 'productId',
            key: 'productId',
            render: (data: string) => <Typography.Text code>{data || '-'}</Typography.Text>,
        },
        {
            title: 'Plan ID',
            dataIndex: 'planId',
            key: 'planId',
            render: (data: string) => <Typography.Text>{data || '-'}</Typography.Text>,
        },
        {
            title: 'Current Price',
            dataIndex: 'currentPrice',
            key: 'currentPrice',
            render: (
                data: { add?: Record<string, number>; renew?: Record<string, number> } | null
            ) => {
                const addKeys = Object.keys(data?.add ?? {}).sort((a, b) => Number(a) - Number(b));
                const defaultCycle = addKeys[0];
                const defaultPrice = defaultCycle != null ? data?.add?.[defaultCycle] : undefined;
                if (!data || defaultPrice == null) {
                    return <span className="text-gray-400">Not cached</span>;
                }

                const cycleLabels: Record<string, string> = {
                    '1': '1 Month',
                    '3': '3 Months',
                    '6': '6 Months',
                    '12': '12 Months',
                };

                const priceTable = (
                    <div style={{ minWidth: 220 }}>
                        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
                            <thead>
                                <tr>
                                    <th
                                        style={{
                                            textAlign: 'left',
                                            padding: '4px 8px',
                                            borderBottom: '1px solid #f0f0f0',
                                        }}
                                    >
                                        Cycle
                                    </th>
                                    <th
                                        style={{
                                            textAlign: 'right',
                                            padding: '4px 8px',
                                            borderBottom: '1px solid #f0f0f0',
                                        }}
                                    >
                                        New /mo
                                    </th>
                                    <th
                                        style={{
                                            textAlign: 'right',
                                            padding: '4px 8px',
                                            borderBottom: '1px solid #f0f0f0',
                                        }}
                                    >
                                        Renew /mo
                                    </th>
                                </tr>
                            </thead>
                            <tbody>
                                {Object.keys({ ...data.add, ...data.renew })
                                    .filter((c, i, arr) => arr.indexOf(c) === i)
                                    .sort((a, b) => Number(a) - Number(b))
                                    .map(cycle => (
                                        <tr key={cycle}>
                                            <td style={{ padding: '4px 8px' }}>
                                                {cycleLabels[cycle] ||
                                                    `${cycle} Month${Number(cycle) > 1 ? 's' : ''}`}
                                            </td>
                                            <td style={{ textAlign: 'right', padding: '4px 8px' }}>
                                                {data.add?.[cycle] != null
                                                    ? `₹ ${data.add[cycle]}`
                                                    : '-'}
                                            </td>
                                            <td style={{ textAlign: 'right', padding: '4px 8px' }}>
                                                {data.renew?.[cycle] != null
                                                    ? `₹ ${data.renew[cycle]}`
                                                    : '-'}
                                            </td>
                                        </tr>
                                    ))}
                            </tbody>
                        </table>
                    </div>
                );

                return (
                    <Flex align="center" gap={6}>
                        <Flex vertical gap={0}>
                            <Typography.Text>₹ {defaultPrice} /mo</Typography.Text>
                            {/* <Typography.Text type="secondary" style={{ fontSize: 11 }}>
                                {cycleLabels[defaultCycle] || `${defaultCycle} Months`} / New
                            </Typography.Text> */}
                        </Flex>
                        <Popover
                            content={priceTable}
                            title="Pricing Breakdown"
                            trigger="hover"
                            placement="top"
                        >
                            <InfoCircleOutlined
                                style={{ color: '#8c8c8c', cursor: 'pointer', fontSize: 13 }}
                            />
                        </Popover>
                    </Flex>
                );
            },
        },
        {
            title: 'Status',
            dataIndex: 'status',
            sorter: true,
            key: 'status',
            render: (status: any, record: any) => (
                <Tooltip
                    placement="top"
                    title={
                        !accessPermission?.update
                            ? 'Sorry, you do not have permission to perform this action'
                            : ''
                    }
                >
                    <span>
                        {status === 1 || status === true ? (
                            <CheckOutlined
                                className={`cursor-pointer ${accessPermission?.update ? 'text-textLime' : 'text-gray-400'}`}
                                style={{
                                    cursor: accessPermission?.update ? 'pointer' : 'not-allowed',
                                }}
                                onClick={() =>
                                    accessPermission?.update &&
                                    handleToggleStatus(record.id, record.status)
                                }
                            />
                        ) : (
                            <CloseOutlined
                                className={`cursor-pointer ${accessPermission?.update ? 'text-brandColor' : 'text-gray-400'}`}
                                style={{
                                    cursor: accessPermission?.update ? 'pointer' : 'not-allowed',
                                }}
                                onClick={() =>
                                    accessPermission?.update &&
                                    handleToggleStatus(record.id, record.status)
                                }
                            />
                        )}
                    </span>
                </Tooltip>
            ),
        },
        {
            title: 'Action',
            dataIndex: 'action',
            key: 'action',
            render: (_: any, record: any) => (
                <Flex justify="space-between" gap={10}>
                    <Tooltip
                        placement="top"
                        title={
                            !accessPermission?.update
                                ? 'Sorry, you do not have permission to perform this action'
                                : ''
                        }
                    >
                        <span>
                            {!accessPermission?.update ? (
                                <EditOutlined style={{ color: 'gray', cursor: 'not-allowed' }} />
                            ) : (
                                <EditOutlined onClick={() => handleEdit(record)} />
                            )}
                        </span>
                    </Tooltip>
                    <Tooltip
                        placement="top"
                        title={
                            !accessPermission?.update
                                ? 'Sorry, you do not have permission to perform this action'
                                : ''
                        }
                    >
                        <span>
                            {!accessPermission?.update ? (
                                <DeleteOutlined style={{ color: 'gray', cursor: 'not-allowed' }} />
                            ) : (
                                <DeleteOutlined onClick={() => handleConfirmation(record)} />
                            )}
                        </span>
                    </Tooltip>
                </Flex>
            ),
        },
    ];

    return (
        <Flex vertical gap={20}>
            <DomainHostingPlansHeader
                setRefresh={setRefresh}
                handleSearch={updateSearchText}
                searchText={searchText}
                accessPermission={accessPermission}
                downloadReport={downloadReport}
                onRefetchPricing={handleRefetchPricing}
                refetchPricingLoading={refetchPricingLoading}
            />
            <GenericTable
                rowKey={record => record.id}
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
                <DomainHostingPlansModal
                    setRefresh={setRefresh}
                    data={modalData}
                    open={openModal}
                    handleCancel={() => {
                        setOpenModal(false);
                        setModalData(undefined);
                    }}
                    mode={modalData ? 'edit' : 'add'}
                />
            )}
            {deleteModal && (
                <ConfirmationModal
                    handleSubmit={handleDelete}
                    handleCancel={() => setDeleteModal(false)}
                    isOpen={deleteModal}
                    title="Do you want to proceed with the deletion?"
                    isLoading={false}
                />
            )}
        </Flex>
    );
};

export default DomainHostingPlans;
