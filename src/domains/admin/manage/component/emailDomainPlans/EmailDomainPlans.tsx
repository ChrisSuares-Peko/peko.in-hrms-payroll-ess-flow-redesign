import React, { useEffect, useState } from 'react';

import { CheckOutlined, CloseOutlined, DeleteOutlined, EditOutlined } from '@ant-design/icons';
import { Flex, Pagination, Image, Typography, Tooltip } from 'antd';

import BeforeCommissionNote from '@components/atomic/BeforeCommissionNote';
import GenericTable from '@components/atomic/GenericTable';
import ConfirmationModal from '@components/molecular/modals/ConfirmationModal';
import { useAppSelector } from '@src/hooks/store';
import useDebounceSearch from '@src/hooks/useDebounceSearch';
import { formattedDateOnly, formattedTime } from '@utils/dateFormat';
import { useFindRolesService } from '@utils/findRolesService';

import EmailDomainPlansHeader from './EmailDomainPlansHeader';
import EmailDomainPlansModal from './EmailDomainPlansModal';
import useGetAllEmailDomainPlans from '../../hooks/emailDomainPlans/useGetAllEmailDomainPlans';
import useFilter from '../../hooks/useFilters';
import { RolePermissionAccessData } from '../../types/emailDomainPlan';

const EmailDomainPlans = () => {
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
    const { services } = useAppSelector(state => state.reducer.services) ?? {};
    const service = useFindRolesService(services?.data, 'Business Emails Plans'); // Get the service
    useEffect(() => {
        if (service) {
            setAccessPermission(service); // Update state if service is found
        }
    }, [service]);
    const { searchText, updateSearchText } = useDebounceSearch(setFilters);
    const {
        tableData,
        count,
        loading,
        setRefresh,
        updateStatusEmailDomainPlans,
        downloadReport,
        deleteEmailDomainPlan,
    } = useGetAllEmailDomainPlans(filters);
    const { handlePageChange, handleTableChange } = useFilter({ setFilters });
    const handleEdit = (record: any) => {
        setModalData(record);
        setOpenModal(true);
    };
    const handleActive = (id: number | string, status: any) => {
        let active;
        if (status === 1 || status === true) active = false;
        else active = true;
        updateStatusEmailDomainPlans({ id, status: active });
    };
    const handleConfirmation = (record: any) => {
        setModalData(record);
        setDeleteModal(true);
    };
    const handleDelete = () => {
        deleteEmailDomainPlan(modalData!?.id);
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
            sorter: true,
            dataIndex: 'name',
            key: 'name',
            render: (data: any) => <Typography.Text>{data || '-'}</Typography.Text>,
        },
        {
            title: 'Product',
            sorter: true,
            dataIndex: ['softwares_subscription', 'name'],
            key: 'name',
            render: (data: any) => <Typography.Text>{data || '-'}</Typography.Text>,
        },
        {
            title: 'Monthly Price',
            sorter: true,
            dataIndex: 'monthlyPrice',
            key: 'monthlyPrice',
            render: (data: any, record: any) => (
                <Flex vertical>
                    <Typography.Text>₹ {data || '-'}</Typography.Text>
                    <BeforeCommissionNote
                        amount={data}
                        totalCommission={record.monthlyTotalCommission}
                    />
                </Flex>
            ),
        },
        {
            title: 'Yearly Price',
            sorter: true,
            dataIndex: 'yearlyPrice',
            key: 'yearlyPrice',
            render: (data: any, record: any) => (
                <Flex vertical>
                    <Typography.Text>₹ {data || '-'}</Typography.Text>
                    <BeforeCommissionNote
                        amount={data}
                        totalCommission={record.yearlyTotalCommission}
                    />
                </Flex>
            ),
        },
        {
            title: 'Image',
            dataIndex: 'image_url',
            key: 'image_url',
            render: (image: string) =>
                image ? <Image src={image} height={30} width={30} /> : 'N/A',
        },
        {
            title: 'Status',
            sorter: true,
            dataIndex: 'status',
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
                                className={`cursor-pointer ${
                                    accessPermission?.update ? 'text-textLime' : 'text-gray-400'
                                }`}
                                style={{
                                    cursor: accessPermission?.update ? 'pointer' : 'not-allowed',
                                }}
                                onClick={() =>
                                    accessPermission?.update &&
                                    handleActive(record.id, record.status)
                                }
                                disabled={!accessPermission?.update}
                            />
                        ) : (
                            <CloseOutlined
                                className={`cursor-pointer ${
                                    accessPermission?.update ? 'text-brandColor' : 'text-gray-400'
                                }`}
                                style={{
                                    cursor: accessPermission?.update ? 'pointer' : 'not-allowed',
                                }}
                                onClick={() =>
                                    accessPermission?.update &&
                                    handleActive(record.id, record.status)
                                }
                                disabled={!accessPermission?.update}
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
                                <EditOutlined
                                    style={{ color: 'gray', cursor: 'not-allowed' }}
                                    disabled
                                />
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
                                <DeleteOutlined
                                    style={{ color: 'gray', cursor: 'not-allowed' }}
                                    disabled
                                />
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
            <EmailDomainPlansHeader
                downloadReport={downloadReport}
                setRefresh={setRefresh}
                handleSearch={updateSearchText}
                searchText={searchText}
                accessPermission={accessPermission}
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
                <EmailDomainPlansModal
                    setRefresh={setRefresh}
                    data={modalData}
                    open={openModal}
                    handleCancel={() => setOpenModal(false)}
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

export default EmailDomainPlans;
