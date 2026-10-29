import React, { useState, useEffect, useMemo } from 'react';

import { CheckOutlined, CloseOutlined, DeleteOutlined, EditOutlined } from '@ant-design/icons';
import { Flex, Pagination, Tooltip, Typography } from 'antd';
import { useDispatch } from 'react-redux';
import { ReactSVG } from 'react-svg';

import CopySVG from '@assets/svg/Copy.svg';
import GenericTable from '@components/atomic/GenericTable';
import ConfirmationModal from '@components/molecular/modals/ConfirmationModal';
import { useAppSelector } from '@src/hooks/store';
import useDebounceSearch from '@src/hooks/useDebounceSearch';
import { showToast } from '@src/slices/apiSlice';
import { formattedDateOnly, formattedTime } from '@utils/dateFormat';
import { useFindRolesService } from '@utils/findRolesService';

import CouponCodeHeader from './PekoCreditsHeader';
import PekoCreditsModal from './PekoCreditsModal';
import useGetSubscriptionCoupon from '../../hooks/pekoCredits/useGetPekoCredits';
import useFilter from '../../hooks/useFilters';
import { Coupon, PekoCreditStatus, RolePermissionAccessData } from '../../types/pekoCredits';

const PekoCredits = () => {
    const initialValues = useMemo(
        () => ({
            searchText: '',
            page: 1,
            itemsPerPage: 10,
            sort: 'DESC',
            deviceType: '',
            sortField: '',
        }),
        []
    );
    const dispatch = useDispatch();
    const [accessPermission, setAccessPermission] = useState<RolePermissionAccessData>();
    const { services } = useAppSelector(state => state.reducer.services) ?? {};
    const service = useFindRolesService(services?.data, 'Peko Credits'); // Get the service
    useEffect(() => {
        if (service) {
            setAccessPermission(service); // Update state if service is found
        }
    }, [service]);
    const [filters, setFilters] = useState(initialValues);

    // Memoize the filters object passed to the hook
    const stableFilters = useMemo(
        () => filters,
        // eslint-disable-next-line react-hooks/exhaustive-deps
        [
            filters.searchText,
            filters.page,
            filters.itemsPerPage,
            filters.sort,
            filters.deviceType,
            filters.sortField,
        ]
    );

    const [openModal, setOpenModal] = useState(false);
    const [openDeleteModal, setOpenDeleteModal] = useState(false);
    const [modalData, setModalData] = useState<Coupon>();
    const { handlePageChange, handleTableChange } = useFilter({ setFilters });

    const [statusUpdateConfirmationOpen, setStatusUpdateConfirmationOpen] =
        useState<boolean>(false);
    const [statusChangeModalData, setStatusChangeModalData] = useState<any>({
        couponId: '',
        status: '',
    });

    // Staging-only bulk switch: holds the status the admin asked to apply to
    // every credit until they confirm it.
    const [pendingBulkStatus, setPendingBulkStatus] = useState<PekoCreditStatus | null>(null);

    const { searchText, updateSearchText } = useDebounceSearch(setFilters);
    const {
        isLoading,
        tableData,
        updateActiveStatus,
        bulkUpdateActiveStatus,
        handleDeleteCoupon,
        count,
        setRefresh,
    } = useGetSubscriptionCoupon(stableFilters);

    const handleBulkStatusUpdate = () => {
        if (!pendingBulkStatus) return;
        bulkUpdateActiveStatus(pendingBulkStatus);
        setPendingBulkStatus(null);
    };

    const handleActive = () => {
        const { couponId, status } = statusChangeModalData;
        let active;
        if (status === 'ACTIVE') active = 'DISABLED';
        else active = 'ACTIVE';
        updateActiveStatus({ couponId, status: active });
        setStatusUpdateConfirmationOpen(false);
    };

    const handleEdit = (record: Coupon) => {
        setModalData(record);
        setOpenModal(true);
    };

    const openDeleteConfirmationModal = (record: Coupon) => {
        setModalData(record);
        setOpenDeleteModal(true);
    };

    const handleDelete = () => {
        if (modalData) {
            handleDeleteCoupon(modalData.id);
            setOpenDeleteModal(false);
        }
    };

    const handleCopyClick = (text: string) => {
        navigator.clipboard.writeText(text);
        return dispatch(
            showToast({
                description: 'Subscription coupon code copied to clipboard',
                variant: 'success',
            })
        );
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
            title: 'Coupon Code',
            sorter: true,
            dataIndex: 'code',
            key: 'code',
            render: (code: string) => (
                <Flex>
                    <Typography.Text className="w-3/4 " style={{ marginRight: '8px' }}>
                        {code}
                    </Typography.Text>
                    <ReactSVG
                        className="w-1/4 cursor-pointer ms-1"
                        src={CopySVG}
                        onClick={e => {
                            e.stopPropagation(); // Prevent row expansion why clicking on copy icon
                            handleCopyClick(code);
                        }}
                    />
                </Flex>
            ),
        },
        {
            title: 'Coupon Type',
            sorter: true,
            dataIndex: 'couponType',
            key: 'couponType',
        },
        {
            title: 'Referral Code',
            dataIndex: 'referralCode',
            sorter: true,
            key: 'referralCode',
            render: (referralCode : string, data: any) => (
                <Flex vertical>
                    <Typography.Text>{referralCode  || 'N/A'}</Typography.Text>
                </Flex>
            ),
        },
        {
            title: 'Partner Name',
            dataIndex: 'partnerName',
            sorter: true,
            key: 'partnerName',
            render: (partnerName: string, data: any) => (
                <Flex vertical>
                    <Typography.Text>{partnerName || 'N/A'}</Typography.Text>
                </Flex>
            ),
        },
        {
            title: 'Package Name',
            dataIndex: 'packageName',
            sorter: true,
            key: 'packageName',
            render: (packageName: string, data: any) => (
                <Flex vertical>
                    <Typography.Text>{packageName || 'N/A'}</Typography.Text>
                </Flex>
            ),
        },
        {
            title: 'Service',
            dataIndex: 'serviceProvider',
            sorter: true,
            key: 'serviceProvider',
            render: (serviceProvider: any) => (
                <Flex vertical>
                    <Typography.Text>{serviceProvider || 'N/A'}</Typography.Text>
                </Flex>
            ),
        },
        {
            title: 'Discount Type',
            sorter: true,
            dataIndex: 'discountType',
            key: 'discountType',
            render: (discountType: any) => <Typography.Text>{discountType}</Typography.Text>,
        },
        {
            title: 'Discount',
            dataIndex: 'discount',
            sorter: true,
            key: 'discount',
            render: (discount: string, data: any) => (
                <Typography.Text>
                    {data.discountType === 'PERCENTAGE'
                        ? `${Number(discount)} %`
                        : `₹ ${discount}`}
                </Typography.Text>
            ),
        },
        {
            title: 'Expiry Days',
            dataIndex: 'expiryDays',
            sorter: true,
            key: 'expiryDays',
            render: (expiryDays: any) => (
                <Flex vertical>
                    <Typography.Text>
                        {expiryDays === 1 ? `${expiryDays} Day` : `${expiryDays} Days`}
                    </Typography.Text>
                </Flex>
            ),
        },
        {
            title: 'Minimum Purhcase',
            dataIndex: 'minimumPurchase',
            sorter: true,
            key: 'minimumPurchase',
            render: (minimumPurchase: number) => (
                <Typography.Text> ₹ {minimumPurchase}</Typography.Text>
            ),
        },
        {
            title: 'Maximum Discount',
            dataIndex: 'maximumDiscount',
            sorter: true,
            key: 'maximumDiscount',
            render: (maximumDiscount: number) => (
                <Typography.Text>
                    {' '}
                    {maximumDiscount ? `₹ ${maximumDiscount}` : 'N/A'}
                </Typography.Text>
            ),
        },
        {
            title: 'Package Billing Type',
            sorter: true,
            dataIndex: 'billingType',
            key: 'billingType',
            render: (billingType: any) => (
                <Typography.Text>{billingType ? billingType.toLowerCase() : 'N/A'}</Typography.Text>
            ),
        },
        {
            title: 'Valid Untill',
            dataIndex: 'validUntil',
            key: 'validUntil',
            render: (validUntil: string) => (
                <Typography.Text>{formattedDateOnly(new Date(validUntil))}</Typography.Text>
            ),
        },
        {
            title: 'Status',
            dataIndex: 'status',
            sorter: true,
            key: 'status',
            render: (status: any, record: Coupon) => (
                <Tooltip
                    placement="top"
                    title={
                        !accessPermission?.update
                            ? 'Sorry, you do not have permission to perform this action'
                            : ''
                    }
                >
                    <span>
                        {status === 'ACTIVE' ? (
                            <CheckOutlined
                                className={`cursor-pointer ${
                                    accessPermission?.update ? 'text-textLime' : 'text-gray-400'
                                }`}
                                style={{
                                    cursor: accessPermission?.update ? 'pointer' : 'not-allowed',
                                }}
                                onClick={() => {
                                    if (accessPermission?.update) {
                                        setStatusChangeModalData({
                                            couponId: record.id,
                                            status: record.status,
                                        });
                                        setStatusUpdateConfirmationOpen(true);
                                    }
                                }}
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
                                onClick={() => {
                                    if (accessPermission?.update) {
                                        setStatusChangeModalData({
                                            couponId: record.id,
                                            status: record.status,
                                        });
                                        setStatusUpdateConfirmationOpen(true);
                                    }
                                }}
                                disabled={!accessPermission?.update}
                            />
                        )}
                    </span>
                </Tooltip>
            ),
            // status === 'ACTIVE' ? (
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
            render: (_: any, record: Coupon) => (
                <Flex justify="space-between" className="gap-5">
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
                                <DeleteOutlined
                                    className=" text-brandColor"
                                    onClick={() => {
                                        openDeleteConfirmationModal(record);
                                    }}
                                />
                            )}
                        </span>
                    </Tooltip>
                    {/* <EditOutlined onClick={() => handleEdit(record)} />
                    <DeleteOutlined onClick={() => openDeleteConfirmationModal(record)} /> */}
                </Flex>
            ),
        },
    ];

    return (
        <Flex vertical gap={20}>
            <CouponCodeHeader
                setRefresh={setRefresh}
                handleSearch={updateSearchText}
                searchText={searchText}
                accessPermission={accessPermission}
                onBulkStatusChange={setPendingBulkStatus}
            />
            <GenericTable
                rowKey={record => record.id}
                columns={columns}
                dataSource={tableData}
                pagination={false}
                loading={isLoading}
                onChange={handleTableChange}
                rowExpandable
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
                <PekoCreditsModal
                    setRefresh={setRefresh}
                    data={modalData}
                    open={openModal}
                    handleCancel={() => setOpenModal(false)}
                />
            )}
            {openDeleteModal && modalData && (
                <ConfirmationModal
                    handleSubmit={handleDelete}
                    handleCancel={() => setOpenDeleteModal(false)}
                    isOpen={openDeleteModal}
                    title="Do you want to proceed with the deletion?"
                    isLoading={false}
                />
            )}

            {statusUpdateConfirmationOpen && (
                <ConfirmationModal
                    handleSubmit={handleActive}
                    handleCancel={() => setStatusUpdateConfirmationOpen(false)}
                    isOpen={statusUpdateConfirmationOpen}
                    title="Do you want to proceed with changing the status?"
                    isLoading={isLoading}
                />
            )}

            {pendingBulkStatus && (
                <ConfirmationModal
                    handleSubmit={handleBulkStatusUpdate}
                    handleCancel={() => setPendingBulkStatus(null)}
                    isOpen={!!pendingBulkStatus}
                    title={`Do you want to ${
                        pendingBulkStatus === 'ACTIVE' ? 'enable' : 'disable'
                    } all peko credits?`}
                    description={
                        pendingBulkStatus === 'ACTIVE'
                            ? 'This applies to every peko credit, not just this page. Expired credits stay disabled.'
                            : 'This applies to every peko credit, not just this page.'
                    }
                    isLoading={isLoading}
                />
            )}
        </Flex>
    );
};

export default PekoCredits;
