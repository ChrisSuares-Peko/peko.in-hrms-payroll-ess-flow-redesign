import { lazy, useState } from 'react';

import { Skeleton, Col, Flex, Row, Pagination, Card, Empty } from 'antd';

import { useAppDispatch } from '@src/hooks/store';
import useDebounce from '@src/hooks/useDebounce';
import { showToast } from '@src/slices/apiSlice';

import EmployeeListMobileCard from './EmployeeListMobileCard';
import { useDeleteEmployeeApi } from '../../../hooks/employeeHooks/useDeleteEmployeeApi';
import { useEmployeeListApi } from '../../../hooks/employeeHooks/useEmployeeListApi';

const ConfirmationModal = lazy(() => import('@components/molecular/modals/ConfirmationModal'));

interface EmployeeProps {
    searchText: string;
    setActiveTabKey: (key: any) => void;
}

const EmployeeListMobile = ({ searchText, setActiveTabKey }: EmployeeProps) => {
    const [openConfirmationModal, setOpenConfirmationModal] = useState(false);
    const dispatch = useAppDispatch();
    const [selectedEmployeeId, setSelectedEmployeeId] = useState<string>();
    const sortField = 'dateOfJoin';
    const sortOrder = 'desc';
    const employeeStatus = 'active';
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
            <EmployeeListMobileCard
                key={item.id}
                name={item.personalInformation.fullName}
                id={item.id}
                employeeId={item.employeeInformation.employeeId}
                designation={item.employeeInformation.designation}
                employeeMail={item.personalInformation.email}
                status={item.employeeInformation.employeeStatus}
                phone={item.personalInformation.mobileNo}
                department={item.employeeInformation.department.departmentName}
                image={item.profileImage}
                joinDate={item.employeeInformation.dateOfJoin}
                isSelected={selectedIds.includes(item.employeeInformation.employeeId)}
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

    const handlePageChange = (page: number) => {
        setCurrentPage(page);
    };

    return (
        <Row className="mt-4" gutter={[0, 20]}>
            <Col span={24}>{tableContent}</Col>
            <Col span={24}>
                {data.length > 0 && (
                    <Flex className="mt-4" justify="end">
                        <Pagination
                            current={currentPage}
                            size="default"
                            total={count}
                            onChange={handlePageChange}
                        />
                    </Flex>
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

export default EmployeeListMobile;
