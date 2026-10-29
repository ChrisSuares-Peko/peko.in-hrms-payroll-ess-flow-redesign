import React, { useState } from 'react';

import { SearchOutlined } from '@ant-design/icons';
import { Button, Col, Flex, Input, Pagination, Row, Table } from 'antd';

import useScreenSize from '@src/hooks/useScreenSize';

import FinancialDocMobileView from './AdaptiveView/FinancialDocMobileView';
import ConfirmationModal from '../../../../../components/molecular/modals/ConfirmationModal';
import { useDeleteFinancialDocApi } from '../../hooks/financialDocHooks/useDeleteFinancialDocApi';
import { useGetAllFinancialDocApi } from '../../hooks/financialDocHooks/useListFinancialDocApi';
import useDownloadDocument from '../../hooks/useDownloadDocumentApi';
import { financialColumn } from '../../utils/financial';
import useFilter from '../../utils/useFilter';
import FinancialModal from '../Modals/FinancialModal';

interface FinancialTableProps {
    reloadInfo: React.Dispatch<React.SetStateAction<boolean>>;
}
const FinancialTable = ({ reloadInfo }: FinancialTableProps) => {
    const screen = useScreenSize();
    const [openFinancialDocModal, setOpenFinancialDocModal] = useState(false);
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
    const { tableDatas, orderCount, tableLoading } = useGetAllFinancialDocApi(
        filter.page,
        filter.limit,
        reloadTable,
        filter.searchText
    );
    const { deleteFinacialDocData, isLoading: deleteLoader } = useDeleteFinancialDocApi({
        handleCancel: () => setOpenConfirmationModal(false),
    });
    const { handleDocumentDownload } = useDownloadDocument();
    const HandleDelete = (selectedRow: any) => {
        setSelectedRecordData(selectedRow);
        setOpenConfirmationModal(true);
    };
    const handleDocDownload = async (record: {
        document: string;
        documentName: string;
        id: string;
    }) => {
        setLoadingRows(prev => ({ ...prev, [record.id]: true }));
        try {
            await handleDocumentDownload(record.document, record.documentName);
        } finally {
            setLoadingRows(prev => ({ ...prev, [record.id]: false }));
        }
    };
    const handleDeleteFinancialDoc = async () => {
        await deleteFinacialDocData(selectedRecordData?.id!);
        setSelectedRecordData(null);
        setReloadTable(p => !p);
        reloadInfo(p => !p);
    };
    const handleEdit = async (selectedRowData: any) => {
        setSelectedRecordData(selectedRowData);
        setOpenFinancialDocModal(true);
    };
    return (
        <>
            {screen.xs ? (
                <FinancialDocMobileView
                    setReloadTable={setReloadTable}
                    reloadInfo={reloadInfo}
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
                    <Col span={24} className="mt-10">
                        <Flex vertical className="">
                            <Row gutter={[15, 16]} className="justify-between xs:mt-10 md:mt-0">
                                <Col span={18} md={20}>
                                    <Input
                                        placeholder="Search for documents"
                                        suffix={<SearchOutlined />}
                                        className="w-full rounded-none"
                                        onChange={handleSearch}
                                        allowClear
                                    />
                                </Col>
                                <Col span={6} md={4}>
                                    <Button
                                        onClick={() => {
                                            setSelectedRecordData(null);
                                            setOpenFinancialDocModal(true);
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
                                dataSource={tableDatas.map(item => ({ key: item.id, ...item }))}
                                columns={financialColumn(
                                    HandleDelete,
                                    handleEdit,
                                    handleDocDownload,
                                    loadingRows
                                )}
                                size="small"
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
                    {openFinancialDocModal && (
                        <FinancialModal
                            open={openFinancialDocModal}
                            handleCancel={() => setOpenFinancialDocModal(false)}
                            reloadTable={setReloadTable}
                            selectedRecordData={selectedRecordData}
                            reloadInfo={reloadInfo}
                        />
                    )}
                    <ConfirmationModal
                        isOpen={openConfirmationModal}
                        handleCancel={() => setOpenConfirmationModal(false)}
                        title="Are you sure you want to delete this document?"
                        handleSubmit={handleDeleteFinancialDoc}
                        isLoading={deleteLoader}
                    />
                </Row>
            )}
        </>
    );
};
export default FinancialTable;
