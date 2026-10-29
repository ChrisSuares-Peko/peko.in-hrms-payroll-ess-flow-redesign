import React, { useEffect, useState } from 'react';

import { CheckOutlined, CloseOutlined, EditOutlined } from '@ant-design/icons';
import { Flex, Image, Pagination, Tooltip, Typography } from 'antd';

import BeforeCommissionNote from '@components/atomic/BeforeCommissionNote';
import GenericTable from '@components/atomic/GenericTable';
import { useAppSelector } from '@src/hooks/store';
import useDebounceSearch from '@src/hooks/useDebounceSearch';
import { formattedDateOnly, formattedTime } from '@utils/dateFormat';
import { useFindRolesService } from '@utils/findRolesService';

import HikeHeader from './HikeHeader';
import HikeModal from './HikeModal';
import useGetAllHike from '../../hooks/hike/useGetAllHike';
import useFilter from '../../hooks/useFilters';
import { RolePermissionAccessData } from '../../types/hike';

const Hike = () => {
    const initialValues = {
        searchText: '',
        page: 1,
        itemsPerPage: 10,
        sort: 'DESC',
        sortField: '',
        partnerId: '',
    };
    const [filters, setFilters] = useState(initialValues);
    const [openModal, setOpenModal] = useState(false);
    const [modalData, setModalData] = useState<any>();
    const [accessPermission, setAccessPermission] = useState<RolePermissionAccessData>();
    const { services } = useAppSelector(state => state.reducer.services) ?? {};
    const service = useFindRolesService(services?.data, 'Hike'); // Get the service
    useEffect(() => {
        if (service) {
            setAccessPermission(service); // Update state if service is found
        }
    }, [service]);
    const { searchText, updateSearchText } = useDebounceSearch(setFilters);

    const { tableData, count, loading, setRefresh, updateActiveStatusHike, downloadReport } =
        useGetAllHike(filters);

    const {
        handlePageChange,
        handleTableChange,
        handlePartnerChange: hikeHeaderPartnerChange,
    } = useFilter({
        setFilters,
    });
    // const { isLoading, statusUpdate,setRefresh } = useUpdateCorporateTax();
    const handleEdit = (record: any) => {
        setModalData(record);
        setOpenModal(true);
    };
    const handleActive = (id: number | string, status: any) => {
        let active;
        if (status === 1 || status === true) active = false;
        else active = true;
        updateActiveStatusHike({ id, status: active });
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
            title: 'Name',
            sorter: true,
            dataIndex: 'name',
            key: 'name',
            render: (data: any) => <Typography.Text>{data || '-'}</Typography.Text>,
        },

        {
            title: 'Features',
            sorter: true,
            dataIndex: 'features',
            key: 'features',
            width: 400,
            render: (data: any) => <Typography.Text>{data || '-'}</Typography.Text>,
        },
        {
            title: 'Partner Name',
            sorter: true,
            dataIndex: ['credential', 'registeredByCredential', 'name'], // Path to the name in nested data
            key: 'partnerName',
            render: (_: any, record: any) =>
                record.credential?.registeredByCredential?.name || 'Default', // Handle nested object
        },
        {
            title: 'Plan Type',
            dataIndex: 'planType',
            sorter: true,
            key: 'planType',
            render: (data: any) => (
                <Typography.Text>
                    {data.charAt(0).toUpperCase() + data.slice(1).toLowerCase() || '-'}
                </Typography.Text>
            ),
        },
        {
            title: 'Amount',
            dataIndex: 'amount',
            sorter: true,
            key: 'amount',
            render: (data: any, record: any) => (
                <Flex vertical>
                    <Typography.Text>{data || '-'}</Typography.Text>
                    <BeforeCommissionNote amount={data} totalCommission={record.totalCommission} />
                </Flex>
            ),
        },
        {
            title: 'Logo',
            dataIndex: 'logo',
            key: 'logo',
            render: (image: string) =>
                image ? <Image src={image} height={30} width={30} /> : 'N/A',
        },
        {
            title: 'Partner Logo',
            dataIndex: 'partners',
            key: 'partners',
            render: (image: string) =>
                image ? <Image src={image} height={30} width={30} /> : 'N/A',
        },
        {
            title: 'Salary Amount',
            dataIndex: 'salaryAmount',
            sorter: true,
            key: 'salaryAmount',
            render: (data: any) => <Typography.Text>{data || '-'}</Typography.Text>,
        },
        {
            title: 'Salary Condition',
            dataIndex: 'salaryValidation',
            sorter: true,
            key: 'salaryValidation',
            render: (data: any) => (
                <Typography.Text>
                    {data.charAt(0).toUpperCase() +
                        data.slice(1).toLowerCase().replace(/_/g, ' ') || '-'}
                </Typography.Text>
            ),
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
            title: 'Edit',
            dataIndex: 'action',
            key: 'action',
            render: (_: any, record: any) => (
                <Flex justify="space-between">
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
                </Flex>
            ),
        },
    ];

    return (
        <Flex vertical gap={20}>
            <HikeHeader
                downloadReport={downloadReport}
                setRefresh={setRefresh}
                handleSearch={updateSearchText}
                handlePartnerChange={hikeHeaderPartnerChange}
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
                className="text-end pt-7"
                onChange={handlePageChange}
                total={count}
                showSizeChanger={false}
            />
            {openModal && (
                <HikeModal
                    setRefresh={setRefresh}
                    data={modalData}
                    open={openModal}
                    handleCancel={() => setOpenModal(false)}
                />
            )}
        </Flex>
    );
};

export default Hike;
