import React, { useEffect, useState } from 'react';

import {
    CheckOutlined,
    CloseOutlined,
    EditOutlined,
    MailOutlined,
    PhoneOutlined,
} from '@ant-design/icons';
import { Flex, Pagination, Typography, Tooltip } from 'antd';
import dayjs from 'dayjs';

import GenericTable from '@components/atomic/GenericTable';
import { useAppSelector } from '@src/hooks/store';
import useDebounce from '@src/hooks/useDebounce';
import useDebounceSearch from '@src/hooks/useDebounceSearch';
import { formattedDateOnly, formattedTime } from '@utils/dateFormat';
import { useFindRolesService } from '@utils/findRolesService';
import { formatNumberWithLocalString } from '@utils/priceFormat';

import AddCorporateModal from './AddCorporateModal';
import CorporateUserHeader from './CorporateUserHeader';
import EditCorporateUserDetails from './EditCorporateUserDetails';
import useFilter from '../hooks/useFilters';
import useGetCorporateUserData from '../hooks/useGetCorporateUserData';
import usePartnersForCorporate from '../hooks/usePartnersForCorporate';
import { Data, RolePermissionAccessData } from '../types/corporateUserTypes';

const CorporateUser = () => {
    const { user } = useAppSelector(state => state.reducer.user);
    const today = dayjs();
    const todayFormatted = today.format('YYYY-MM-DD');
    const oneMonthAgoFormatted = today.subtract(1, 'month').format('YYYY-MM-DD');
    const initialValues = {
        searchText: '',
        page: 1,
        itemsPerPage: 10,
        partnerId: '',
        sort: 'DESC',
        sortField: 'createdAt',
        from: oneMonthAgoFormatted,
        to: todayFormatted,
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
        });
        if (user?.partnerId) setIsDisabled(true);
    }, [initialValues.from, initialValues.to, user]);
    const [addCorporateModalOpen, setAddCorporateModalOpen] = useState(false);
    const [openModal, setOpenModal] = useState(false);
    const [modalData, setModalData] = useState<Data>();
    const [accessPermission, setAccessPermission] = useState<RolePermissionAccessData>();
    const { services } = useAppSelector(state => state.reducer.services) ?? {};
    const service = useFindRolesService(services?.data, 'Corporate Users'); // Get the service
    useEffect(() => {
        if (service) {
            setAccessPermission(service); // Update state if service is found
        }
    }, [service]);
    const {
        handlePageChange,
        handleChangeFilters,
        handleDateChange,
        handleFromChange,
        handleToChange,
        searchText,
        setSearchText,
        handleTableChange,
    } = useFilter({
        setFilters,
        initalStartDate: initialValues.from,
        initalEndDate: initialValues.to,
    });
    const { searchText: userSearchText, updateSearchText } = useDebounceSearch(setFilters);
    const {
        isLoading,
        tableData,
        count,
        updateActiveStatus,
        updateCorporateUserData,
        kycStatus,
        packageData,
        downloadReport,
        addNewCorporate,
        SetRefresh,
    } = useGetCorporateUserData(filters);
    const debouncedSearchText = useDebounce(searchText, 300);
    const { partnerData } = usePartnersForCorporate(debouncedSearchText);
    const handleActive = (corporateId: number | string, isActive: any) => {
        let active;
        if (isActive === 1 || isActive === true) active = false;
        else active = true;
        updateActiveStatus({ corporateId, isActive: active });
    };
    const handleEdit = (record: Data) => {
        setModalData(record);
        setOpenModal(true);
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
            title: 'Corporate Name / Account ID',
            dataIndex: ['credential', 'username'],
            sorter: true,
            render: (companyName: any, record: Data) => (
                <Flex vertical>
                    <Typography.Text>{record.name}</Typography.Text>
                    <Typography.Text>{record.credential.username}</Typography.Text>
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
                        <Typography.Text>{record.mobileNo}</Typography.Text>
                    </Flex>
                </Flex>
            ),
            key: 'email',
        },
        {
            title: 'Partner ID',
            sorter: true,
            dataIndex: ['credential', 'registeredBy'],
            render: (data: any, record: any) => (
                <Typography.Text>{record.credential.registeredBy || 'N/A'}</Typography.Text>
            ),
            key: 'PartnerId',
        },
        {
            title: 'Partner Name',
            dataIndex: 'partnerName',
            render: (data: any, record: any) => (
                <Typography.Text>{record?.partnerName || 'N/A'}</Typography.Text>
            ),
            key: 'partnerName',
        },
        {
            title: 'Account Type',
            dataIndex: ['credential', 'accountType'],
            key: 'accountType',
            render: (_: any, record: Data) => (
                <Typography.Text className="capitalize">
                    {record.credential.accountType || 'corporate'}
                </Typography.Text>
            ),
        },
        {
            title: 'Balance',
            dataIndex: 'balance',
            render: (amount: string) => `₹ ${formatNumberWithLocalString(amount)}`,
            key: 'balance',
        },
        {
            title: 'City',
            dataIndex: 'city',
            sorter: true,
            key: 'city',
            render: (text: string) => text || 'N/A',
        },
        {
            title: 'Status',
            dataIndex: 'isActive',
            key: 'isActive',
            sorter: true,
            render: (isActive: any, record: Data) => (
                <Tooltip
                    placement="rightTop"
                    title={
                        !accessPermission?.update
                            ? 'Sorry, you do not have permission to perform this action'
                            : ''
                    }
                >
                    <span>
                        {isActive === 1 || isActive === true ? (
                            <CheckOutlined
                                className={`cursor-pointer ${
                                    accessPermission?.update ? 'text-textLime' : 'text-gray-400'
                                }`}
                                style={{
                                    cursor: accessPermission?.update ? 'pointer' : 'not-allowed',
                                }}
                                onClick={() =>
                                    accessPermission?.update &&
                                    handleActive(record.credentialId, record.isActive)
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
                                    handleActive(record.credentialId, record.isActive)
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
            render: (_: any, record: Data) => (
                <Flex justify="start">
                    <Tooltip
                        placement="rightTop"
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
            <CorporateUserHeader
                handleDownloadReport={downloadReport}
                handleChangeFilters={handleChangeFilters}
                handleSearch={updateSearchText}
                setSearchText={setSearchText}
                searchText={userSearchText}
                categoryDatas={partnerData}
                isDisabled={isDisabled}
                partnerSelected={filters.partnerId}
                setAddCorporateModalOpen={setAddCorporateModalOpen}
                accessPermission={accessPermission}
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
                loading={isLoading}
                onChange={handleTableChange}
                // scroll={{ x: 756 }}
            />
            <Pagination
                current={filters.page}
                size="default"
                className="justify-end text-end pt-7"
                onChange={handlePageChange}
                total={count}
                showSizeChanger={false}
            />
            {addCorporateModalOpen && (
                <AddCorporateModal
                    addNewCorporate={addNewCorporate}
                    handleCancel={() => setAddCorporateModalOpen(false)}
                    open={addCorporateModalOpen}
                    isDisabled={isDisabled}
                    partnerSelected={filters.partnerId}
                />
            )}
            {openModal && (
                <EditCorporateUserDetails
                    packageData={packageData}
                    data={modalData}
                    open={openModal}
                    updateCorporateUserData={updateCorporateUserData}
                    handleCancel={() => setOpenModal(false)}
                    kycStatus={kycStatus}
                    handleRefresh={SetRefresh}
                />
            )}
        </Flex>
    );
};

export default CorporateUser;
