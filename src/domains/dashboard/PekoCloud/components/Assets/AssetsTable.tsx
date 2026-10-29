import React, { useState } from 'react';

import { SearchOutlined } from '@ant-design/icons';
import { Button, Col, Flex, Input, Pagination, Row, Table } from 'antd';

import useScreenSize from '@src/hooks/useScreenSize';

import AssetsMobileView from './AssetsMobileView';
import ConfirmationModal from '../../../../../components/molecular/modals/ConfirmationModal';
import { useDeleteAssetApi } from '../../hooks/assetHooks/useDeleteAssetApi';
import { assetsColumn } from '../../utils/assets';
import AssetModal from '../Modals/AssetModal';
import AssignAssetModal from '../Modals/AssignAssetModal';

interface AssetTableProps {
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
const AssetsTable = ({
    reloadInfo,
    setReloadTable,
    orderCount,
    tableLoading,
    tableDatas,
    handlePageChange,
    handleSearch,
    limit,
    page,
}: AssetTableProps) => {
    const screen = useScreenSize();
    const [openAssetModal, setOpenAssetModal] = useState(false);
    const [openAssignModal, setOpenAssignModal] = useState(false);
    const [openConfirmationModal, setOpenConfirmationModal] = useState(false);
    const [selectedRecordData, setSelectedRecordData] = useState<any | null>(null);

    const { deleteAssetData, isLoading: deleteLoader } = useDeleteAssetApi({
        handleCancel: () => setOpenConfirmationModal(false),
    });
    const HandleDelete = (selectedRow: any) => {
        setSelectedRecordData(selectedRow);
        setOpenConfirmationModal(true);
    };

    const handleDeleteAsset = async () => {
        await deleteAssetData(selectedRecordData?.id!);
        setSelectedRecordData(null);
        setReloadTable(p => !p);
        reloadInfo(p => !p);
    };
    const handleEdit = async (selectedRowData: any) => {
        setSelectedRecordData(selectedRowData);
        setOpenAssetModal(true);
    };

    return (
        <>
            {screen.xs ? (
                <AssetsMobileView
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
                    <Col span={24} className="md:py-10">
                        <Flex vertical className="">
                            <Row gutter={[15, 16]} className="justify-between xs:mt-10 md:mt-0">
                                <Col span={10} md={12} xl={14} xxl={16}>
                                    <Input
                                        placeholder="Search for assets"
                                        suffix={<SearchOutlined />}
                                        className="rounded-none "
                                        onChange={handleSearch}
                                    />
                                </Col>
                                <Col span={7} md={6} xl={5} xxl={4}>
                                    <Button
                                        onClick={() => {
                                            setSelectedRecordData(null);
                                            setOpenAssetModal(true);
                                        }}
                                        className="test-xs w-full"
                                        type="primary"
                                        danger
                                    >
                                        Add Asset
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
                                dataSource={tableDatas.map((item: any) => ({
                                    key: item.id,
                                    ...item,
                                }))}
                                columns={assetsColumn(HandleDelete, handleEdit)}
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
                    {openAssetModal && (
                        <AssetModal
                            open={openAssetModal}
                            handleCancel={() => setOpenAssetModal(false)}
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
                        />
                    )}
                    <ConfirmationModal
                        isOpen={openConfirmationModal}
                        handleCancel={() => setOpenConfirmationModal(false)}
                        title="Are you sure you want to delete this asset?"
                        handleSubmit={handleDeleteAsset}
                        isLoading={deleteLoader}
                    />
                </Row>
            )}
        </>
    );
};
export default AssetsTable;
