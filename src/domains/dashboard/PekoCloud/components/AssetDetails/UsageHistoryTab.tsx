import React, { useState } from 'react';

import { SearchOutlined } from '@ant-design/icons';
import { Button, Col, Flex, Input, Pagination, Row, Table } from 'antd';
import { useLocation } from 'react-router-dom';

import useScreenSize from '@src/hooks/useScreenSize';

import UsageHistoryMobileView from './UsageHistoryMobileView';
import ConfirmationModal from '../../../../../components/molecular/modals/ConfirmationModal';
import { useDeleteUsageHistoryApi } from '../../hooks/assetHooks/useDeleteUsageApi';
import { useGetAllAssetUsageApi } from '../../hooks/assetHooks/useListUsageApi';
import { assetsUsageHistoryColumn } from '../../utils/assetDetails';
import useFilter from '../../utils/useFilter';
import AssetUsageHistoryModal from '../Modals/AssetUsageHistoryModal';
import AssignAssetModal from '../Modals/AssignAssetModal';

const UsageHistoryTab = () => {
    const screen = useScreenSize();
    const location = useLocation();
    const { assetId } = location.state;
    const [openUsageHistoryModal, setOpenUsageHistoryModal] = useState(false);
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

    const { tableDatas, orderCount, tableLoading } = useGetAllAssetUsageApi(
        filter.page,
        filter.limit,
        reloadTable,
        filter.searchText,
        assetId
    );

    const { deleteUsageHistoryData, isLoading: deleteLoader } = useDeleteUsageHistoryApi({
        handleCancel: () => setOpenConfirmationModal(false),
    });
    const HandleDelete = (selectedRow: any) => {
        setSelectedRecordData(selectedRow);
        setOpenConfirmationModal(true);
    };
    const handleDeleteUsageHistory = async () => {
        await deleteUsageHistoryData(selectedRecordData?.id!);
        setSelectedRecordData(null);
        setReloadTable(p => !p);
    };
    const handleEdit = async (selectedRowData: any) => {
        setSelectedRecordData(selectedRowData);
        setOpenUsageHistoryModal(true);
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
                    <Col span={24} className="">
                        <Flex vertical className="">
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
                                        className="test-xs pr-8 w-full"
                                        danger
                                    >
                                        Assign Asset
                                    </Button>
                                </Col>
                            </Row>

                            <Table
                                className="mt-7"
                                scroll={{ x: 568 }}
                                dataSource={tableDatas}
                                columns={assetsUsageHistoryColumn(HandleDelete, handleEdit)}
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
                    {openUsageHistoryModal && (
                        <AssetUsageHistoryModal
                            open={openUsageHistoryModal}
                            handleCancel={() => setOpenUsageHistoryModal(false)}
                            reloadTable={setReloadTable}
                            selectedRecordData={selectedRecordData}
                            assetId={assetId}
                        />
                    )}
                    {openAssignModal && (
                        <AssignAssetModal
                            open={openAssignModal}
                            handleCancel={() => setOpenAssignModal(false)}
                            reloadTable={setReloadTable}
                        />
                    )}
                    <ConfirmationModal
                        isOpen={openConfirmationModal}
                        handleCancel={() => setOpenConfirmationModal(false)}
                        title="Are you sure you want to delete this usage history?"
                        handleSubmit={handleDeleteUsageHistory}
                        isLoading={deleteLoader}
                    />
                </Row>
            )}
        </>
    );
};
export default UsageHistoryTab;
