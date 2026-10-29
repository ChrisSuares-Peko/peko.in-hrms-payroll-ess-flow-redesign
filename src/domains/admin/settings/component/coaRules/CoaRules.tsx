import { useState, useEffect } from 'react';

import { CheckOutlined, CloseOutlined, EditOutlined } from '@ant-design/icons';
import { Flex, Pagination, Tooltip, Typography } from 'antd';

import GenericTable from '@components/atomic/GenericTable';
import { useAppSelector } from '@src/hooks/store';
import useDebounceSearch from '@src/hooks/useDebounceSearch';
import { formattedDateOnly, formattedTime } from '@utils/dateFormat';
import { useFindRolesService } from '@utils/findRolesService';

import CoaRulesHeader from './CoaRulesHeader';
import CoaRulesModal from './CoaRulesModal';
import useFilter from '../../hooks/useFilters';
import useGetRules from '../../hooks/useGetCoaRules';
import { RolePermissionAccessData } from '../../types/chartofAccount';
import { COArules } from '../../types/coaRules';

const CoaRules = () => {
    const initialValues = {
        searchText: '',
        page: 1,
        itemsPerPage: 10,
        sort: 'DESC',
        deviceType: '',
        sortField: '',
    };
    const [filters, setFilters] = useState(initialValues);
    const [openModal, setOpenModal] = useState(false);
    const [modalData, setModalData] = useState<COArules>();
    const { handlePageChange, handleTableChange } = useFilter({ setFilters });
    const [accessPermission, setAccessPermission] = useState<RolePermissionAccessData>();
    const { services } = useAppSelector(state => state.reducer.services) ?? {};
    const service = useFindRolesService(services?.data, 'COA Rules', 'Settings');
    useEffect(() => {
        if (service) {
            setAccessPermission(service);
        }
    }, [service]);
    const { searchText, updateSearchText } = useDebounceSearch(setFilters);
    const { isLoading, tableData, count, setRefresh, updateActiveStatus } = useGetRules(filters);

    const handleActive = (ruleId: number | string, status: any) => {
        let active;
        if (status === 1 || status === true) active = false;
        else active = true;
        updateActiveStatus({ ruleId, status: active });
    };

    const handleEdit = (record: COArules) => {
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
            title: 'Entity Type',
            sorter: true,
            dataIndex: 'entityType',
            key: 'entityType',
            render: (entityType: string) => (
                <Flex>
                    <Typography.Text className="w-3/4 " style={{ marginRight: '8px' }}>
                        {entityType}
                    </Typography.Text>
                </Flex>
            ),
        },
        {
            title: 'Prefix',
            sorter: true,
            dataIndex: 'prefix',
            key: 'prefix',
            render: (prefix: string) => (
                <Flex>
                    <Typography.Text className="w-3/4 " style={{ marginRight: '8px' }}>
                        {prefix}
                    </Typography.Text>
                </Flex>
            ),
        },
        {
            title: 'Account Type',
            sorter: true,
            dataIndex: 'accountType',
            key: 'accountType',
            render: (accountType: any) => <Typography.Text>{accountType}</Typography.Text>,
        },
        {
            title: 'Description',
            sorter: true,
            dataIndex: 'description',
            key: 'description',
            width: '40%',
        },
        {
            title: 'Parent Account Id',
            dataIndex: 'parentAccountId',
            sorter: true,
            key: 'parentAccountId',
            render: (parentAccountId: any) => (
                <Flex vertical>
                    <Typography.Text>{parentAccountId || '-'}</Typography.Text>
                </Flex>
            ),
        },
        {
            title: 'Status',
            dataIndex: 'isActive',
            sorter: true,
            key: 'isActive',
            render: (isActive: any, record: COArules) => (
                <Tooltip
                    placement="top"
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
                                    handleActive(record.id, record.isActive)
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
                                    handleActive(record.id, record.isActive)
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
            render: (_: any, record: COArules) => (
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
            <CoaRulesHeader
                setRefresh={setRefresh}
                handleSearch={updateSearchText}
                searchText={searchText}
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
                <CoaRulesModal
                    setRefresh={setRefresh}
                    data={modalData}
                    open={openModal}
                    handleCancel={() => setOpenModal(false)}
                />
            )}
        </Flex>
    );
};

export default CoaRules;
