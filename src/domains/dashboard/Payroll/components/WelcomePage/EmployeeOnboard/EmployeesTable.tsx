import { lazy, useState } from 'react';

import type { TableColumnsType, TableProps } from 'antd';
import { Col, Flex, Row, Typography, Table, Avatar, Pagination } from 'antd';
import moment from 'moment';
import { useNavigate } from 'react-router-dom';

import { useAppDispatch } from '@src/hooks/store';
import useDebounce from '@src/hooks/useDebounce';
import { paths } from '@src/routes/paths';
import { showToast } from '@src/slices/apiSlice';

import { useDeleteEmployeeApi } from '../../../hooks/employeeHooks/useDeleteEmployeeApi';
import { useEmployeeListApi } from '../../../hooks/employeeHooks/useEmployeeListApi';
import { Employee } from '../../../types/types';
import ViewMore from '../../ViewMore';

const ConfirmationModal = lazy(() => import('@components/molecular/modals/ConfirmationModal'));

interface EmployeeProps {
    searchText: string;
    setActiveTabKey: (key: any) => void;
}

const EmployeesTable = ({ searchText, setActiveTabKey }: EmployeeProps) => {
    const dispatch = useAppDispatch();
    const [openConfirmationModal, setOpenConfirmationModal] = useState(false);
    const [selectedEmployeeId, setSelectedEmployeeId] = useState<string>();
    const navigate = useNavigate();
    const [sortField, setSortField] = useState<string>('dateOfJoin');
    const [sortOrder, setSortOrder] = useState<string>('desc');
    const debouncedSearch = useDebounce(searchText, 500);
    const employeeStatus = 'active';
    const {
        data,
        isLoading: employeeLoader,
        currentPage,
        setCurrentPage,
        count,
        refetch,
        setLimit,
    } = useEmployeeListApi({
        employeeStatus,
        sortField,
        sortOrder,
        debouncedSearch,
    });

    const { deleteUser, isLoading: isDeleting } = useDeleteEmployeeApi({
        handleCancel: () => setOpenConfirmationModal(false),
    });

    function getInitials(name: string): string {
        const words = name.split(' ');
        const initials = words
            .map(word => word.charAt(0))
            .join('')
            .substring(0, 3)
            .toUpperCase();
        return initials;
    }

    const handleDelete = async (employeeId: string) => {
        try {
            setSelectedEmployeeId(employeeId);
            setOpenConfirmationModal(true);

            await deleteUser(employeeId);
            refetch();
            dispatch(
                showToast({ variant: 'success', description: 'Employee deleted successsfully' })
            );
        } catch (error) {
            dispatch(
                showToast({
                    variant: 'error',
                    description: 'Failed to delete the employee. Please try again later.',
                })
            );
        }
    };

    const formatText = (text: string | number) => {
        if (!text) return '';
        const stringText = String(text);
        return stringText.charAt(0).toUpperCase() + stringText.slice(1).toLowerCase();
    };

    const EmployeeListcolumns: TableColumnsType<Employee> = [
        {
            title: 'Name',
          dataIndex: ['personalInformation', 'fullName'],
          sorter: true,
            render: (text: string, record: Employee) => (
                <Flex gap={10}>
                    <Flex
                        align="center"
                        onClick={() => {
                            navigate(
                                `${paths.payroll.employees}/${paths.payroll.employeeProfile}`,
                                {
                                    state: {
                                        employeeId: record.id,
                                    },
                                }
                            );
                        }}
                    >
                        {record.profileImage ? (
                            <Avatar
                                src={record.profileImage}
                                style={{ backgroundColor: '#fde3cf', color: '#f56a00' }}
                            />
                        ) : (
                            <Avatar style={{ backgroundColor: '#fde3cf', color: 'red' }}>
                                 {text ? getInitials(text) : 'N/A'}
                            </Avatar>
                        )}
                    </Flex>
                    <Flex
                        vertical
                        justify="center"
                        onClick={() => {
                            navigate(
                                `${paths.payroll.employees}/${paths.payroll.employeeProfile}`,
                                {
                                    state: { employeeId: record.id },
                                }
                            );
                        }}
                        style={{ cursor: 'pointer' }}
                    >
                        <Typography.Text className="font-normal">{text}</Typography.Text>
                        <Typography.Text className="font-normal">
                            {record.personalInformation.email}
                        </Typography.Text>
                    </Flex>
                </Flex>
            ),
        },
        {
            title: 'Employee ID',
            dataIndex: ['employeeInformation', 'employeeId'],
            sorter: true,
            render: (text: string) => (
                <Typography.Text className="text-gray-900 font-normal">{text}</Typography.Text>
            ),
        },
        {
            title: 'Designation',
            dataIndex: ['employeeInformation', 'designation'],
            render: (_, record: Employee) => (
                <Typography.Text className="text-gray-900 font-normal">
                    {record?.employeeInformation?.designation || 'N/A'}
                </Typography.Text>
            ),
        },
        {
            title: 'Join Date',
            sorter: true,
            dataIndex: ['employeeInformation', 'dateOfJoin'],
            render: (text: string) => moment(text).format('YYYY-MM-DD'),
        },

        {
            title: 'Status',
            dataIndex: ['employeeInformation', 'employeeStatus'],
            render: status => {
                let colorClass = '';
                if (status === 'ACTIVE') {
                    colorClass = 'text-[#05BE63] bg-[#DDFFE2]';
                } else if (status === 'SUSPENDED' || status === 'RESIGNED') {
                    colorClass = 'text-[#FDA700] bg-[#FFFBE4]';
                }
                const formattedStatus = formatText(status);
                return (
                    <span
                        className={`${colorClass} font-normal px-3 py-1 rounded-2xl -ml-[.125rem]`}
                    >
                        {formattedStatus}
                    </span>
                );
            },
        },
        {
            title: 'Mobile Number',
            dataIndex: ['personalInformation', 'mobileNo'],
        },
        {
            title: '',
            dataIndex: 'id',
            render: (_, record: Employee) => {
                const list = [
                    {
                        label: 'Update Profile',
                        path: `${paths.payroll.employees}/${paths.payroll.employeeProfile}`,
                        id: record.id,
                    },
                    {
                        label: 'Remove Profile',
                        action: () => {
                            setSelectedEmployeeId(record.id);
                            setOpenConfirmationModal(true);
                        },
                    },
                ];
                return <ViewMore list={list} />;
            },
        },
    ];

    const handleTableChange: TableProps<Employee>['onChange'] = (
        _pagination,
        _filters,
        sorter
    ) => {
        if (!Array.isArray(sorter) && sorter.order) {
            setSortField(sorter.field as string);
            setSortOrder(sorter.order === 'ascend' ? 'asc' : 'desc');
        }
    };

    const handlePageChange = (page: number, limit: number) => {
        setCurrentPage(page);
        setLimit(limit);
    };

    return (
        <Row className="mt-4" gutter={[0, 20]}>
            <Col span={24}>
                <Table
                    rowKey={record => record.employeeInformation?.employeeId}
                    columns={EmployeeListcolumns}
                    scroll={{ x: 992 }}
                    dataSource={data}
                    onChange={handleTableChange}
                    pagination={false}
                    style={{ overflow: 'auto' }}
                    loading={employeeLoader}
                />
            </Col>
            <Col span={24}>
                {data.length > 0 && (
                    <Flex className="mt-4" justify="end">
                        <Pagination
                            current={currentPage}
                            size="default"
                            total={count}
                            onChange={handlePageChange}
                            defaultPageSize={10}
                        />
                    </Flex>
                )}
            </Col>

            <ConfirmationModal
                isOpen={openConfirmationModal}
                handleCancel={() => setOpenConfirmationModal(false)}
                title="Are you sure you want to delete this employee? This action is irreversible and will permanently remove all associated data."
                handleSubmit={() => handleDelete(selectedEmployeeId!)}
                isLoading={isDeleting}
            />
        </Row>
    );
};

export default EmployeesTable;
