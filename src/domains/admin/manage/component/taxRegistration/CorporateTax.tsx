import React, { useEffect, useState } from 'react';

import { EditOutlined } from '@ant-design/icons';
import { Flex, Pagination, Tooltip, Typography } from 'antd';
import dayjs from 'dayjs';

import GenericTable from '@components/atomic/GenericTable';
import { useAppSelector } from '@src/hooks/store';
import useDebounceSearch from '@src/hooks/useDebounceSearch';
import { formattedDateOnly, formattedTime } from '@utils/dateFormat';
import { useFindRolesService } from '@utils/findRolesService';

import CorporateTaxModal from './CorporateTaxModal';
import TaxHeader from './TaxHeader';
import useFilter from '../../hooks/useFilters';
import useGetCorporateTax from '../../hooks/useGetCorporateTax';
import { Records, RolePermissionAccessData } from '../../types/corporateTaxTypes';

const today = dayjs();
const todayFormatted = today.format('YYYY-MM-DD');
const oneMonthAgoFormatted = today.subtract(1, 'month').format('YYYY-MM-DD');

const CorporateTax = () => {
    const initialValues = {
        searchText: '',
        page: 1,
        pageSize: 10,
        sort: 'DESC',
        sortField: '',
        from: oneMonthAgoFormatted,
        to: todayFormatted,
    };
    const [filters, setFilters] = useState(initialValues);
    const [openModal, setOpenModal] = useState(false);
    const [modalData, setModalData] = useState<Records>();

    const { searchText, updateSearchText } = useDebounceSearch(setFilters);
    const [accessPermission, setAccessPermission] = useState<RolePermissionAccessData>();
    const { services } = useAppSelector(state => state.reducer.services) ?? {};
    const service = useFindRolesService(services?.data, 'Corporate Tax Registration'); // Get the service
    useEffect(() => {
        if (service) {
            setAccessPermission(service); // Update state if service is found
        }
    }, [service]);
    const { tableData, count, loading, setRefresh, downloadReport } = useGetCorporateTax(filters);
    const {
        handlePageChange,
        handleTableChange,
        handleDateChange,
        handleFromChange,
        handleToChange,
    } = useFilter({ setFilters });
    // const { isLoading, statusUpdate,setRefresh } = useUpdateCorporateTax();
    const handleEdit = (record: Records) => {
        setModalData(record);
        setOpenModal(true);
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
            title: 'Company Name',
            sorter: true,
            dataIndex: 'companyName',
            key: 'companyName',
            render: (data: any) => <Typography.Text>{data || '-'}</Typography.Text>,
        },
        {
            title: 'Corporate Name',
            sorter: true,
            dataIndex: ['credential', 'name'],
            render: (_: any, data: any) => (
                <Typography.Text>{data?.credential.name || '-'}</Typography.Text>
            ),
        },
        {
            title: 'Corporate ID',
            sorter: true,
            dataIndex: ['credential', 'username'],
            render: (_: any, data: any) => (
                <Typography.Text>{data?.credential.username || '-'}</Typography.Text>
            ),
        },
        {
            title: 'Contact Person',
            sorter: true,
            dataIndex: 'contactPerson',
            key: 'contactPerson',
            render: (data: any) => <Typography.Text>{data || '-'}</Typography.Text>,
        },
        {
            title: 'Email ID',
            dataIndex: 'email',
            sorter: true,
            key: 'email',
            render: (data: any) => <Typography.Text>{data || '-'}</Typography.Text>,
        },

        {
            title: 'Status',
            sorter: true,
            dataIndex: 'status',
            key: 'status',
            render: (data: any) => (
                <Typography.Text>
                    {data.toLowerCase().replace(/^\w/, (c: string) => c.toUpperCase()) || '-'}
                </Typography.Text>
            ),
        },
        {
            title: 'Edit',
            dataIndex: 'action',
            key: 'action',
            render: (_: any, record: Records) => (
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
            <TaxHeader
                downloadReport={downloadReport}
                setRefresh={setRefresh}
                handleSearch={updateSearchText}
                searchText={searchText}
                handleDateChange={handleDateChange}
                handleFromChange={handleFromChange}
                handleToChange={handleToChange}
                from={filters.from}
                to={filters.to}
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
                <CorporateTaxModal
                    setRefresh={setRefresh}
                    data={modalData}
                    open={openModal}
                    handleCancel={() => setOpenModal(false)}
                />
            )}
        </Flex>
    );
};

export default CorporateTax;
