import { useState, useEffect } from 'react';

import { EditOutlined } from '@ant-design/icons';
import { Flex, Pagination, Tag, Tooltip, Typography } from 'antd';
import { useSearchParams } from 'react-router-dom';

import GenericTable from '@components/atomic/GenericTable';
import { useAppSelector } from '@src/hooks/store';
import useDebounceSearch from '@src/hooks/useDebounceSearch';
import { formattedDateOnly, formattedTime } from '@utils/dateFormat';
import { useFindRolesService } from '@utils/findRolesService';

import ChartOfAccountHeader from './ChartOfAccountHeader';
import ChartOfAccountModal from './ChartOfAccountModal';
import useFilter from '../../hooks/useFilters';
import useGetChartOfAccounts from '../../hooks/useGetChartOfAccounts';
import { ChartofAccount, RolePermissionAccessData } from '../../types/chartofAccount';

const SYNC_STATUS_META: Record<string, { color: string; label: string }> = {
    CREATE_PENDING: { color: 'gold', label: 'Create Pending' },
    CREATE_FAILED: { color: 'red', label: 'Create Failed' },
    CREATE_SUCCESS: { color: 'green', label: 'Created' },
    UPDATE_PENDING: { color: 'gold', label: 'Update Pending' },
    UPDATE_FAILED: { color: 'red', label: 'Update Failed' },
    UPDATE_SUCCESS: { color: 'green', label: 'Updated' },
};

const isPendingStatus = (status: string) =>
    status === 'CREATE_PENDING' || status === 'UPDATE_PENDING';

type ChartOfAccountProps = {
    permissionCategory?: string;
};

const ChartOfAccount = ({ permissionCategory = 'Settings' }: ChartOfAccountProps) => {
    const [searchParams] = useSearchParams();
    const requestedSearch = searchParams.get('search') || '';
    const requestedAccountName = searchParams.get('add');
    const initialValues = {
        searchText: requestedSearch,
        page: 1,
        itemsPerPage: 10,
        sort: 'DESC',
        deviceType: '',
        sortField: '',
    };
    const [filters, setFilters] = useState(initialValues);
    const [openModal, setOpenModal] = useState(false);
    const [modalData, setModalData] = useState<ChartofAccount>();
    const { handlePageChange, handleTableChange } = useFilter({ setFilters });
    const [accessPermission, setAccessPermission] = useState<RolePermissionAccessData>();
    const { services } = useAppSelector(state => state.reducer.services) ?? {};
    const service = useFindRolesService(services?.data, 'Chart of Accounts', permissionCategory);
    useEffect(() => {
        if (service) {
            setAccessPermission(service);
        }
    }, [service]);
    const { searchText, updateSearchText } = useDebounceSearch(setFilters, requestedSearch);
    const { isLoading, tableData, count, setRefresh } = useGetChartOfAccounts(filters);

    const handleEdit = (record: ChartofAccount) => {
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
            title: 'Zoho Account Id',
            sorter: true,
            dataIndex: 'provider_account_id',
            key: 'provider_account_id',
            render: (zohoAccountId: string) => (
                <Flex>
                    <Typography.Text className="w-3/4" style={{ marginRight: '8px' }}>
                        {zohoAccountId}
                    </Typography.Text>
                </Flex>
            ),
        },
        {
            title: 'Account Name',
            sorter: true,
            dataIndex: 'account_name',
            key: 'account_name',
            render: (accountName: string) => (
                <Flex>
                    <Typography.Text className="w-3/4" style={{ marginRight: '8px' }}>
                        {accountName}
                    </Typography.Text>
                </Flex>
            ),
        },
        {
            title: 'Account Type',
            sorter: true,
            dataIndex: 'account_type',
            key: 'account_type',
            render: (accountType: any) => <Typography.Text>{accountType}</Typography.Text>,
        },
        {
            title: 'Account Code',
            dataIndex: 'account_code',
            sorter: true,
            key: 'account_code',
            render: (accountCode: string) => <Typography.Text>{accountCode}</Typography.Text>,
        },
        {
            title: 'Created by',
            dataIndex: 'createdBy',
            sorter: true,
            key: 'createdBy',
            render: (createdBy: string) => (
                <Typography.Text>{createdBy?.toUpperCase()}</Typography.Text>
            ),
        },
        {
            title: 'Description',
            sorter: true,
            dataIndex: 'description',
            key: 'description',
            width: '30%',
        },
        {
            title: 'Sync Status',
            dataIndex: 'syncStatus',
            sorter: true,
            key: 'syncStatus',
            render: (syncStatus: string) => {
                const meta = SYNC_STATUS_META[syncStatus] || {
                    color: 'default',
                    label: syncStatus,
                };
                return <Tag color={meta.color}>{meta.label}</Tag>;
            },
        },
        {
            title: 'Actions',
            dataIndex: 'action',
            key: 'action',
            render: (_: any, record: ChartofAccount) => {
                const pending = isPendingStatus(record.syncStatus);
                const disabled = !accessPermission?.update || pending;
                let tooltipTitle = '';
                if (!accessPermission?.update) {
                    tooltipTitle = 'Sorry, you do not have permission to perform this action';
                } else if (pending) {
                    tooltipTitle = 'This account is still syncing with the accounting provider';
                }
                return (
                    <Flex justify="space-between">
                        <Tooltip placement="top" title={tooltipTitle}>
                            <span>
                                {disabled ? (
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
                );
            },
        },
        {
            title: 'Parent Account Name',
            dataIndex: 'parent_account_name',
            sorter: true,
            key: 'parent_account_name',
            render: (parentAccountName: any) => (
                <Flex vertical>
                    <Typography.Text>{parentAccountName || '-'}</Typography.Text>
                </Flex>
            ),
        },
    ];

    return (
        <Flex vertical gap={20}>
            <ChartOfAccountHeader
                setRefresh={setRefresh}
                handleSearch={updateSearchText}
                searchText={searchText}
                accessPermission={accessPermission}
                addAccountName={requestedAccountName}
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
                <ChartOfAccountModal
                    setRefresh={setRefresh}
                    data={modalData}
                    open={openModal}
                    handleCancel={() => setOpenModal(false)}
                />
            )}
        </Flex>
    );
};

export default ChartOfAccount;
