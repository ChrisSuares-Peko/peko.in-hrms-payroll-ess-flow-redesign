import React, { useState } from 'react';

import { SearchOutlined } from '@ant-design/icons';
import { Col, Flex, Input, Pagination, Row, Table } from 'antd';

import useScreenSize from '@src/hooks/useScreenSize';

import ChequeLeafMobileView from './AdaptiveView/ChequeLeafMobileView';
import ConfirmationModal from '../../../../../components/molecular/modals/ConfirmationModal';
import { useDeleteChequeLeafApi } from '../../hooks/financialDocHooks/useDeleteChequeLeafApi';
import { useGetAllChequeleavesApi } from '../../hooks/financialDocHooks/useListChequeLeavesApi';
import { chequeBookColumn } from '../../utils/financial';
import useFilter from '../../utils/useFilter';
import AssetDocumentModal from '../Modals/AssetDocumentModal';

interface ChequeLeafTableProps {
    chequeBookId: string;
}
const ChequeLeafTable = ({ chequeBookId }: ChequeLeafTableProps) => {
    const screen = useScreenSize();
    const [openAssetDocModal, setOpenAssetDocModal] = useState(false);
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
    const { tableDatas, orderCount, tableLoading } = useGetAllChequeleavesApi(
        filter.page,
        filter.limit,
        reloadTable,
        filter.searchText,
        chequeBookId
    );
    const { deleteChequeLeafData, isLoading: deleteLoader } = useDeleteChequeLeafApi({
        handleCancel: () => setOpenConfirmationModal(false),
    });
    const HandleDelete = (selectedRow: any) => {
        setSelectedRecordData(selectedRow);
        setOpenConfirmationModal(true);
    };
    const handleDeleteCompanyDoc = async () => {
        await deleteChequeLeafData(selectedRecordData?.id!);
        setSelectedRecordData(null);
        setReloadTable(p => !p);
    };
    const handleEdit = async (selectedRowData: any) => {
        setSelectedRecordData(selectedRowData);
        setOpenAssetDocModal(true);
    };

    return (
        <>
            {screen.xs ? (
                <ChequeLeafMobileView
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
                <Row className="">
                    <Col span={24} className="">
                        <Flex vertical className="">
                            <Row gutter={[15, 16]} className="justify-between xs:mt-10 md:mt-0">
                                <Col span={24} md={24}>
                                    <Input
                                        placeholder="Search for cheque leaf"
                                        suffix={<SearchOutlined />}
                                        className="rounded-none w-full"
                                        onChange={handleSearch}
                                    />
                                </Col>
                                {/* <Col span={24} md={4}>
                            <Button
                                onClick={() => {
                                    setSelectedRecordData(null);
                                    setOpenAssetDocModal(true);
                                }}
                                className="test-xs pr-8 w-full"
                                type="primary"
                                danger
                            >
                                Add New Document
                            </Button>
                        </Col> */}
                            </Row>

                            <Table
                                className="mt-7"
                                scroll={{ x: 568 }}
                                dataSource={tableDatas || []}
                                columns={chequeBookColumn(HandleDelete, handleEdit)}
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
                    {openAssetDocModal && (
                        <AssetDocumentModal
                            open={openAssetDocModal}
                            handleCancel={() => setOpenAssetDocModal(false)}
                            reloadTable={setReloadTable}
                            selectedRecordData={selectedRecordData}
                        />
                    )}
                    <ConfirmationModal
                        isOpen={openConfirmationModal}
                        handleCancel={() => setOpenConfirmationModal(false)}
                        title="Are you sure you want to delete this cheque leaf?"
                        handleSubmit={handleDeleteCompanyDoc}
                        isLoading={deleteLoader}
                    />
                </Row>
            )}
        </>
    );
};
export default ChequeLeafTable;
