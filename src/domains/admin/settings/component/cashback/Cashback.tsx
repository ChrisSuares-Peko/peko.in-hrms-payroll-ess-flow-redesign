import React, { useEffect, useState } from 'react';

import { CheckOutlined, CloseOutlined, DeleteOutlined, EditOutlined } from '@ant-design/icons';
import { Flex, Pagination, Tooltip, Typography } from 'antd';

import GenericTable from '@components/atomic/GenericTable';
import ConfirmationModal from '@components/molecular/modals/ConfirmationModal';
import useFilter from '@src/domains/admin/manage/hooks/useFilters';
import { useAppSelector } from '@src/hooks/store';
import useDebounceSearch from '@src/hooks/useDebounceSearch';
import { formattedDateOnly, formattedTime } from '@utils/dateFormat';
import { useFindRolesService } from '@utils/findRolesService';
import { formatNumberWithLocalString, formatNumberWithoutCommas } from '@utils/priceFormat';

import CashbackHeader from './CashbackHeader';
import CashbackModal from './CashbackModal';
import useGetCashbacks from '../../hooks/useGetCashbacks';
import { RolePermissionAccessData, ServiceData } from '../../types/cashback';

const Cashback = () => {
    const initialValues = {
        searchText: '',
        page: 1,
        itemsPerPage: 10,
        sort: 'DESC',
        sortField: '',
        partnerId: '',
    };
    const [accessPermission, setAccessPermission] = useState<RolePermissionAccessData>();
    const { services } = useAppSelector(state => state.reducer.services) ?? {};
    const service = useFindRolesService(services?.data, 'Cashback'); // Get the service
    useEffect(() => {
        if (service) {
            setAccessPermission(service); // Update state if service is found
        }
    }, [service]);
    const [filters, setFilters] = useState(initialValues);
    const [openModal, setOpenModal] = useState(false);
    const [modalData, setModalData] = useState<ServiceData>();
    const [openConfirmationModal, setOpenConfirmationModal] = useState(false);
    const [modalPartnerId, setModalPartnerId] = useState<string | undefined>();
    const { searchText, updateSearchText } = useDebounceSearch(setFilters);
    const {
        isLoading,
        tableData,
        count,
        deleteDoc,
        setRefresh,
        updateActiveStatus,
        packageData,
        serviceData,
        downloadReport,
        serviceCategoryData,
    } = useGetCashbacks(filters, modalPartnerId); // Separate state for modal

    const [serviceCategoryState, setServiceCategoryState] = useState<any[]>([]);
    useEffect(() => {
        if (serviceCategoryData) {
            setServiceCategoryState(serviceCategoryData);
        }
    }, [serviceCategoryData, setRefresh]);

    const { handlePageChange, handleTableChange, handlePartnerChange, handleModalPartnerChange } =
        useFilter({
            setFilters,
            setModalPartnerId,
        });

    const handleActive = (cashbackId: number | string, status: any) => {
        let active;
        if (status === 1 || status === true) active = false;
        else active = true;
        updateActiveStatus({ cashbackId, serviceStatus: active });
    };
    const handleEdit = (record: ServiceData) => {
        setModalPartnerId(record?.partnerId ? String(record.partnerId) : 'default');
        setModalData(record);
        setOpenModal(true);
    };
    const handleDelete = (id: number) => {
        deleteDoc(id);
        setModalData(undefined);
        setOpenConfirmationModal(false);
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
            title: 'Service Operator',
            sorter: true,
            dataIndex: 'serviceProvider',
            render: (_: any, data: any) => (
                <Typography.Text>{data?.serviceOperator.serviceProvider || '-'}</Typography.Text>
            ),
            key: 'serviceOperator',
        },
        {
            title: 'Commision Type',
            sorter: true,
            dataIndex: 'cashbackType',
            key: 'cashbackType',
        },
        {
            title: 'Package Name',
            sorter: true,
            dataIndex: 'packageName',
            render: (_: any, data: any) => (
                <Typography.Text>{data?.package.packageName || '-'}</Typography.Text>
            ),
            key: 'package',
        },
        {
            title: 'Vendor Name',
            sorter: true,
            dataIndex: 'vendorName',
            render: (_: any, data: any) => (
                <Typography.Text>{data?.vendor.vendorName || '-'}</Typography.Text>
            ),
            // key: 'vendor',
        },
        {
            title: 'Partner Name',
            sorter: true,
            dataIndex: 'partnerName',
            key: 'partnerName',
            render: (partnerName: string) => partnerName || 'N/A',
        },
        {
            title: 'Surcharge',
            sorter: true,
            dataIndex: 'surcharge',
            key: 'surcharge',
            render: (surcharge: string, record: any) => (
                <Typography.Text>
                    {record.surchargeType === 'PERCENTAGE'
                        ? `${formatNumberWithoutCommas(surcharge)} %`
                        : `₹ ${formatNumberWithLocalString(surcharge) ?? '0.00'}`}{' '}
                </Typography.Text>
            ),
        },
        {
            title: 'Cashback',
            sorter: true,
            dataIndex: 'cashback',
            key: 'cashback',
            render: (text: any, record: any) => (
                <Typography.Text>
                    {record.cashbackType === 'PERCENTAGE'
                        ? `${formatNumberWithoutCommas(text)} %`
                        : `₹ ${formatNumberWithLocalString(text) ?? '0.00'}`}{' '}
                </Typography.Text>
            ),
        },
        {
            title: 'Base limit',
            sorter: true,
            dataIndex: 'baseLimit',
            key: 'baseLimit',
            render: (baseLimit: string) => formatNumberWithLocalString(baseLimit) ?? '0',
        },
        {
            title: 'Unit price',
            sorter: true,
            dataIndex: 'unitPrice',
            key: 'unitPrice',
            render: (unitPrice: string) => `₹ ${formatNumberWithLocalString(unitPrice) ?? '0.00'}`,
        },
        {
            title: 'Status',
            sorter: true,
            dataIndex: 'serviceStatus',
            key: 'serviceStatus',
            render: (status: any, record: ServiceData) => (
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
                                    handleActive(record.id, record.serviceStatus)
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
                                    handleActive(record.id, record.serviceStatus)
                                }
                                disabled={!accessPermission?.update}
                            />
                        )}
                    </span>
                </Tooltip>
            ),
        },
        {
            title: 'Edit',
            dataIndex: 'action',
            key: 'action',
            render: (_: any, record: ServiceData) => (
                <Flex justify="start">
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
                                    className="ml-7"
                                    style={{ color: 'gray', cursor: 'not-allowed' }}
                                    disabled
                                />
                            ) : (
                                <DeleteOutlined
                                    className=" text-brandColor ml-7"
                                    onClick={() => {
                                        setOpenConfirmationModal(true);
                                        setModalData(record);
                                    }}
                                />
                            )}
                        </span>
                    </Tooltip>
                </Flex>
            ),
        },
    ];

    return (
        <Flex vertical gap={20}>
            <CashbackHeader
                downloadReport={downloadReport}
                serviceData={serviceData}
                packageData={packageData}
                setRefresh={setRefresh}
                CategoryData={serviceCategoryState}
                handleSearch={updateSearchText}
                searchText={searchText}
                handlePartnerChange={handlePartnerChange}
                handleModalPartnerChange={handleModalPartnerChange}
                partnerId={modalPartnerId ?? ''}
                accessPermission={accessPermission}
            />
            <GenericTable
                rowKey={record => record.id}
                columns={columns}
                dataSource={tableData}
                pagination={false}
                loading={isLoading}
                onChange={handleTableChange}
            />
            <Pagination
                current={filters.page}
                size="default"
                className="text-end pt-7 justify-end"
                onChange={handlePageChange}
                total={count}
                showSizeChanger={false}
            />
            {openModal && (
                <CashbackModal
                    serviceData={serviceData}
                    CategoryData={serviceCategoryState}
                    packageData={packageData}
                    setRefresh={setRefresh}
                    data={modalData}
                    open={openModal}
                    handleCancel={() => setOpenModal(false)}
                    handlePartnerChange={handleModalPartnerChange} // Use the modal-specific function
                    partnerId={modalPartnerId}
                />
            )}

            {openConfirmationModal && (
                <ConfirmationModal
                    isOpen={openConfirmationModal}
                    handleCancel={() => setOpenConfirmationModal(false)}
                    title="Are you sure you want to delete this cashback? This action will make the service unusable. Please be careful."
                    handleSubmit={() => handleDelete(modalData!.id)}
                    isLoading={isLoading!}
                />
            )}
        </Flex>
    );
};

export default Cashback;
