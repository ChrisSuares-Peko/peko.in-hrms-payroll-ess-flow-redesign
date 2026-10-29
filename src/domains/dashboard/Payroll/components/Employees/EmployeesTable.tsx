import { lazy, useState } from 'react';

import type { TableProps } from 'antd';
import '../../assets/styles.css';
import { Col, Row, Table, Pagination, Segmented, Typography } from 'antd';
import { useNavigate } from 'react-router-dom';

import { useAppDispatch } from '@src/hooks/store';
import useDebounce from '@src/hooks/useDebounce';
import { showToast } from '@src/slices/apiSlice';

import EmptyEmployeeTable from './EmptyEmployeeTable';
import { useDeleteEmployeeApi } from '../../hooks/employeeHooks/useDeleteEmployeeApi';
import { Employee, useEmployeeListApi } from '../../hooks/employeeHooks/useEmployeeListApi';
import type { EmploymentStageFilter } from '../../types/types';
import { getEmployeeTableColumns } from '../../utils/onboardEmployee/employeeTableColumns';
import CancelOffboardingModal from '../modals/CancelOffboardingModal';
import OffBoardEmployeeModal from '../modals/OffBoardEmployeeModal';

const ConfirmationModal = lazy(() => import('@components/molecular/modals/ConfirmationModal'));

const STAGE_FILTERS: { value: 'ALL' | EmploymentStageFilter; label: string }[] = [
    { value: 'ALL', label: 'All' },
    { value: 'ON_PROBATION_ALL', label: 'On probation' },
    { value: 'ENDING_IN_30_DAYS', label: 'Ending in 30 days' },
    { value: 'PROBATION_REVIEW_DUE', label: 'Review due' },
    { value: 'CONFIRMED', label: 'Confirmed' },
];

interface EmployeeProps {
    searchText: string;
    employeeStatus: 'active' | 'past';
    offboardReload: boolean;
    setOffboardReload: React.Dispatch<React.SetStateAction<boolean | number>>;
}

const EmployeesTable = ({
    searchText,
    employeeStatus,
    offboardReload,
    setOffboardReload,
}: EmployeeProps) => {
    const [openConfirmationModal, setOpenConfirmationModal] = useState(false);
    const [openOffBoardEmployeeModal, setOpenOffBoardEmployeeModal] = useState(false);
    const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null);
    const [cancelOffboardEmployeeId, setCancelOffboardEmployeeId] = useState<string | null>(null);
    const dispatch = useAppDispatch();
    const [selectedEmployeeId, setSelectedEmployeeId] = useState<string>(); // State variable to store the
    const navigate = useNavigate();
    // Default to alphabetical by name — 'createdAt desc' had no relationship to anything
    // visible in the table (name, employee ID, or join date), making the list order look
    // arbitrary. 'fullName' matches sortMapping's key for personalInformation.fullName
    // (see models/use-cases/employee.js's getAllEmployeesForCorporate) — the same value the
    // Name column's own sorter produces when clicked.
    const [sortField, setSortField] = useState<string>('fullName');
    const [sortOrder, setSortOrder] = useState<string>('asc');
    const debouncedSearch = useDebounce(searchText, 500);
    const [stageFilter, setStageFilter] = useState<'ALL' | EmploymentStageFilter>('ALL');

    const {
        data,
        isLoading: employeeLoader,
        currentPage,
        setCurrentPage,
        count,
        stageCounts,
        refetch,
        setLimit,
    } = useEmployeeListApi({
        employeeStatus,
        offboardReload,
        sortField,
        sortOrder,
        debouncedSearch,
        stage: employeeStatus === 'active' && stageFilter !== 'ALL' ? stageFilter : undefined,
    });

    const { deleteUser, isLoading: isDeleting } = useDeleteEmployeeApi({
        handleCancel: () => setOpenConfirmationModal(false),
    });

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
    // const [selectedIds, setSelectedIds] = useState<string[]>([]);

    const EmployeeListcolumns = getEmployeeTableColumns({
        employeeStatus,
        onDelete: id => {
            setSelectedEmployeeId(id);
            setOpenConfirmationModal(true);
        },
        navigate,
        onOffboard: record => {
            setSelectedEmployee(record);
            setSelectedEmployeeId(record.id);
            setOpenOffBoardEmployeeModal(true);
        },
        onCancelOffboard: record => setCancelOffboardEmployeeId(record.id),
    });

    const handleTableChange: TableProps<Employee>['onChange'] = (
        pagination,
        filters,
        sorter,
        extra
    ) => {
        if (!Array.isArray(sorter) && sorter.order) {
            setSortField(sorter.field as string);
            setSortOrder(sorter.order === 'ascend' ? 'asc' : 'desc');
        }
    };

    const handlePageChange = (page: number, Limit: number) => {
        setCurrentPage(page);
        setLimit(Limit);
    };

    return (
        <Row className="mt-4" gutter={[0, 20]}>
            {employeeStatus === 'active' && (
                <Col span={24}>
                    <Segmented
                        data-testid="employee-stage-filter"
                        value={stageFilter}
                        onChange={value => {
                            setStageFilter(value as 'ALL' | EmploymentStageFilter);
                            setCurrentPage(1);
                        }}
                        options={STAGE_FILTERS.map(({ value, label }) => ({
                            value,
                            label: (
                                <span>
                                    {label}
                                    {stageCounts && (
                                        <Typography.Text className="ml-1 text-xs" style={{ color: '#94A3B8' }}>
                                            {stageCounts[value]}
                                        </Typography.Text>
                                    )}
                                </span>
                            ),
                        }))}
                    />
                </Col>
            )}
            <Col span={24}>
                <Table
                    rowKey={record => record.employeeInformation?.employeeId}
                    columns={EmployeeListcolumns}
                    scroll={{ x: 992 }}
                    dataSource={data}
                    onChange={handleTableChange}
                    pagination={false}
                    style={{ overflow: 'auto' }}
                    locale={{
                        emptyText: !employeeLoader ? <EmptyEmployeeTable /> : null, // Show only when not loading
                    }}
                    loading={employeeLoader}
                />
            </Col>
            <Col span={24}>
                {data.length > 0 && (
                    <Pagination
                        current={currentPage}
                        size="default"
                        className="md:text-end pt-7 xs:text-center"
                        total={count}
                        onChange={handlePageChange}
                        defaultPageSize={10}
                    />
                )}
            </Col>

            <ConfirmationModal
                isOpen={openConfirmationModal}
                handleCancel={() => setOpenConfirmationModal(false)}
                title="Are you sure you want to delete this employee?This action is irreversible and will permanently remove all associated data."
                handleSubmit={() => handleDelete(selectedEmployeeId!)}
                isLoading={isDeleting}
            />
            {openOffBoardEmployeeModal && (
                <OffBoardEmployeeModal
                    open={openOffBoardEmployeeModal}
                    handleCancel={() => setOpenOffBoardEmployeeModal(false)}
                    employeeData={selectedEmployee}
                    setOffboardReload={setOffboardReload}
                />
            )}
            {cancelOffboardEmployeeId && (
                <CancelOffboardingModal
                    employeeId={cancelOffboardEmployeeId}
                    handleCancel={() => setCancelOffboardEmployeeId(null)}
                    onCancelled={() => setOffboardReload(p => !p)}
                />
            )}
        </Row>
    );
};

export default EmployeesTable;
