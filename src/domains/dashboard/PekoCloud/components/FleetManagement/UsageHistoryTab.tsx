import React, { useState } from 'react';

import { SearchOutlined } from '@ant-design/icons';
import { Button, Col, Flex, Input, Pagination, Row, Table } from 'antd';
import { useLocation } from 'react-router-dom';

import useScreenSize from '@src/hooks/useScreenSize';

import UsageHistoryMobileView from './UsageHistoryMobileView';
import ConfirmationModal from '../../../../../components/molecular/modals/ConfirmationModal';
import { useDeleteVehicleUsageApi } from '../../hooks/fleetHooks/useDeleteVehicleUsageApi';
import { useGetAllVehicleUsageApi } from '../../hooks/fleetHooks/useListVehicleUsageApi';
import { fleetUsageHistoryColumn } from '../../utils/fleet/fleetUsageHistoryData';
import useFilter from '../../utils/useFilter';
import AssignVehicleModal from '../Modals/AssignVehicleModal';
import VehicleUsageHistoryModal from '../Modals/VehicleUsageHistoryModal';

const UsageHistoryTab = () => {
    const screen = useScreenSize();
    const location = useLocation();
    const { fleetId } = location.state;
    const [openAssignVehicleModal, setOpenAssignVehicleModal] = useState(false);
    const [openAssignModal, setOpenAssignModal] = useState(false);
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
    const { tableDatas, orderCount, tableLoading } = useGetAllVehicleUsageApi(
        filter.page,
        filter.limit,
        reloadTable,
        filter.searchText,
        fleetId
    );
    const { deleteVehicleUsageData, isLoading: deleteLoader } = useDeleteVehicleUsageApi({
        handleCancel: () => setOpenConfirmationModal(false),
    });
    const HandleDelete = (selectedRow: any) => {
        setSelectedRecordData(selectedRow);
        setOpenConfirmationModal(true);
    };
    const handleDeleteVehicleDoc = async () => {
        await deleteVehicleUsageData(selectedRecordData?.id!);
        setSelectedRecordData(null);
        setReloadTable(p => !p);
    };
    const handleEdit = async (selectedRowData: any) => {
        setSelectedRecordData(selectedRowData);
        setOpenAssignVehicleModal(true);
    };

    return (
        <>
            {screen.xs ? (
                <UsageHistoryMobileView
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
                        <Flex vertical>
                            <Row gutter={[15, 16]} className="justify-between xs:mt-10 md:mt-0">
                                <Col span={24} md={20}>
                                    <Input
                                        placeholder="Search for usage history"
                                        suffix={<SearchOutlined />}
                                        className="rounded-none "
                                        onChange={handleSearch}
                                    />
                                </Col>

                                <Col span={24} md={4}>
                                    <Button
                                        onClick={() => {
                                            setSelectedRecordData(null);
                                            setOpenAssignModal(true);
                                        }}
                                        className="min-w-full"
                                        danger
                                    >
                                        Assign Vehicle
                                    </Button>
                                </Col>
                            </Row>

                            <Table
                                className="mt-7"
                                scroll={{ x: 568 }}
                                dataSource={tableDatas}
                                columns={fleetUsageHistoryColumn(HandleDelete, handleEdit)}
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
                        title="Are you sure you want to delete this vehicle history?"
                        handleSubmit={handleDeleteVehicleDoc}
                        isLoading={deleteLoader}
                    />
                </Row>
            )}
        </>
    );
};
export default UsageHistoryTab;
