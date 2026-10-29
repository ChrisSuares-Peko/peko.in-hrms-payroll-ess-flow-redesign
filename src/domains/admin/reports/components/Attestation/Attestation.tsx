import React, { useEffect, useState } from 'react';

import { DownloadOutlined, EditOutlined } from '@ant-design/icons';
import { Flex, Pagination, Table, Tooltip, Typography } from 'antd';
import dayjs from 'dayjs';
import { Link } from 'react-router-dom';

import { useAppDispatch, useAppSelector } from '@src/hooks/store';
import useDebounce from '@src/hooks/useDebounce';
import { showToast } from '@src/slices/apiSlice';
import { formattedDateTime } from '@utils/dateFormat';
import { useFindRolesService } from '@utils/findRolesService';
import { formatNumberWithLocalString } from '@utils/priceFormat';

import EditModal from './EditModal';
import Header from './Header';
import useFilter from '../../hooks/useFilter';
import useGetAttestation from '../../hooks/useGetAttestation';
import usePartnersForCorporate from '../../hooks/usePartnersForCorporate';
import { docAttestation, RolePermissionAccessData } from '../../types/attestation';

const Attestation = () => {
    const dispatch = useAppDispatch();

    const today = dayjs();
    const todayFormatted = today.format('YYYY-MM-DD');
    const oneMonthAgoFormatted = today.subtract(1, 'month').format('YYYY-MM-DD');
    const [searchText, setSearchText] = useState('');
    const debouncedSearchText = useDebounce(searchText, 500);
    const [openModal, setOpenModal] = useState(false);
    const [modalData, setModalData] = useState<docAttestation>();
    const [accessPermission, setAccessPermission] = useState<RolePermissionAccessData>();
    const { services } = useAppSelector(state => state.reducer.services) ?? {};
    const service = useFindRolesService(services?.data, 'Attestations'); // Get the service
    useEffect(() => {
        if (service) {
            setAccessPermission(service); // Update state if service is found
        }
    }, [service]);
    const initialValues = {
        searchText: '',
        category: '',
        sort: 'DESC',
        page: 1,
        itemsPerPage: 10,
        from: oneMonthAgoFormatted,
        to: todayFormatted,
    };
    const [filters, setFilters] = useState(initialValues);
    const { handlePageChange, handleDateChange, handleTableChange } = useFilter({
        setFilters,
        initalStartDate: initialValues.from,
        initalEndDate: initialValues.to,
    });
    const { isLoading, tableData, count, updateDocumentAttestation, downloadReport } =
        useGetAttestation(filters);
    const debouncedSearchTextPartner = useDebounce(searchText, 300);
    const { partnerData } = usePartnersForCorporate(debouncedSearchTextPartner);
    const handleEdit = (record: docAttestation) => {
        setModalData(record);
        setOpenModal(true);
    };
    const updateSearchText = (e: React.ChangeEvent<HTMLInputElement>) => {
        setSearchText(e.target.value);
    };
    const columns = [
        {
            title: 'Date',
            sorter: true,
            dataIndex: 'createdAt',
            key: 'createdAt',
            render: (data: any) => (
                <Typography.Text>{formattedDateTime(new Date(data))}</Typography.Text>
            ),
        },
        {
            title: 'Corporate ID',
            sorter: true,
            dataIndex: ['credential', 'username'],
            render: (data: any) => <Typography.Text>{data || 'N/A'}</Typography.Text>,
        },
        {
            title: 'Corporate Name',
            sorter: true,
            dataIndex: ['credential', 'name'],
            render: (data: any) => <Typography.Text>{data || 'N/A'}</Typography.Text>,
        },
        {
            title: 'Partner Name',
            sorter: true,
            dataIndex: ['credential', 'registeredBy'],
            render: (_: any, data: any) => (
                <Typography.Text>
                    {data?.credential?.registeredByCredential?.name ?? '-'}
                </Typography.Text>
            ),
        },
        {
            title: 'Document',
            sorter: true,
            dataIndex: 'documentType',
            render: (data: any) => <Typography.Text>{data || 'N/A'}</Typography.Text>,
        },
        {
            title: 'Amount',
            sorter: true,
            dataIndex: ['transaction', 'order', 'amountInINR'],
            render: (data: any) => (
                <Typography.Text>
                    {' '}
                    ₹ {formatNumberWithLocalString(Number(data)) || 0}
                </Typography.Text>
            ),
        },
        {
            title: 'Document Url',
            dataIndex: 'passportDoc',
            render: (documentUrl: any) =>
                documentUrl ? (
                    <Link
                        to={documentUrl}
                        target="_blank" // Open link in new tab
                        rel="noopener noreferrer"
                    >
                        <DownloadOutlined />
                    </Link>
                ) : (
                    <button
                        type="button"
                        onClick={() => {
                            dispatch(
                                showToast({
                                    description: 'No Document has been uploaded.',
                                    variant: 'error',
                                })
                            );
                        }}
                    >
                        <DownloadOutlined />
                    </button>
                ),
            key: 'passportDoc',
        },
        {
            title: 'Status',
            dataIndex: 'status',
        },
        {
            title: 'Actions',
            dataIndex: 'action',
            key: 'action',
            render: (_: any, record: docAttestation) => (
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
        },
    ];

    useEffect(() => {
        setFilters(prevState => ({
            ...prevState,
            searchText: debouncedSearchText,
            page: 1,
        }));
    }, [debouncedSearchText]);

    return (
        <Flex vertical gap={20}>
            <Header
                handleSearch={updateSearchText}
                searchText={searchText}
                handleDateChange={handleDateChange}
                from={filters.from}
                to={filters.to}
                handleDownloadReport={downloadReport}
                categoryDatas={partnerData}
                setSearchText={setSearchText}
                onPartnerChange={(partnerId: string | Number) => {
                    setFilters(prev => ({
                        ...prev,
                        partnerId: String(partnerId ?? ''), // set partnerId
                        page: 1, // reset to first page if needed
                    }));
                }}
            />
            <Table
                rowKey={record => record.id}
                columns={columns}
                dataSource={tableData}
                pagination={false}
                loading={isLoading}
                style={{ overflow: 'auto' }}
                scroll={{ x: 768 }}
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
                <EditModal
                    updateDocumentAttestation={updateDocumentAttestation}
                    data={modalData}
                    open={openModal}
                    handleCancel={() => setOpenModal(false)}
                />
            )}
        </Flex>
    );
};

export default Attestation;
