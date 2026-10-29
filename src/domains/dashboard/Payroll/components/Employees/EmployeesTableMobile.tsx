import { lazy, useState } from 'react';

import { Skeleton, Col, Flex, Row, Pagination, Card, Empty, Checkbox } from 'antd';
import '../../assets/styles.css';

import { useAppDispatch } from '@src/hooks/store';
import useDebounce from '@src/hooks/useDebounce';
import { showToast } from '@src/slices/apiSlice';

import EmployeecardMobile from './EmployeecardMobile';
import { useDeleteEmployeeApi } from '../../hooks/employeeHooks/useDeleteEmployeeApi';
import { useEmployeeListApi } from '../../hooks/employeeHooks/useEmployeeListApi';

const ConfirmationModal = lazy(() => import('@components/molecular/modals/ConfirmationModal'));

interface EmployeeProps {
    searchText: string;
    employeeStatus: 'active' | 'past';

    offboardReload: boolean;
}

const EmployeesTableMobile = ({
    searchText,
    employeeStatus,

    offboardReload,
}: EmployeeProps) => {
    const [openConfirmationModal, setOpenConfirmationModal] = useState(false);
    const dispatch = useAppDispatch();
    const [selectedEmployeeId, setSelectedEmployeeId] = useState<string>(); // State variable to store the
    // Default to alphabetical by name — see EmployeesTable.tsx's identical default for why.
    const [sortField] = useState<string>('fullName');
    const [sortOrder] = useState<string>('asc');
    const debouncedSearch = useDebounce(searchText, 500);
    const {
        data,
        isLoading: employeeLoader,
        currentPage,
        setCurrentPage,
        count,
        refetch,
    } = useEmployeeListApi({
        employeeStatus,
        offboardReload,
        sortField,
        sortOrder,
        debouncedSearch,
    });
    const [selectedIds, setSelectedIds] = useState<string[]>([]);

    const renderSkeleton = () => <Skeleton active paragraph={{ rows: 3 }} />;
    let tableContent;
    if (employeeLoader) {
        tableContent = Array.from({ length: 10 }).map((_, index) => (
            <Card size="small" className="h-40 p-2 mt-4 border-none bg-slate-50" key={index}>
                <Flex className="w-full" gap={5} vertical>
                    {renderSkeleton()}
                </Flex>
            </Card>
        ));
    } else if (data.length === 0) {
        tableContent = <Empty description="No data available" />;
    } else {
        tableContent = data.map((item, index) => (
            <EmployeecardMobile
                key={item.id}
                department={item.employeeInformation.department.departmentName}
                name={item.personalInformation?.fullName}
                designation={item.employeeInformation?.designation}
                employeeMail={item.personalInformation?.email}
                employeeId={item.employeeInformation?.employeeId}
                joinDate={item.employeeInformation?.dateOfJoin}
                id={item.id}
                image={item.profileImage}
                status={item.employeeInformation?.employeeStatus}
                phone={item.personalInformation?.mobileNo}
                isSelected={selectedIds.includes(item.employeeInformation?.employeeId || '')}
                onSelect={(employeeId, selected) => {
                    setSelectedIds(prevSelected =>
                        selected
                            ? [...prevSelected, employeeId]
                            : prevSelected.filter(empId => empId !== employeeId)
                    );
                }}
            />
        ));
    }

    const { deleteUser, isLoading: isDeleting } = useDeleteEmployeeApi({
        handleCancel: () => setOpenConfirmationModal(false),
    });

    const handleDelete = async (employeeId: string) => {
        try {
            // Call the deleteUser function from the hook with the employeeId
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
    const handleSelectAll = (selected: boolean) => {
        if (selected) {
            setSelectedIds(data.map(employee => employee.employeeInformation?.employeeId || ''));
        } else {
            setSelectedIds([]);
        }
    };

    const handlePageChange = (page: number) => {
        setCurrentPage(page);
    };
    const allSelected = data.length > 0 && selectedIds.length === data.length;

    return (
        <Row className="mt-4" gutter={[0, 20]}>
            <Col span={24}>
                <Flex className="w-full justify-between p-2 bg-gray-100">
                    <Checkbox
                        checked={allSelected}
                        onChange={e => handleSelectAll(e.target.checked)}
                    >
                        Select All
                    </Checkbox>
                </Flex>
            </Col>
            <Col span={24}>{tableContent}</Col>
            <Col span={24}>
                {data.length > 0 && (
                    <Pagination
                        current={currentPage}
                        size="default"
                        className="md:text-end pt-7 xs:text-center"
                        total={count}
                        onChange={handlePageChange}
                    />
                )}
            </Col>

            <ConfirmationModal
                isOpen={openConfirmationModal}
                handleCancel={() => setOpenConfirmationModal(false)}
                title="Are you sure you want to delete this employee?This action is irreversible and will permanently remove all associated data"
                handleSubmit={() => handleDelete(selectedEmployeeId!)}
                isLoading={isDeleting}
            />
        </Row>
    );
};

export default EmployeesTableMobile;
