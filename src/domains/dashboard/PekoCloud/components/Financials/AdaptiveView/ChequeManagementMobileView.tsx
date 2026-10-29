import { FC, useState } from 'react';

import { SearchOutlined } from '@ant-design/icons';
import { Card, Col, Flex, Input, Pagination, Row, Typography, Empty, Skeleton, Button } from 'antd';

import ConfirmationModal from '@components/molecular/modals/ConfirmationModal';

import ChequeManagementMobileCard from './ChequeManagementMobileCard';
import { useDeleteChequeLeafApi } from '../../../hooks/financialDocHooks/useDeleteChequeLeafApi';
import ChequeLeafModal from '../../Modals/ChequeLeafModal';

interface ChequeManagementMobileProps {
    searchText?: string | null;
    setReloadTable: React.Dispatch<React.SetStateAction<boolean>>;
    orderCount?: number;
    tableLoading: boolean;
    tableDatas: any;
    handleSearch: any;
    handlePageChange: any;
    page: number;
    limit: number;
    reloadInfo: React.Dispatch<React.SetStateAction<boolean>>;
    handleDocDownload: (record: any) => void;
    loadingRows: any;
}

const ChequeManagementMobileView: FC<ChequeManagementMobileProps> = ({
    searchText,
    setReloadTable,
    orderCount,
    tableLoading,
    tableDatas,
    handlePageChange,
    handleSearch,
    reloadInfo,
    limit,
    page,
    handleDocDownload,
    loadingRows,
}) => {
    const [openChequeModal, setOpenChequeModal] = useState(false);
    const [openConfirmationModal, setOpenConfirmationModal] = useState(false);
    const [selectedRecordData, setSelectedRecordData] = useState<any | null>(null);

    const { deleteChequeLeafData, isLoading } = useDeleteChequeLeafApi({
        handleCancel: () => setOpenConfirmationModal(false),
    });
    const HandleDelete = (selectedRow: any) => {
        setSelectedRecordData(selectedRow);
        setOpenConfirmationModal(true);
    };
    const handleDeleteChequeLeaf = async () => {
        await deleteChequeLeafData(selectedRecordData?.id!);
        setSelectedRecordData(null);
        setReloadTable(p => !p);
        reloadInfo(p => !p);
    };
    const handleEdit = async (selectedRowData: any) => {
        setSelectedRecordData(selectedRowData);
        setOpenChequeModal(true);
    };

    const renderSkeleton = () => <Skeleton active paragraph={{ rows: 3 }} />;

    let tableContent;
    if (tableLoading) {
        tableContent = Array.from({ length: 10 }).map((_, index) => (
            <Card size="small" className="mt-4 h-40 bg-slate-50 border-none p-2" key={index}>
                <Flex className="w-full" gap={5} vertical>
                    {renderSkeleton()}
                </Flex>
            </Card>
        ));
    } else if (tableDatas.length === 0) {
        tableContent = <Empty description="No data available" />;
    } else {
        tableContent = tableDatas.map((item: any, index: number) => (
            <ChequeManagementMobileCard
                key={index}
                item={item}
                handleEdit={handleEdit}
                handleDelete={HandleDelete}
                handleDocDownload={handleDocDownload}
                loadingRows={loadingRows}
            />
        ));
    }

    return (
        <Flex vertical gap={20} className="">
            <Row justify="space-between" align="middle" gutter={[20, 20]}>
                <Col xs={24} sm={12} md={6} className="text-right">
                    <Button
                        onClick={() => {
                            setSelectedRecordData(null);
                            setOpenChequeModal(true);
                        }}
                        type="primary"
                        danger
                        className="w-fit px-7"
                    >
                        Add Cheque
                    </Button>
                </Col>
                <Col xs={24} sm={12} md={6}>
                    <Input
                        placeholder="Search for cheque leaves"
                        suffix={<SearchOutlined />}
                        allowClear
                        type="text"
                        maxLength={100}
                        onChange={handleSearch}
                    />
                </Col>
            </Row>
            <Row align="middle" className="p-5 rounded-md bg-bgLightGray">
                <Col xs={12}>
                    {' '}
                    <Flex justify="start">
                        <Typography.Text className="text-[#475467] font-medium">
                            Cheque Book No
                        </Typography.Text>
                    </Flex>
                </Col>

                <Col xs={12}>
                    {' '}
                    <Flex justify="center">
                        {' '}
                        <Typography.Text className="text-[#475467] font-medium">
                            Status
                        </Typography.Text>
                    </Flex>
                </Col>
            </Row>
            {tableContent}
            <Pagination
                onChange={handlePageChange}
                size="small"
                className="text-center mt-10"
                total={orderCount}
            />
            {openChequeModal && (
                <ChequeLeafModal
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
                title="Are you sure you want to delete this cheque?"
                handleSubmit={handleDeleteChequeLeaf}
                isLoading={isLoading}
            />
        </Flex>
    );
};

export default ChequeManagementMobileView;
