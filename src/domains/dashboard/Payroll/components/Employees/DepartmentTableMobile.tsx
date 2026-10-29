import { lazy, useState } from 'react';

import { Col, Row, Pagination, Flex, Skeleton, Card, Empty } from 'antd';

import '../../assets/styles.css';
import { useAppDispatch } from '@src/hooks/store';
import { showToast } from '@src/slices/apiSlice';

import DepartmentcardMobile from './DepartmentCardMobile';
import { useDeleteDepartmentApi } from '../../hooks/departmentHooks/useDeleteDepartment';
import { departmentTableData } from '../../types/departmentTypes/departmentTypes';
import DepartmentModal from '../modals/DepartmentModal';

const ConfirmationModal = lazy(() => import('@components/molecular/modals/ConfirmationModal'));

type props = {
    isLoading: boolean;
    tableData: departmentTableData[] | undefined;
    page: number;
    setPage: (page: number) => void;
    count: number;

    setRefresh: (value: any) => void;
};

const DepartmentTableMobile = ({
    isLoading: employeeLoader,
    tableData,
    page,
    setPage,
    count,

    setRefresh,
}: props) => {
    const [openAddDepartmentModal, setOpenAddDepartmentModal] = useState(false);
    const [selectedData, setSelectedData] = useState<departmentTableData>();
    const { deleteDepartment } = useDeleteDepartmentApi({
        handleCancel: () => setOpenConfirmationModal(false),
    });

    const dispatch = useAppDispatch();
    const [openConfirmationModal, setOpenConfirmationModal] = useState(false);
    const [selectedDepartmentId, setSelectedEmployeeId] = useState<string | number>(); // State variable to store the

    const handleDelete = async (id: string | number) => {
        const res = await deleteDepartment(id);

        if (res === true) {
            setRefresh(true);
            dispatch(
                showToast({ description: 'Department deleted successfully', variant: 'success' })
            );
        }
        if (res === false) {
            dispatch(
                showToast({
                    description:
                        'Cannot delete department. Some employee(s) are associated with it.',
                    variant: 'error',
                })
            );
        }
    };

    const handleEdit = async (data: departmentTableData) => {
        setSelectedData(data);
        setOpenAddDepartmentModal(true);
    };
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
    } else if (tableData?.length === 0) {
        tableContent = <Empty description="No data available" />;
    } else {
        tableContent = tableData?.map((item, index) => <DepartmentcardMobile {...item}
        handleEdit={handleEdit} // Pass the handleEdit function
        onDeleteClick={id => {
            setSelectedEmployeeId(id); // set which one to delete
            setOpenConfirmationModal(true); // open modal
        }}
         />);
    }

    return (
        <Row className="mt-4" gutter={[0, 20]}>
            <Col span={24}>{tableContent}</Col>
            <Col span={24}>
                {tableData?.length !== 0 && (
                    <Pagination
                        defaultCurrent={1}
                        current={page}
                        total={count}
                        onChange={e => setPage(e)}
                    />
                )}
            </Col>

            {openAddDepartmentModal && (
                <DepartmentModal
                    open={openAddDepartmentModal}
                    handleCancel={() => setOpenAddDepartmentModal(false)}
                    data={selectedData}
                    setRefresh={setRefresh}
                />
            )}
            <ConfirmationModal
                isOpen={openConfirmationModal}
                handleCancel={() => setOpenConfirmationModal(false)}
                title="Are you sure you want to delete this department?"
                handleSubmit={() => handleDelete(selectedDepartmentId!)}
                isLoading={employeeLoader!}
            />
        </Row>
    );
};

export default DepartmentTableMobile;
