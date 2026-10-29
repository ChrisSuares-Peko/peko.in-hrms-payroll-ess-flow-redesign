import { FC, useState } from 'react';

import { SearchOutlined } from '@ant-design/icons';
import { Card, Col, Flex, Input, Pagination, Row, Typography, Empty, Skeleton, Button } from 'antd';
import { useLocation } from 'react-router-dom';

import ConfirmationModal from '@components/molecular/modals/ConfirmationModal';

import UsageHistoryMobileCard from './UsageHistoryMobileCard';
import { useDeleteVehicleUsageApi } from '../../hooks/fleetHooks/useDeleteVehicleUsageApi';
import AssignVehicleModal from '../Modals/AssignVehicleModal';
import VehicleUsageHistoryModal from '../Modals/VehicleUsageHistoryModal';

interface UsageHistoryMobileProps {
    searchText?: string | null;
    setReloadTable: React.Dispatch<React.SetStateAction<boolean>>;
    orderCount?: number;
    tableLoading: boolean;
    tableDatas: any;
    handleSearch: any;
    handlePageChange: any;
    page: number;
    limit: number;
}

const UsageHistoryMobileView: FC<UsageHistoryMobileProps> = ({
    searchText,
    setReloadTable,
    orderCount,
    tableLoading,
    tableDatas,
    handlePageChange,
    handleSearch,
    limit,
    page,
}) => {
    const location = useLocation();
    const { fleetId } = location.state;
    const [openAssignVehicleModal, setOpenAssignVehicleModal] = useState(false);
    const [openAssignModal, setOpenAssignModal] = useState(false);
    const [openConfirmationModal, setOpenConfirmationModal] = useState(false);
    const [selectedRecordData, setSelectedRecordData] = useState<any | null>(null);

    const { deleteVehicleUsageData, isLoading: deleteLoader } = useDeleteVehicleUsageApi({
        handleCancel: () => setOpenConfirmationModal(false),
    });
    const HandleDelete = (selectedRow: any) => {
        setSelectedRecordData(selectedRow);
        setOpenConfirmationModal(true);
    };
    const handleDeleteVehicleUsage = async () => {
        await deleteVehicleUsageData(selectedRecordData?.id!);
        setSelectedRecordData(null);
        setReloadTable(p => !p);
    };
    const handleEdit = async (selectedRowData: any) => {
        setSelectedRecordData(selectedRowData);
        setOpenAssignVehicleModal(true);
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
            <UsageHistoryMobileCard
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
                <Col xs={24} sm={12} md={6} className="text-right">
                    <Button
                        onClick={() => {
                            setSelectedRecordData(null);
                            setOpenAssignModal(true);
                        }}
                        className="w-fit px-7"
                        danger
                    >
                        Assign Vehicle
                    </Button>
                </Col>
                <Col xs={24} sm={12} md={6}>
                    <Input
                        placeholder="Search for usage history"
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
                            Status
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
            {openAssignVehicleModal && (
                <VehicleUsageHistoryModal
                    open={openAssignVehicleModal}
                    handleCancel={() => setOpenAssignVehicleModal(false)}
                    reloadTable={setReloadTable}
                    selectedRecordData={selectedRecordData}
                    cloudFleetId={fleetId}
                />
            )}
            {openAssignModal && (
                <AssignVehicleModal
                    open={openAssignModal}
                    handleCancel={() => setOpenAssignModal(false)}
                    reloadTable={setReloadTable}
                    fleetId={fleetId}
                />
            )}
            <ConfirmationModal
                isOpen={openConfirmationModal}
                handleCancel={() => setOpenConfirmationModal(false)}
                title="Are you sure you want to delete this usage history?"
                handleSubmit={handleDeleteVehicleUsage}
                isLoading={deleteLoader}
            />
        </Flex>
    );
};

export default UsageHistoryMobileView;
