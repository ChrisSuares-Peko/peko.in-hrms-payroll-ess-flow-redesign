import React, { useState } from 'react';

import { SearchOutlined } from '@ant-design/icons';
import { Button, Col, Flex, Input, Pagination, Row, Table } from 'antd';

import useScreenSize from '@src/hooks/useScreenSize';

import FleetMobileView from './FleetMobileView';
import ConfirmationModal from '../../../../../components/molecular/modals/ConfirmationModal';
import { useDeleteVehicleApi } from '../../hooks/fleetHooks/useDeleteVehicleApi';
import { fleetManagementColumn } from '../../utils/fleet/fleetManagementData';
import AssignVehicleModal from '../Modals/AssignVehicleModal';
import VehicleModal from '../Modals/VehicleModal';

interface fleetTableProps {
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
const FleetTable = ({
    reloadInfo,
    setReloadTable,
    orderCount,
    tableLoading,
    tableDatas,
    handlePageChange,
    handleSearch,
    limit,
    page,
}: fleetTableProps) => {
    const screen = useScreenSize();
    const [openVehicleModal, setOpenVehicleModal] = useState(false);
    const [openAssignModal, setOpenAssignModal] = useState(false);
    const [openConfirmationModal, setOpenConfirmationModal] = useState(false);
    const [selectedRecordData, setSelectedRecordData] = useState<any | null>(null);

    const { deleteVehicleData, isLoading: deleteLoader } = useDeleteVehicleApi({
        handleCancel: () => setOpenConfirmationModal(false),
    });
    const HandleDelete = (selectedRow: any) => {
        setSelectedRecordData(selectedRow);
        setOpenConfirmationModal(true);
    };
    const handleDeleteVehicle = async () => {
        await deleteVehicleData(selectedRecordData?.id!);
        setSelectedRecordData(null);
        setReloadTable(p => !p);
        reloadInfo(p => !p);
    };
    const handleEdit = async (selectedRowData: any) => {
        setSelectedRecordData(selectedRowData);
        setOpenVehicleModal(true);
    };

    return (
        <>
            {screen.xs ? (
                <FleetMobileView
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
                    <Col span={24} className="py-10">
                        <Flex vertical className="">
                            <Row gutter={[15, 16]} className="justify-between xs:mt-10 md:mt-0">
                                <Col span={10} md={12} xl={14} xxl={16}>
                                    <Input
                                        placeholder="Search for vehicles"
                                        suffix={<SearchOutlined />}
                                        className="rounded-none "
                                        onChange={handleSearch}
                                    />
                                </Col>
                                <Col span={7} md={6} xl={5} xxl={4}>
                                    <Button
                                        onClick={() => {
                                            setSelectedRecordData(null);
                                            setOpenVehicleModal(true);
                                        }}
                                        className="test-xs w-full"
                                        type="primary"
                                        danger
                                    >
                                        Add Vehicle
                                    </Button>
                                </Col>
                                <Col span={7} md={6} xl={5} xxl={4}>
                                    <Button
                                        onClick={() => {
                                            setOpenAssignModal(true);
                                        }}
                                        className="test-xs w-full"
                                        disabled={!tableDatas.length}
                                        danger
                                    >
                                        Assign Vehicle
                                    </Button>
                                </Col>
                            </Row>

                            <Table
                                className="mt-7"
                                scroll={{ x: 568 }}
                                dataSource={tableDatas.map((item: any) => ({
                                    key: item.id,
                                    ...item,
                                }))}
                                columns={fleetManagementColumn(HandleDelete, handleEdit)}
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
                    {openVehicleModal && (
                        <VehicleModal
                            open={openVehicleModal}
                            handleCancel={() => setOpenVehicleModal(false)}
                            reloadTable={setReloadTable}
                            selectedRecordData={selectedRecordData}
                            reloadInfo={reloadInfo}
                        />
                    )}
                    {openAssignModal && (
                        <AssignVehicleModal
                            open={openAssignModal}
                            handleCancel={() => setOpenAssignModal(false)}
                            reloadTable={setReloadTable}
                        />
                    )}
                    <ConfirmationModal
                        isOpen={openConfirmationModal}
                        handleCancel={() => setOpenConfirmationModal(false)}
                        title="Are you sure you want to delete this vehicle?"
                        handleSubmit={handleDeleteVehicle}
                        isLoading={deleteLoader}
                    />
                </Row>
            )}
        </>
    );
};
export default FleetTable;
