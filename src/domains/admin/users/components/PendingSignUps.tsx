import React, { useEffect, useState } from 'react';

import { EditOutlined, MailOutlined, PhoneOutlined } from '@ant-design/icons';
import { Flex, Pagination, Tooltip, Typography } from 'antd';
import dayjs from 'dayjs';

import GenericTable from '@components/atomic/GenericTable';
import { useAppSelector } from '@src/hooks/store';
import useDebounce from '@src/hooks/useDebounce';
import { formattedDateOnly, formattedTime } from '@utils/dateFormat';
import { useFindRolesService } from '@utils/findRolesService';

import EditModal from './EditModal';
import PendingUserSignupHeader from './PendingUserSignupHeader';
import useFilter from '../hooks/useFilters';
import useGetPendingSignUpsData from '../hooks/useGetPendingSignUpsData';
import usePartnersForCorporate from '../hooks/usePartnersForCorporate';
import { Data, RolePermissionAccessData } from '../types/corporateUserTypes';
import { statusData } from '../utils/data';

const PendingSignUps = () => {
    const { user } = useAppSelector(state => state.reducer.user);
    const today = new Date();
    const oneMonthAgoFormatted = dayjs(Number(today)).subtract(1, 'month').format('YYYY-MM-DD');
    const initialValues = {
        searchText: '',
        page: 1,
        itemsPerPage: 10,
        partnerId: '',
        sort: 'DESC',
        sortField: 'createdAt',
        from: oneMonthAgoFormatted, // today.toISOString().split('T')[0],
        to: today.toISOString().split('T')[0],
        status: 'PENDING',
    };
    const [filters, setFilters] = useState(initialValues);
    const [isDisabled, setIsDisabled] = useState<boolean>(false);
    useEffect(() => {
        setFilters({
            searchText: '',
            page: 1,
            itemsPerPage: 10,
            sort: 'DESC',
            sortField: 'createdAt',
            partnerId: user?.partnerId || '',
            from: initialValues.from,
            to: initialValues.to,
            status: 'PENDING',
        });
        if (user?.partnerId) setIsDisabled(true);
    }, [initialValues.from, initialValues.to, user]);
    const [openModal, setOpenModal] = useState(false);
    const [modalData, setModalData] = useState<Data>();
    const [accessPermission, setAccessPermission] = useState<RolePermissionAccessData>();
    const { services } = useAppSelector(state => state.reducer.services) ?? {};
    const service = useFindRolesService(services?.data, 'Corporate Users'); // Get the service
    useEffect(() => {
        if (service) {
            setAccessPermission(service);
        }
    }, [service]);
    const {
        handleSearch,
        handlePageChange,
        handleDateChange,
        handleFromChange,
        handleToChange,
        handleChangeFilters,
        searchText,
        setSearchText,
        handleTableChange,
    } = useFilter({ setFilters, initalStartDate: filters.from, initalEndDate: filters.to });
    const debouncedSearchText = useDebounce(filters.searchText, 300);
    const { isLoading, tableData, count, updatePendingsignup, downloadReport } =
        useGetPendingSignUpsData({
            ...filters,
            searchText: debouncedSearchText,
        });
    const debouncedSearchTextPartner = useDebounce(searchText, 300);
    const { partnerData } = usePartnersForCorporate(debouncedSearchTextPartner);
    const handleEdit = (record: Data) => {
        setModalData(record);
        setOpenModal(true);
    };
    const handleStatusChange = (value: string) => {
        setFilters(prev => ({
            ...prev,
            status: value,
            page: 1,
        }));
    };
    const columns = [
        {
            title: 'Date',
            sorter: true,
            dataIndex: 'createdAt',
            render: (createdAt: any) => (
                <Flex vertical>
                    <Typography.Text>{formattedDateOnly(new Date(createdAt))}</Typography.Text>
                    <Typography.Text>{formattedTime(new Date(createdAt))}</Typography.Text>
                </Flex>
            ),
            key: 'createdAt',
        },
        {
            title: 'Corporate Name',
            dataIndex: 'companyName',
            sorter: true,
            render: (name: any) => (
                <Flex vertical>
                    <Typography.Text>{name ?? 'N/A'}</Typography.Text>
                </Flex>
            ),
            key: 'companyName',
        },
        {
            title: 'Contact Details',
            dataIndex: 'email',
            render: (email: any, record: Data) => (
                <Flex vertical>
                    <Flex gap={8}>
                        <MailOutlined />
                        <Typography.Text>{email}</Typography.Text>
                    </Flex>
                    <Flex gap={8}>
                        <PhoneOutlined />
                        <Typography.Text>{record?.mobileNo}</Typography.Text>
                    </Flex>
                </Flex>
            ),
            key: 'email',
        },
        {
            title: 'Partner ID',
            sorter: true,
            dataIndex: 'partnerId',
            render: (data: any) => <Typography.Text>{data || 'N/A'}</Typography.Text>,
            key: 'PartnerId',
        },
        {
            title: 'Partner Name',
            dataIndex: 'partnerName',
            render: (data: any, record: any) => <Typography.Text>{data || 'N/A'}</Typography.Text>,
            key: 'partnerName',
        },
        {
            title: 'Password Created',
            dataIndex: 'isPasswordCreated',
            render: (isPasswordCreated: boolean) => (
                <Typography.Text>{isPasswordCreated ? 'Yes' : 'No'}</Typography.Text>
            ),
            key: 'isPasswordCreated',
        },
        {
            title: 'Email OTP Validated',
            dataIndex: 'isEmailOTPValidated',
            render: (isEmailOTPValidated: boolean) => (
                <Typography.Text>{isEmailOTPValidated ? 'Yes' : 'No'}</Typography.Text>
            ),
            key: 'isEmailOTPValidated',
        },
        {
            title: 'Mobile OTP Validated',
            dataIndex: 'isMobileOTPValidated',
            render: (isMobileOTPValidated: boolean) => (
                <Typography.Text>{isMobileOTPValidated ? 'Yes' : 'No'}</Typography.Text>
            ),
            key: 'isMobileOTPValidated',
        },
        {
            title: 'Status',
            dataIndex: 'status',
            key: 'status',
            sorter: true,
            render: (data: any, record: any) => {
                const formattedStatus = data
                    ? data
                          .toLowerCase()
                          .split(' ')
                          .map((t: string) => t.charAt(0).toUpperCase() + t.slice(1))
                    : 'N/A';
                return <Typography.Text>{formattedStatus}</Typography.Text>;
            },
        },
        {
            title: 'Actions',
            dataIndex: 'action',
            key: 'action',
            render: (_: any, record: any) => (
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
                </Flex>
            ),
            // <EditOutlined onClick={() => handleEdit(record)} />
        },
    ];

    return (
        <Flex vertical gap={20}>
            <PendingUserSignupHeader
                handleDownloadReport={downloadReport}
                handleChangeFilters={handleChangeFilters}
                handleSearch={handleSearch}
                statusData={statusData}
                setSearchText={setSearchText}
                searchText={filters.searchText}
                categoryDatas={partnerData}
                isDisabled={isDisabled}
                partnerSelected={filters.partnerId}
                handleDateChange={handleDateChange}
                handleFromChange={handleFromChange}
                handleToChange={handleToChange}
                handleStatusChange={handleStatusChange}
                from={filters.from}
                to={filters.to}
            />
            <GenericTable
                rowKey={record => record.id}
                columns={columns}
                dataSource={tableData}
                pagination={false}
                loading={isLoading}
                onChange={handleTableChange}
                // scroll={{ x: 756 }}
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
                <EditModal
                    updatePendingsignup={updatePendingsignup}
                    data={modalData}
                    open={openModal}
                    handleCancel={() => setOpenModal(false)}
                />
            )}
        </Flex>
    );
};

export default PendingSignUps;
