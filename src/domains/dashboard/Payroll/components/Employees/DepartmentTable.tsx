import { lazy, useState } from 'react';

import { DeleteOutlined, EditOutlined } from '@ant-design/icons';
import type { TableColumnsType } from 'antd';
import { Col, Row, Typography, Pagination, Flex } from 'antd';

import '../../assets/styles.css';
import GenericTable from '@components/atomic/GenericTable';
import { useAppDispatch } from '@src/hooks/store';
import { showToast } from '@src/slices/apiSlice';

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

const DepartmentTable = ({
    isLoading,
    tableData,
    page,
    setPage,
    count,

    setRefresh,
}: props) => {
    const [openAddDepartmentModal, setOpenAddDepartmentModal] = useState(false);
    const [selectedData, setSelectedData] = useState<departmentTableData>();
    const { deleteDepartment, isLoading: deleteLoader } = useDeleteDepartmentApi({
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

    const columns: TableColumnsType<departmentTableData> = [
        {
            title: "Date Added",
            dataIndex: 'date',
            render: (text: string, record: departmentTableData) => (
                <Typography.Text
                    className="  text-gray-900  font-normal"
                    style={{ textAlign: 'center' }}
                >
                    {text || 'N/A'}
                </Typography.Text>
            ),
        },
        {
            title:"Department Name",
            dataIndex: 'name',
            render: (text: string, record: departmentTableData) => (
                <Typography.Text
                    className="  text-gray-900  font-normal"
                    style={{ textAlign: 'center' }}
                >
                    {text || 'N/A'}
                </Typography.Text>
            ),
        },
        {
            title:"Department ID",
            dataIndex: 'code',
            render: (text: string, record: departmentTableData) => (
                <Typography.Text
                    className="  text-gray-900  font-normal"
                    style={{ textAlign: 'center' }}
                >
                    {text || 'N/A'}
                </Typography.Text>
            ),
        },

        {
            title: "Action",
            dataIndex: 'id',
            render: (text: string, record: departmentTableData) => (
                <Flex justify="space-evenly">
                    <DeleteOutlined
                        onClick={() => {
                            setSelectedEmployeeId(record.id); // Set selected employee ID
                            setOpenConfirmationModal(true); // Open confirmation modal
                        }}
                        style={{ color: '#E30000', fontSize: '1.1rem', cursor: 'pointer' }}
                    />
                    <EditOutlined
                        onClick={e => handleEdit(record)}
                        style={{ fontSize: '1.1rem', cursor: 'pointer', color: '#E30000' }}
                    />
                </Flex>
            ),
        },
    ];

    return (
        <Row className="mt-2" gutter={[0, 20]}>
            <Col span={24}>
                <GenericTable
                    loading={isLoading}
                    columns={columns}
                    dataSource={tableData}
                    pagination={false}
                />
            </Col>
            <Col span={24} className="flex w-full justify-end">
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
                isLoading={deleteLoader}
            />
        </Row>
    );
};

export default DepartmentTable;
