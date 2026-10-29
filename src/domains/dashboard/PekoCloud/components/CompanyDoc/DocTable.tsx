import React, { useState } from 'react';

import { SearchOutlined } from '@ant-design/icons';
import { Button, Col, Flex, Input, Pagination, Row, Table } from 'antd';

import ConfirmationModal from '../../../../../components/molecular/modals/ConfirmationModal';
import { useDeleteCompanyDocApi } from '../../hooks/companyDocHooks/useDeleteCompanyDocApi';
import useDownloadDocument from '../../hooks/useDownloadDocumentApi';
import { companyDocColumn } from '../../utils/companyDoc';
import CompanyDocModal from '../Modals/CompanyDocModal';

interface CompanyDocTableProps {
    setReloadTable: React.Dispatch<React.SetStateAction<boolean>>;
    orderCount?: number;
    tableLoading: boolean;
    tableDatas: any;
    handleSearch: any;
    handlePageChange: any;
    page: number;
    limit: number;
}

const DocTable = ({
    setReloadTable,
    orderCount,
    tableLoading,
    tableDatas,
    handlePageChange,
    handleSearch,
    limit,
    page,
}: CompanyDocTableProps) => {
    const [openDocModal, setOpenDocModal] = useState(false);
    const [loadingRows, setLoadingRows] = useState({});
    const [openConfirmationModal, setOpenConfirmationModal] = useState(false);
    const [selectedRecordData, setSelectedRecordData] = useState<any | null>(null);

    const { deleteCompanyDocData, isLoading: deleteLoader } = useDeleteCompanyDocApi({
        handleCancel: () => setOpenConfirmationModal(false),
    });
    const { handleDocumentDownload } = useDownloadDocument();

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

    const HandleDelete = (selectedRow: any) => {
        setSelectedRecordData(selectedRow);
        setOpenConfirmationModal(true);
    };

    const handleDeleteCompanyDoc = async () => {
        await deleteCompanyDocData(selectedRecordData?.id!);
        setSelectedRecordData(null);
        setReloadTable(p => !p);
    };

    const handleEdit = async (selectedRowData: any) => {
        setSelectedRecordData(selectedRowData);
        setOpenDocModal(true);
    };

    return (
        <Row>
            <Col span={24} className="py-10">
                <Flex vertical className="">
                    <Row gutter={[15, 16]} className="justify-between xs:mt-10 md:mt-0">
                        <Col span={17} md={18} xl={19} xxl={20}>
                            <Input
                                placeholder="Search for documents"
                                suffix={<SearchOutlined />}
                                className="rounded-none"
                                onChange={handleSearch}
                                allowClear
                            />
                        </Col>
                        <Col span={7} md={6} xl={5} xxl={4}>
                            <Button
                                onClick={() => {
                                    setSelectedRecordData(null);
                                    setOpenDocModal(true);
                                }}
                                type="primary"
                                danger
                                className="w-full test-xs"
                            >
                                Add New Document
                            </Button>
                        </Col>
                    </Row>

                    <Table
                        className="mt-7"
                        scroll={{ x: 568 }}
                        dataSource={tableDatas}
                        columns={companyDocColumn(
                            HandleDelete,
                            handleEdit,
                            handleDocDownload,
                            loadingRows
                        )}
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
            {openDocModal && (
                <CompanyDocModal
                    open={openDocModal}
                    handleCancel={() => setOpenDocModal(false)}
                    reloadTable={setReloadTable}
                    selectedRecordData={selectedRecordData}
                />
            )}
            <ConfirmationModal
                isOpen={openConfirmationModal}
                handleCancel={() => setOpenConfirmationModal(false)}
                title="Are you sure you want to delete this document?"
                handleSubmit={handleDeleteCompanyDoc}
                isLoading={deleteLoader}
            />
        </Row>
    );
};

export default DocTable;
