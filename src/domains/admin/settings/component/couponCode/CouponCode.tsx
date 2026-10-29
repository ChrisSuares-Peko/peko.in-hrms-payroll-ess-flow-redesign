import React, { useState, useEffect } from 'react';

import { CheckOutlined, CloseOutlined, EditOutlined } from '@ant-design/icons';
import { Flex, Pagination, Tooltip, Typography } from 'antd';
import { useDispatch } from 'react-redux';
import { ReactSVG } from 'react-svg';

import CopySVG from '@assets/svg/Copy.svg';
import GenericTable from '@components/atomic/GenericTable';
import { useAppSelector } from '@src/hooks/store';
import useDebounceSearch from '@src/hooks/useDebounceSearch';
import { showToast } from '@src/slices/apiSlice';
import { formattedDateOnly, formattedTime } from '@utils/dateFormat';
import { useFindRolesService } from '@utils/findRolesService';

import CouponCodeHeader from './CouponCodeHeader';
import CouponCodeModal from './CouponCodeModal';
import useFilter from '../../hooks/useFilters';
import useGetCouponCodes from '../../hooks/useGetCouponCode';
import { Coupon, RolePermissionAccessData } from '../../types/couponCode';

const CouponCode = () => {
    const initialValues = {
        searchText: '',
        page: 1,
        itemsPerPage: 10,
        sort: 'DESC',
        deviceType: '',
        sortField: '',
    };
    const dispatch = useDispatch();
    const [filters, setFilters] = useState(initialValues);
    const [openModal, setOpenModal] = useState(false);
    const [modalData, setModalData] = useState<Coupon>();
    const { handlePageChange, handleTableChange } = useFilter({ setFilters });
    const [accessPermission, setAccessPermission] = useState<RolePermissionAccessData>();
    const { services } = useAppSelector(state => state.reducer.services) ?? {};
    const service = useFindRolesService(services?.data, 'Coupon Code'); // Get the service
    useEffect(() => {
        if (service) {
            setAccessPermission(service); // Update state if service is found
        }
    }, [service]);
    const { searchText, updateSearchText } = useDebounceSearch(setFilters);
    const { isLoading, tableData, updateActiveStatus, count, setRefresh, downloadReport } =
        useGetCouponCodes(filters);

    const handleActive = (couponId: number | string, status: any) => {
        let active;
        if (status === 1 || status === true) active = false;
        else active = true;
        updateActiveStatus({ couponId, status: active });
    };

    const handleEdit = (record: Coupon) => {
        setModalData(record);
        setOpenModal(true);
    };

    const handleCopyClick = (text: string) => {
        navigator.clipboard.writeText(text);
        return dispatch(
            showToast({
                description: 'Coupon code copied to clipboard',
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
            dataIndex: 'couponCode',
            key: 'couponCode',
            render: (couponCode: string) => (
                <Flex>
                    <Typography.Text className="w-3/4 " style={{ marginRight: '8px' }}>
                        {couponCode}
                    </Typography.Text>
                    <ReactSVG
                        className="w-1/4 cursor-pointer ms-1"
                        src={CopySVG}
                        onClick={() => handleCopyClick(couponCode)}
                    />
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
                    {data.discountType === 'PERCENTAGE' ? `${Number(discount)} %` : `₹ ${discount}`}
                </Typography.Text>
            ),
        },
         {
            title: 'Partner Name',
            dataIndex: 'partnerName',
            sorter: true,
            key: 'partnerName',
            render: (partnerName: string) => (
                <Typography.Text>{partnerName || 'N/A'}</Typography.Text>
            ),
        },
        {
            title: 'Referral Code',
            dataIndex: 'referralCode',
            sorter: true,
            key: 'referralCode',
            render: (referralCode: string) => (
                <Typography.Text>{referralCode || 'N/A'}</Typography.Text>
            ),
        },
         {
            title: 'Service',
            dataIndex: 'serviceOperatorName',
            sorter: true,
            key: 'serviceOperatorName',
            render: (serviceOperatorName: string) => (
                <Typography.Text>{serviceOperatorName || 'N/A'}</Typography.Text>
            ),
        },
         {
            title: 'Package Name',
            dataIndex: 'packageName',
            sorter: true,
            key: 'packageName',
            render: (packageName: string) => (
                <Typography.Text>{packageName || 'N/A'}</Typography.Text>
            ),
        },
        {
            title: 'Billing Type',
            dataIndex: 'billingType',
            sorter: true,
            key: 'billingType',
            render: (billingType: string) => (
                <Typography.Text>{billingType || 'N/A'}</Typography.Text>
            ),
        },
         {
            title: 'Minimum Purchase',
            dataIndex: 'minimumPurchase',
            sorter: true,
            key: 'minimumPurchase',
            render: (minimumPurchase: string | null) => (
                <Typography.Text>
                    {minimumPurchase != null ? `₹ ${minimumPurchase}` : 'N/A'}
                </Typography.Text>
            ),
        },
        {
            title: 'Maximum Discount',
            dataIndex: 'maximumDiscount',
            sorter: true,
            key: 'maximumDiscount',
            render: (maximumDiscount: string | null) => (
                <Typography.Text>
                    {maximumDiscount != null ? `₹ ${maximumDiscount}` : 'N/A'}
                </Typography.Text>
            ),
        },
        {
            title: 'Usage Count',
            dataIndex: 'usageCount',
            sorter: true,
            key: 'usageCount',
            render: (usageCount: string) => (
                <Flex vertical>
                    <Typography.Text>{usageCount || 'N/A'}</Typography.Text>
                </Flex>
            ),
        },
        {
            title: 'Valid From',
            dataIndex: 'validFrom',
            sorter: true,
            key: 'validFrom',
            render: (validFrom: any) => (
                <Flex vertical>
                    <Typography.Text>{formattedDateOnly(new Date(validFrom))}</Typography.Text>
                </Flex>
            ),
        },
        {
            title: 'Valid To',
            dataIndex: 'validTo',
            sorter: true,
            key: 'validTo',
            render: (validTo: any) => (
                <Flex vertical>
                    <Typography.Text>{formattedDateOnly(new Date(validTo))}</Typography.Text>
                </Flex>
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
            title: 'Actions',
            dataIndex: 'action',
            key: 'action',
            render: (_: any, record: Coupon) => (
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
            <CouponCodeHeader
                setRefresh={setRefresh}
                handleSearch={updateSearchText}
                searchText={searchText}
                accessPermission={accessPermission}
                handleDownloadReport={downloadReport}
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
                <CouponCodeModal
                    setRefresh={setRefresh}
                    data={modalData}
                    open={openModal}
                    handleCancel={() => setOpenModal(false)}
                />
            )}
        </Flex>
    );
};

export default CouponCode;
