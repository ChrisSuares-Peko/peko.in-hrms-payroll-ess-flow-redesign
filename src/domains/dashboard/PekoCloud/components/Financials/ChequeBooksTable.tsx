import React, { useState } from 'react';

import { SearchOutlined } from '@ant-design/icons';
import { Button, Col, Flex, Input, Pagination, Row, Table } from 'antd';

import useScreenSize from '@src/hooks/useScreenSize';

import ChequeBooksMobileView from './AdaptiveView/ChequeBooksMobileView';
import ConfirmationModal from '../../../../../components/molecular/modals/ConfirmationModal';
import { useDeleteChequeBookApi } from '../../hooks/financialDocHooks/useDeleteChequeBookApi';
import { useGetAllChequeBooksApi } from '../../hooks/financialDocHooks/useListChequeBooksApi';
import useDownloadDocument from '../../hooks/useDownloadDocumentApi';
import { chequeBooksColumn } from '../../utils/financial';
import useFilter from '../../utils/useFilter';
import ChequeBookModal from '../Modals/ChequeBookModal';

interface ChequeBookTableProps {
    reloadInfo: React.Dispatch<React.SetStateAction<boolean>>;
}
const ChequeBooksTable = ({ reloadInfo }: ChequeBookTableProps) => {
    const screen = useScreenSize();
    const [openChequeModal, setOpenChequeModal] = useState(false);
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
    const { tableDatas, orderCount, tableLoading } = useGetAllChequeBooksApi(
        filter.page,
        filter.limit,
        reloadTable,
        filter.searchText
    );
    const { deleteChequeBookData, isLoading } = useDeleteChequeBookApi({
        handleCancel: () => setOpenConfirmationModal(false),
    });
    const HandleDelete = (selectedRow: any) => {
        setSelectedRecordData(selectedRow);
        setOpenConfirmationModal(true);
    };
    const handleDeleteChequeBook = async () => {
        await deleteChequeBookData(selectedRecordData?.id!);
        setSelectedRecordData(null);
        setReloadTable(p => !p);
        reloadInfo(p => !p);
    };
    const handleEdit = async (selectedRowData: any) => {
        setSelectedRecordData(selectedRowData);
        setOpenChequeModal(true);
    };
    const { handleDocumentDownload } = useDownloadDocument();
    const handleDocDownload = async (record: any) => {
        setLoadingRows(prev => ({ ...prev, [record.id]: true }));
        try {
            await handleDocumentDownload(record.document, `Cheque Book - ${record.bookId}`);
        } finally {
            setLoadingRows(prev => ({ ...prev, [record.id]: false }));
        }
    };

    return (
        <>
            {screen.xs ? (
                <ChequeBooksMobileView
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
                    <Col span={24} className="py-10">
                        <Flex vertical className="">
                            <Row gutter={[15, 16]} className="justify-between xs:mt-10 md:mt-0">
                                <Col span={17} md={18} xl={19} xxl={20}>
                                    <Input
                                        placeholder="Search for cheque books"
                                        suffix={<SearchOutlined />}
                                        className="rounded-none "
                                        onChange={handleSearch}
                                    />
                                </Col>
                                <Col span={7} md={6} xl={5} xxl={4}>
                                    <Button
                                        onClick={() => {
                                            setSelectedRecordData(null);
                                            setOpenChequeModal(true);
                                        }}
                                        className="w-full test-xs"
                                        type="primary"
                                        danger
                                    >
                                        Add Cheque Book
                                    </Button>
                                </Col>
                            </Row>

                            <Table
                                className="mt-7"
                                scroll={{ x: 568 }}
                                dataSource={tableDatas.map(item => ({ key: item.id, ...item }))}
                                columns={chequeBooksColumn(
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
                    {openChequeModal && (
                        <ChequeBookModal
                            open={openChequeModal}
                            handleCancel={() => setOpenChequeModal(false)}
                            reloadTable={setReloadTable}
                            selectedRecordData={selectedRecordData}
                            reloadInfo={reloadInfo}
                        />
                    )}
                    <ConfirmationModal
                        isOpen={openConfirmationModal}
                        handleCancel={() => setOpenConfirmationModal(false)}
                        title="Are you sure you want to delete this cheque book?"
                        handleSubmit={handleDeleteChequeBook}
                        isLoading={isLoading}
                    />
                </Row>
            )}
        </>
    );
};
export default ChequeBooksTable;
