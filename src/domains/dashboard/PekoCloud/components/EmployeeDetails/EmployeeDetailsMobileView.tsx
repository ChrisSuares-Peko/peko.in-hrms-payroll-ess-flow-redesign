import { FC, useState } from 'react';

import { SearchOutlined } from '@ant-design/icons';
import { Card, Col, Flex, Input, Pagination, Row, Typography, Empty, Skeleton, Button } from 'antd';

import ConfirmationModal from './ConfirmationModal';
import EmployeeDetailsCardMobile from './EmployeeDetailsCardMobile';
import { useDeleteEmployeeApi } from '../../hooks/employeeHooks/useDeleteEmployeeApi';
import AssignAssetModal from '../Modals/AssignAssetModal';
import EmployeeModal from '../Modals/EmployeeModal';

interface CompanyDocMobileProps {
    searchText?: string | null;
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

const EmployeeDetailsMobileView: FC<CompanyDocMobileProps> = ({
    searchText,
    setReloadTable,
    orderCount,
    tableLoading,
    tableDatas,
    handlePageChange,
    handleSearch,
    limit,
    page,
    reloadInfo,
}) => {
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
    };
    const handleEdit = async (selectedRowData: any) => {
        setSelectedRecordData(selectedRowData);
        setOpenEmployeeModal(true);
    };
    const renderSkeleton = () => <Skeleton active paragraph={{ rows: 3 }} />;

    let tableContent;
    if (tableLoading) {
        tableContent = Array.from({ length: 10 }).map((_, index) => (
            <Card size="small" className="mt-4 h-40 bg-slate-50 border-none p-2" key={index}>
                <Flex className="w-full" gap={5} vertical>
                    {renderSkeleton()}
                </Flex>
            </Card>
        ));
    } else if (tableDatas.length === 0) {
        tableContent = <Empty description="No data available" />;
    } else {
        tableContent = tableDatas.map((item: any, index: number) => (
            <EmployeeDetailsCardMobile
                key={index}
                item={item}
                handleEdit={handleEdit}
                handleDelete={HandleDelete}
            />
        ));
    }

    return (
        <Flex vertical gap={20} className="">
            <Row justify="space-between" align="middle" gutter={[20, 20]}>
                <Col xs={12} sm={12} md={6} className="text-right">
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
                <Col xs={12} sm={12} md={6} className="text-right">
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
                <Col xs={24} sm={12} md={6}>
                    <Input
                        placeholder="Search for employees"
                        suffix={<SearchOutlined />}
                        allowClear
                        type="text"
                        maxLength={100}
                        onChange={handleSearch}
                    />
                </Col>
            </Row>
            <Row align="middle" className="p-5 rounded-md bg-bgLightGray">
                <Col xs={12}>
                    {' '}
                    <Flex justify="start">
                        <Typography.Text className="text-[#475467] font-medium">
                            Employee Name
                        </Typography.Text>
                    </Flex>
                </Col>

                <Col xs={12}>
                    {' '}
                    <Flex justify="center">
                        {' '}
                        <Typography.Text className="text-[#475467] font-medium">
                            Joining Date
                        </Typography.Text>
                    </Flex>
                </Col>
            </Row>
            {tableContent}
            <Pagination
                onChange={handlePageChange}
                size="small"
                className="text-center mt-10"
                total={orderCount}
            />
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
        </Flex>
    );
};

export default EmployeeDetailsMobileView;
