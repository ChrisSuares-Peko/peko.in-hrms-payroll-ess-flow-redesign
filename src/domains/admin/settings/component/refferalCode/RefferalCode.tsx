import React, { useState, useEffect } from 'react';

import {
    CheckOutlined,
    CloseOutlined,
    DeleteOutlined,
    EditOutlined,
    EyeOutlined,
} from '@ant-design/icons';
import { Flex, Pagination, Tooltip, Typography } from 'antd';

import GenericTable from '@components/atomic/GenericTable';
import ConfirmationModal from '@components/molecular/modals/ConfirmationModal';
import useFilter from '@src/domains/admin/manage/hooks/useFilters';
import { useAppSelector } from '@src/hooks/store';
import useDebounceSearch from '@src/hooks/useDebounceSearch';
import { formattedDateOnly, formattedTime } from '@utils/dateFormat';
import { useFindRolesService } from '@utils/findRolesService';

import ReferralReportModal from './ReferralReportModal';
import RefferalCodeHeaders from './RefferalCodeHeaders';
import RefferalCodeModal from './RefferalCodeModal';
import useGetRefaralCodes from '../../hooks/useGetRefaralCodes';
import { Referral, RolePermissionAccessData } from '../../types/refferalCode';

const RefferalCode = () => {
    const initialValues = {
        searchText: '',
        page: 1,
        itemsPerPage: 10,
        sort: 'DESC',
        sortField: '',
    };
    const [filters, setFilters] = useState(initialValues);
    const [openModal, setOpenModal] = useState(false);
    const [accessPermission, setAccessPermission] = useState<RolePermissionAccessData>();
    const { services } = useAppSelector(state => state.reducer.services) ?? {};
    const service = useFindRolesService(services?.data, 'Referral Code'); // Get the service
    useEffect(() => {
        if (service) {
            setAccessPermission(service); // Update state if service is found
        }
    }, [service]);
    const [deleteModal, setDeleteModal] = useState(false);
    const [modalData, setModalData] = useState<Referral>();
    const [refReportModalVisible, setRefReportModalVisible] = useState(false);
    // const [refReportModalData, setRefReportModalData] = useState<number | null>(null);
    const [refPartnerId, setRefPartnerId] = useState<number>();
    const [refCode, setRefCode] = useState<string>('');

    const { searchText, updateSearchText } = useDebounceSearch(setFilters);
    const {
        isLoading,
        tableData,
        count,
        deleteDoc,
        setRefresh,
        updateActiveStatus,
        downloadReport,
        fetchReferralReports,
        refCount,
        downloadRefReport,
        fetchGeneralReferralReports,
    } = useGetRefaralCodes(filters);

    const { handlePageChange, handleTableChange } = useFilter({ setFilters });

    const handleRefReportModalOpen = async (record: Referral) => {
        const fromDate = '';
        const toDate = '';
        const { partnerId, referralCode } = record;
        setRefPartnerId(partnerId);
        setRefCode(referralCode);
        await fetchReferralReports({ fromDate, toDate, partnerId, referralCode });
        setRefReportModalVisible(true);
    };

    const handleRefReportModalClose = () => {
        setRefReportModalVisible(false);
        // setRefReportModalData(null);
    };
    const handleActive = (referalId: number | string, status: any) => {
        let active;
        if (status === 1 || status === true) active = false;
        else active = true;
        updateActiveStatus({ referalId, status: active });
    };
    const handleEdit = (record: Referral) => {
        setModalData(record);
        setOpenModal(true);
    };
    const handleDelete = () => {
        deleteDoc(modalData!?.id);
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
            title: 'Referral Code',
            sorter: true,
            dataIndex: 'referralCode',
            key: 'referralCode',
        },
        {
            title: 'Contact Person Name',
            sorter: true,
            dataIndex: 'contactPersonName',
            key: 'contactPersonName',
        },
        {
            title: 'Contact Person Phone',
            sorter: true,
            dataIndex: 'contactPersonPhone',
            key: 'contactPersonPhone',
        },
        {
            title: 'Partner Name',
            sorter: true,
            dataIndex: 'partnerName',
            key: 'partnerName',
            render: (partnerName: string) => partnerName || 'N/A',
        },
        {
            title: 'Status',
            sorter: true,
            dataIndex: 'status',
            key: 'status',
            render: (status: any, record: Referral) => (
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
            title: 'Referral Report',
            dataIndex: 'action',
            key: 'action',
            render: (_: any, record: Referral) => (
                <Flex justify="start">
                    <EyeOutlined onClick={() => handleRefReportModalOpen(record)} />
                </Flex>
            ),
        },
        {
            title: 'Actions',
            dataIndex: 'action',
            key: 'action',
            render: (_: any, record: Referral) => (
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
                                    className=" text-brandColor  ml-7"
                                    onClick={() => {
                                        setModalData(record);
                                        setDeleteModal(true);
                                    }}
                                />
                            )}
                        </span>
                    </Tooltip>
                    {/* <EditOutlined onClick={() => handleEdit(record)} />
                    <DeleteOutlined
                        className=" text-brandColor ml-7"
                        onClick={() => {
                            setModalData(record);
                            setDeleteModal(true);
                        }}
                    /> */}
                </Flex>
            ),
        },
    ];

    return (
        <Flex vertical gap={20}>
            <RefferalCodeHeaders
                downloadReport={downloadReport}
                setRefresh={setRefresh}
                handleSearch={updateSearchText}
                searchText={searchText}
                fetchGeneralReferralReports={fetchGeneralReferralReports}
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
                className="text-end pt-7"
                onChange={handlePageChange}
                total={count}
                showSizeChanger={false}
            />
            {openModal && (
                <RefferalCodeModal
                    setRefresh={setRefresh}
                    data={modalData}
                    open={openModal}
                    handleCancel={() => setOpenModal(false)}
                />
            )}
            {refReportModalVisible && (
                <ReferralReportModal
                    isOpen={refReportModalVisible}
                    handleCancel={handleRefReportModalClose}
                    count={refCount || 0}
                    downloadReport={downloadRefReport}
                    refPartnerId={refPartnerId}
                    referralCode={refCode}
                    fetchReferralReports={fetchReferralReports}
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

export default RefferalCode;
