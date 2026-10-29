import React, { useState } from 'react';

import { SearchOutlined } from '@ant-design/icons';
import { Button, Col, Flex, Input, Pagination, Row, Table } from 'antd';

import useScreenSize from '@src/hooks/useScreenSize';

import ConfirmationModal from './ConfirmationModal';
import EmployeeDetailsMobileView from './EmployeeDetailsMobileView';
import { useDeleteEmployeeApi } from '../../hooks/employeeHooks/useDeleteEmployeeApi';
import { Employee } from '../../types/employeeDetails';
import { employeeDetailsColumn } from '../../utils/employeeDetails';
import AssignAssetModal from '../Modals/AssignAssetModal';
import EmployeeModal from '../Modals/EmployeeModal';

interface employeeTableProps {
    reloadInfo: React.Dispatch<React.SetStateAction<boolean>>;
    setReloadTable: React.Dispatch<React.SetStateAction<boolean>>;
    orderCount?: number;
    tableLoading: boolean;
    tableDatas: any;
    handleSearch: any;
    handlePageChange: any;
    page: number;
    limit: number;
}
const EmployeeDetailsTable = ({
    reloadInfo,
    setReloadTable,
    orderCount,
    tableLoading,
    tableDatas,
    handlePageChange,
    handleSearch,
    limit,
    page,
}: employeeTableProps) => {
    const screen = useScreenSize();
    const [openEmployeeModal, setOpenEmployeeModal] = useState(false);
    const [openAssignModal, setOpenAssignModal] = useState(false);
    const [openConfirmationModal, setOpenConfirmationModal] = useState(false);
    const [selectedRecordData, setSelectedRecordData] = useState<any | null>(null);

    const { deleteEmployeeData, isLoading } = useDeleteEmployeeApi({
        handleCancel: () => setOpenConfirmationModal(false),
    });
    const HandleDelete = (selectedRow: any) => {
        setSelectedRecordData(selectedRow);
        setOpenConfirmationModal(true);
    };
    const handleDeleteEmployee = async () => {
        await deleteEmployeeData(selectedRecordData?.id!);
        setSelectedRecordData(null);
        setReloadTable(p => !p);
        reloadInfo(p => !p);
    };
    const handleEdit = async (selectedRowData: any) => {
        setSelectedRecordData(selectedRowData);
        setOpenEmployeeModal(true);
    };

    return (
        <>
            {screen.xs ? (
                <EmployeeDetailsMobileView
                    reloadInfo={reloadInfo}
                    setReloadTable={setReloadTable}
                    handlePageChange={handlePageChange}
                    handleSearch={handleSearch}
                    tableLoading={tableLoading}
                    orderCount={orderCount}
                    tableDatas={tableDatas}
                    page={page}
                    limit={limit}
                />
            ) : (
                <Row>
                    <Col span={24} className="md:pt-5">
                        <Flex vertical className="">
                            <Row gutter={[15, 16]} className="justify-between xs:mt-10 md:mt-0">
                                <Col span={10} md={12} xl={14} xxl={16}>
                                    <Input
                                        placeholder="Search for employees"
                                        suffix={<SearchOutlined />}
                                        className="rounded-none "
                                        onChange={handleSearch}
                                    />
                                </Col>
                                <Col span={7} md={6} xl={5} xxl={4}>
                                    <Button
                                        onClick={() => {
                                            setSelectedRecordData(null);
                                            setOpenEmployeeModal(true);
                                        }}
                                        className="test-xs w-full"
                                        type="primary"
                                        danger
                                    >
                                        Add Employee
                                    </Button>
                                </Col>
                                <Col span={7} md={6} xl={5} xxl={4}>
                                    <Button
                                        onClick={() => {
                                            setOpenAssignModal(true);
                                        }}
                                        className="test-xs w-full"
                                        type="default"
                                        disabled={!tableDatas.length}
                                        danger
                                    >
                                        Assign Asset
                                    </Button>
                                </Col>
                            </Row>

                            <Table
                                className="mt-7"
                                scroll={{ x: 568 }}
                                dataSource={tableDatas.map((item: Employee) => ({
                                    ...item,
                                    key: item.id,
                                }))}
                                columns={employeeDetailsColumn(HandleDelete, handleEdit)}
                                pagination={false}
                                loading={tableLoading}
                            />

                            <Pagination
                                current={page}
                                size="default"
                                className="text-end pt-7"
                                onChange={handlePageChange}
                                pageSize={limit}
                                total={orderCount}
                            />
                        </Flex>
                    </Col>
                    {openEmployeeModal && (
                        <EmployeeModal
                            open={openEmployeeModal}
                            handleCancel={() => setOpenEmployeeModal(false)}
                            reloadTable={setReloadTable}
                            selectedRecordData={selectedRecordData}
                            reloadInfo={reloadInfo}
                        />
                    )}
                    {openAssignModal && (
                        <AssignAssetModal
                            open={openAssignModal}
                            handleCancel={() => setOpenAssignModal(false)}
                            reloadTable={setReloadTable}
                            reloadInfo={reloadInfo}
                        />
                    )}
                    <ConfirmationModal
                        isOpen={openConfirmationModal}
                        handleCancel={() => setOpenConfirmationModal(false)}
                        title="Are you sure you want to delete this employee?"
                        subTitle="Note: Deleting this employee will permanently remove all their usage history from Hub and cannot be restored."
                        size="large"
                        handleSubmit={handleDeleteEmployee}
                        isLoading={isLoading}
                    />
                </Row>
            )}
        </>
    );
};
export default EmployeeDetailsTable;
