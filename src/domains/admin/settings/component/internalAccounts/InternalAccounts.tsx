import { useEffect, useState } from 'react';

import { DeleteOutlined } from '@ant-design/icons';
import { Flex, Pagination, Tooltip, Typography } from 'antd';

import GenericTable from '@components/atomic/GenericTable';
import ConfirmationModal from '@components/molecular/modals/ConfirmationModal';
import useFilter from '@src/domains/admin/manage/hooks/useFilters';
import { useAppSelector } from '@src/hooks/store';
import useDebounceSearch from '@src/hooks/useDebounceSearch';
import { useFindRolesService } from '@utils/findRolesService';

import InternalAccountsHeader from './InternalAccountsHeader';
import InternalAccountsModal from './InternalAccountsModal';
import useGetInternalAccounts from '../../hooks/internalAccounts/useGetInternalAccounts';
import { InternalAccount, RolePermissionAccessData } from '../../types/internalAccountsTypes';

type InternalAccountsPageProps = {
    permissionCategory?: string;
};

const InternalAccountsPage = ({ permissionCategory = 'Settings' }: InternalAccountsPageProps) => {
    const initialValues = {
        searchText: '',
        page: 1,
        itemsPerPage: 10,
        sort: 'DESC' as 'ASC' | 'DESC',
        sortField: '',
    };
    const [filters, setFilters] = useState(initialValues);
    const [openModal, setOpenModal] = useState(false);
    const [deleteModal, setDeleteModal] = useState(false);
    const [modalData, setModalData] = useState<InternalAccount>();
    const [accessPermission, setAccessPermission] = useState<RolePermissionAccessData>();
    const { services } = useAppSelector(state => state.reducer.services) ?? {};
    const service = useFindRolesService(services?.data, 'Internal Purchase Accounts', permissionCategory);
    useEffect(() => {
        if (service) {
            setAccessPermission(service);
        }
    }, [service]);
    const { searchText, updateSearchText } = useDebounceSearch(setFilters);
    const { handlePageChange, handleTableChange } = useFilter({ setFilters });
    const { isLoading, tableData, count, setRefresh, deleteFromInternalAccounts } =
        useGetInternalAccounts(filters);

    const handleRefresh = () => setRefresh(prev => !prev);
    const handleDelete = () => {
        if (!modalData) return;
        deleteFromInternalAccounts(modalData.id);
        setDeleteModal(false);
    };

    const columns = [
        {
            title: 'Name',
            sorter: true,
            dataIndex: 'name',
            key: 'name',
            render: (name: string) => <Typography.Text>{name || '-'}</Typography.Text>,
        },
        {
            title: 'User Name',
            sorter: true,
            dataIndex: 'username',
            key: 'username',
            render: (username: string) => <Typography.Text>{username || '-'}</Typography.Text>,
        },
        {
            title: 'Email',
            sorter: true,
            dataIndex: 'email',
            key: 'email',
            render: (email: string) => <Typography.Text>{email || '-'}</Typography.Text>,
        },
        {
            title: 'Role',
            sorter: true,
            dataIndex: 'role',
            key: 'role',
            render: (role: string) => <Typography.Text>{role || '-'}</Typography.Text>,
        },
        {
            title: 'Delete',
            dataIndex: 'id',
            key: 'id',
            render: (_: string, record: InternalAccount) => (
                <Flex justify="space-between" gap={15} className="h-full">
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
                                    className="text-brandColor"
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

    return (
        <Flex vertical gap={20}>
            <InternalAccountsHeader
                handleSearch={updateSearchText}
                searchText={searchText}
                setOpenModal={setOpenModal}
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
                <InternalAccountsModal
                    data={tableData}
                    open={openModal}
                    handleCancel={() => setOpenModal(false)}
                    handleRefresh={handleRefresh}
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

export default InternalAccountsPage;
