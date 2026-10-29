import { useState, useEffect } from 'react';

import { CheckOutlined, CloseOutlined, DeleteOutlined, EditOutlined } from '@ant-design/icons';
import { Badge, Flex, Tooltip, Typography } from 'antd';
import { ReactSVG } from 'react-svg';

import CopySVG from '@assets/svg/Copy.svg';
import { useAppDispatch, useAppSelector } from '@src/hooks/store';
import useDebounceSearch from '@src/hooks/useDebounceSearch';
import { showToast } from '@src/slices/apiSlice';
import { formattedDateOnly, formattedTime } from '@utils/dateFormat';
import { useFindRolesService } from '@utils/findRolesService';

import useGetCodes from './useGetCodes';
import { SubscriptionCode, RolePermissionAccessData } from '../../types/subscriptionCodes';
import { maskActivationCode } from '../../utils';

export default function useSubscriptionCodeTable() {
    const dispatch = useAppDispatch();
    const [modalData, setModalData] = useState<SubscriptionCode>();
    const [openModal, setOpenModal] = useState(false);
    const [deleteModal, setDeleteModal] = useState(false);
    const [accessPermission, setAccessPermission] = useState<RolePermissionAccessData>();
    const { services } = useAppSelector(state => state.reducer.services) ?? {};
    const service = useFindRolesService(services?.data, 'Subscription Codes'); // Get the service
    useEffect(() => {
        if (service) {
            setAccessPermission(service); // Update state if service is found
        }
    }, [service]);

    const initialValues = {
        searchText: '',
        page: 1,
        itemsPerPage: 10,
        sort: 'DESC',
        sortField: '',
        partnerId: '',
    };
    const [filters, setFilters] = useState(initialValues);
    const { searchText, updateSearchText } = useDebounceSearch(setFilters);
    const { updateActiveStatus, tableData, count, isLoading, setRefresh, downloadReport } =
        useGetCodes(filters);

    const handleCopyClick = (text: string) => {
        navigator.clipboard.writeText(text);
        return dispatch(
            showToast({
                description: 'Activation code copied to clipboard',
                variant: 'success',
            })
        );
    };
    const handleEdit = (record: SubscriptionCode) => {
        setModalData(record);
        setOpenModal(true);
    };
    const handleActive = (rowId: number, status: boolean) => {
        const active = !status;
        updateActiveStatus(rowId, active);
    };
    const closeDeleteModal = () => setDeleteModal(false);
    const closeFormModal = () => setOpenModal(false);

    const columns = [
        {
            title: 'Date',
            dataIndex: 'createdAt',
            sorter: true,
            key: 'createdAt',
            render: (createdAt: string) => (
                <Flex vertical>
                    <Typography.Text>{formattedDateOnly(new Date(createdAt))}</Typography.Text>
                    <Typography.Text>{formattedTime(new Date(createdAt))}</Typography.Text>
                </Flex>
            ),
        },
        {
            title: 'Activation Code',
            sorter: true,
            dataIndex: 'activationCode',
            key: 'activationCode',
            render: (activationCode: string) => (
                <Flex>
                    <Typography.Text className="w-3/4 " style={{ marginRight: '8px' }}>
                        {maskActivationCode(activationCode)}
                    </Typography.Text>
                    <ReactSVG
                        className="ms-1 cursor-pointer w-1/4"
                        src={CopySVG}
                        onClick={() => handleCopyClick(activationCode)}
                    />
                </Flex>
            ),
        },
        {
            title: 'Package Name',
            sorter: true,
            dataIndex: 'packageName',
            key: 'packageName',
        },
        {
            title: 'Billing type',
            sorter: true,
            dataIndex: 'billingType',
            key: 'billingType',
        },
        {
            title: 'Redeemed',
            sorter: true,
            dataIndex: 'isUsed',
            key: 'isUsed',
            render: (isUsed: boolean) =>
                isUsed ? (
                    <Badge
                        status="error"
                        text="Yes"
                        className="px-2 rounded-2xl"
                        style={{ backgroundColor: '#FFF2EA', color: '#F15046' }}
                    />
                ) : (
                    <Badge
                        status="success"
                        text="No"
                        className="px-2 rounded-2xl"
                        style={{ backgroundColor: '#ECFDF3', color: '#027A48' }}
                    />
                ),
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
            dataIndex: 'status',
            sorter: true,
            key: 'status',
            render: (status: boolean, record: SubscriptionCode) => (
                <Tooltip
                    placement="top"
                    title={
                        !accessPermission?.update
                            ? 'Sorry, you do not have permission to perform this action'
                            : ''
                    }
                >
                    <span>
                        {status ? (
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
            //     <CheckOutlined
            //         className="cursor-pointer text-textLime"
            //         onClick={() => handleActive(record.id, record.status)}
            //     />
            // ) : (
            //     <CloseOutlined
            //         className="cursor-pointer text-brandColor"
            //         onClick={() => handleActive(record.id, record.status)}
            //     />
            // ),
        },
        {
            title: 'Actions',
            dataIndex: 'action',
            key: 'action',
            render: (_: any, record: SubscriptionCode) => (
                <Flex justify="space-between" gap={20}>
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
                                <EditOutlined
                                    onClick={() => {
                                        if (record.isUsed) {
                                            return dispatch(
                                                showToast({
                                                    description:
                                                        'Unable to update. Activation code is already used.',
                                                    variant: 'error',
                                                })
                                            );
                                        }
                                        handleEdit(record);
                                        return 1;
                                    }}
                                />
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
                                <DeleteOutlined
                                    className=" text-brandColor"
                                    onClick={() => {
                                        setModalData(record);
                                        setDeleteModal(true);
                                    }}
                                />
                            )}
                        </span>
                    </Tooltip>
                </Flex>
            ),
        },
    ];

    return {
        columns,
        filters,
        setFilters,
        modalData,
        openModal,
        closeFormModal,
        deleteModal,
        closeDeleteModal,
        tableData,
        count,
        isLoading,
        setRefresh,
        searchText,
        updateSearchText,
        accessPermission,
        downloadReport,
    };
}
