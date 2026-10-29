import React, { useState } from 'react';

import { SearchOutlined } from '@ant-design/icons';
import { Button, Col, Flex, Input, Pagination, Row, Table } from 'antd';
import { useLocation } from 'react-router-dom';

import useScreenSize from '@src/hooks/useScreenSize';

import MaintenaceMobileView from './MaintenanceMobileView';
import ConfirmationModal from '../../../../../components/molecular/modals/ConfirmationModal';
import { useDeleteMaintenanceHistoryApi } from '../../hooks/fleetHooks/useDeleteMaintenanceApi';
import { useGetAllVehicleMaintenanceDataApi } from '../../hooks/fleetHooks/useListMaintenanceApi';
import { fleetMaintenanceColumn } from '../../utils/fleet/fleetMaintenanceData';
import useFilter from '../../utils/useFilter';
import VehicleMaintenanceModal from '../Modals/VehicleMaintenanceModal';

const MaintenanceTab = () => {
    const screen = useScreenSize();
    const location = useLocation();
    const { fleetId } = location.state;
    const [openMaintenanceModal, setOpenMaintenanceModal] = useState(false);
    const [openConfirmationModal, setOpenConfirmationModal] = useState(false);
    const [selectedRecordData, setSelectedRecordData] = useState<any | null>(null);
    const [reloadTable, setReloadTable] = useState(false);

    const initialValues = {
        searchText: '',
        sort: 'ASC',
        page: 1,
        limit: 5,
        filter: '',
        year: 0,
        month: 0,
    };
    const [filter, setFilter] = useState<any>(initialValues);
    const { handlePageChange, handleSearch } = useFilter({
        setFilter,
    });
    const { tableDatas, orderCount, tableLoading } = useGetAllVehicleMaintenanceDataApi(
        filter.page,
        filter.limit,
        reloadTable,
        filter.searchText,
        fleetId
    );
    const { deleteVehicleMaintanceData, isLoading: deleteLoader } = useDeleteMaintenanceHistoryApi({
        handleCancel: () => setOpenConfirmationModal(false),
    });
    const HandleDelete = (selectedRow: any) => {
        setSelectedRecordData(selectedRow);
        setOpenConfirmationModal(true);
    };
    const handleDeleteVehicleMaintenanceData = async () => {
        await deleteVehicleMaintanceData(selectedRecordData?.id!);
        setSelectedRecordData(null);
        setReloadTable(p => !p);
    };
    const handleEdit = async (selectedRowData: any) => {
        setSelectedRecordData(selectedRowData);
        setOpenMaintenanceModal(true);
    };

    return (
        <>
            {screen.xs ? (
                <MaintenaceMobileView
                    setReloadTable={setReloadTable}
                    handlePageChange={handlePageChange}
                    handleSearch={handleSearch}
                    tableLoading={tableLoading}
                    orderCount={orderCount}
                    tableDatas={tableDatas}
                    page={filter.page}
                    limit={filter.limit}
                />
            ) : (
                <Row>
                    <Col span={24} className="py-10">
                        <Flex vertical className="">
                            <Row gutter={[15, 16]} className="justify-between xs:mt-10 md:mt-0">
                                <Col span={17} md={18} xl={19} xxl={20}>
                                    <Input
                                        placeholder="Search for maintenace history"
                                        suffix={<SearchOutlined />}
                                        className="w-full rounded-none"
                                        onChange={handleSearch}
                                    />
                                </Col>
                                <Col span={7} md={6} xl={5} xxl={4}>
                                    <Button
                                        onClick={() => {
                                            setSelectedRecordData(null);
                                            setOpenMaintenanceModal(true);
                                        }}
                                        className="w-full  test-xs"
                                        danger
                                    >
                                        Record Maintenance
                                    </Button>
                                </Col>
                            </Row>

                            <Table
                                className="mt-7"
                                scroll={{ x: 568 }}
                                dataSource={tableDatas}
                                columns={fleetMaintenanceColumn(HandleDelete, handleEdit)}
                                pagination={false}
                                loading={tableLoading}
                            />

                            <Pagination
                                current={filter.page}
                                size="default"
                                className="text-end pt-7"
                                onChange={handlePageChange}
                                pageSize={filter.limit}
                                total={orderCount}
                            />
                        </Flex>
                    </Col>
                    {openMaintenanceModal && (
                        <VehicleMaintenanceModal
                            open={openMaintenanceModal}
                            handleCancel={() => setOpenMaintenanceModal(false)}
                            reloadTable={setReloadTable}
                            selectedRecordData={selectedRecordData}
                        />
                    )}
                    <ConfirmationModal
                        isOpen={openConfirmationModal}
                        handleCancel={() => setOpenConfirmationModal(false)}
                        title="Are you sure you want to delete this maintenance history?"
                        handleSubmit={handleDeleteVehicleMaintenanceData}
                        isLoading={deleteLoader}
                    />
                </Row>
            )}
        </>
    );
};
export default MaintenanceTab;
