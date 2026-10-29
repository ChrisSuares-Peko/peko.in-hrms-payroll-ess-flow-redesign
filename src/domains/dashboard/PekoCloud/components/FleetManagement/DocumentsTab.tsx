import React, { useState } from 'react';

import { SearchOutlined } from '@ant-design/icons';
import { Button, Col, Flex, Input, Pagination, Row, Table } from 'antd';
import { useLocation } from 'react-router-dom';

import useScreenSize from '@src/hooks/useScreenSize';

import FleetDocMobileView from './FleetDocMobileView';
import ConfirmationModal from '../../../../../components/molecular/modals/ConfirmationModal';
import { useDeleteVehicleDocApi } from '../../hooks/fleetHooks/useDeleteVehicleDocApi';
import { useGetAllVehicleDocApi } from '../../hooks/fleetHooks/useListVehicleDocApi';
import useDownloadDocument from '../../hooks/useDownloadDocumentApi';
import { fleetDocColumn } from '../../utils/fleet/fleetDocData';
import useFilter from '../../utils/useFilter';
import VehicleDocModal from '../Modals/VehicleDocModal';

const DocumentsTab = () => {
    const screen = useScreenSize();
    const location = useLocation();
    const { fleetId } = location.state;
    const [openVehicleDocModal, setOpenVehicleDocModal] = useState(false);
    const [loadingRows, setLoadingRows] = useState({});
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
    const { tableDatas, orderCount, tableLoading } = useGetAllVehicleDocApi(
        filter.page,
        filter.limit,
        reloadTable,
        filter.searchText,
        fleetId
    );
    const { deleteVehicleDocData, isLoading: deleteLoader } = useDeleteVehicleDocApi({
        handleCancel: () => setOpenConfirmationModal(false),
    });
    const { handleDocumentDownload } = useDownloadDocument();
    const handleDocDownload = async (record: any) => {
        setLoadingRows(prev => ({ ...prev, [record.id]: true }));
        try {
            await handleDocumentDownload(record.document, record.documentName);
        } finally {
            setLoadingRows(prev => ({ ...prev, [record.id]: false }));
        }
    };

    const HandleDelete = (selectedRow: any) => {
        setSelectedRecordData(selectedRow);
        setOpenConfirmationModal(true);
    };
    const handleDeleteVehicleDoc = async () => {
        await deleteVehicleDocData(selectedRecordData?.id!);
        setSelectedRecordData(null);
        setReloadTable(p => !p);
    };
    const handleEdit = async (selectedRowData: any) => {
        setSelectedRecordData(selectedRowData);
        setOpenVehicleDocModal(true);
    };

    return (
        <>
            {screen.xs ? (
                <FleetDocMobileView
                    setReloadTable={setReloadTable}
                    handlePageChange={handlePageChange}
                    handleSearch={handleSearch}
                    tableLoading={tableLoading}
                    orderCount={orderCount}
                    tableDatas={tableDatas}
                    page={filter.page}
                    limit={filter.limit}
                    handleDocDownload={handleDocDownload}
                    loadingRows={loadingRows}
                />
            ) : (
                <Row>
                    <Col span={24} className="py-10">
                        <Flex vertical>
                            <Row gutter={[15, 16]} className="justify-between xs:mt-10 md:mt-0">
                                <Col span={17} md={18} xl={19} xxl={20}>
                                    <Input
                                        placeholder="Search for documents"
                                        suffix={<SearchOutlined />}
                                        className="rounded-none "
                                        onChange={handleSearch}
                                    />
                                </Col>
                                <Col span={7} md={6} xl={5} xxl={4}>
                                    <Button
                                        onClick={() => {
                                            setSelectedRecordData(null);
                                            setOpenVehicleDocModal(true);
                                        }}
                                        className="min-w-full"
                                        type="primary"
                                        danger
                                    >
                                        Add New Document
                                    </Button>
                                </Col>
                            </Row>

                            <Table
                                className="mt-7"
                                scroll={{ x: 568 }}
                                dataSource={tableDatas}
                                columns={fleetDocColumn(
                                    HandleDelete,
                                    handleEdit,
                                    handleDocDownload,
                                    loadingRows
                                )}
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
                    {openVehicleDocModal && (
                        <VehicleDocModal
                            open={openVehicleDocModal}
                            handleCancel={() => setOpenVehicleDocModal(false)}
                            reloadTable={setReloadTable}
                            selectedRecordData={selectedRecordData}
                        />
                    )}
                    <ConfirmationModal
                        isOpen={openConfirmationModal}
                        handleCancel={() => setOpenConfirmationModal(false)}
                        title="Are you sure you want to delete this document?"
                        handleSubmit={handleDeleteVehicleDoc}
                        isLoading={deleteLoader}
                    />
                </Row>
            )}
        </>
    );
};
export default DocumentsTab;
