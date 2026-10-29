import React, { useState } from 'react';

import { Card, Col, Pagination, Row, Typography } from 'antd';
import { useNavigate } from 'react-router-dom';

import GenericTable from '@components/atomic/GenericTable';
import ConfirmationModal from '@components/molecular/modals/ConfirmationModal';
import { paths } from '@src/routes/paths';

import PurchaseRequestHeader from './PurchaseRequestHeader';
import useFilter from '../../hooks/useFilter';
import { usePurchaseRequestApi } from '../../hooks/usePurchaseRequestApi';
import { getPurchaseRequestColumns } from '../../utils/PurchaseRequestColumns';

const { Title } = Typography;

const initialFilters = {
    search: '',
    status: undefined as string | undefined,
    startDate: undefined as string | undefined,
    endDate: undefined as string | undefined,
    page: 1,
    limit: 10,
};

const PurchaseRequestList: React.FC = () => {
    const [filters, setFilters] = useState(initialFilters);
    const [cancelRow, setCancelRow] = useState<any>(null);
    const [reopenRow, setReopenRow] = useState<any>(null);

    const { isLoading, tableData, count, cancel, reopen, fetchData } = usePurchaseRequestApi(undefined, filters);
    const { handleSearch, handleStatusChange, handleDateChange, handlePageChange } = useFilter({ setFilter: setFilters });

    const navigate = useNavigate();

    const handleNewRequest = () =>
        navigate(`${paths.dashboard.procure}/${paths.procure.purchaseRequests.index}/${paths.procure.purchaseRequests.create}`);

    const handleView = (row: any) =>
        navigate(`${paths.dashboard.procure}/${paths.procure.purchaseRequests.index}/${row.id}`);

    const handleViewLinkedRFQ = (row: any) =>
        navigate(`${paths.dashboard.procure}/${paths.procure.rfq.index}/${row.rfqId}`);

    const handleViewLinkedPO = (row: any) => {
        const poId = row.purchaseOrders?.[0]?.id;
        if (poId) navigate(`${paths.dashboard.procure}/${paths.procure.purchaseOrders.index}/${poId}`);
    };

    const handleContinue = (row: any) =>
        navigate(`${paths.dashboard.procure}/${paths.procure.purchaseRequests.index}/${row.id}/edit`);

    const handleCancelConfirm = async () => {
        if (cancelRow) {
            const success = await cancel(cancelRow.id);
            if (success) fetchData();
        }
        setCancelRow(null);
    };

    const handleReopenConfirm = async () => {
        if (reopenRow) {
            const success = await reopen(reopenRow.id);
            if (success) fetchData();
        }
        setReopenRow(null);
    };

    const columns = getPurchaseRequestColumns({
        onView: handleView,
        onViewLinkedRFQ: handleViewLinkedRFQ,
        onViewLinkedPO: handleViewLinkedPO,
        onContinue: handleContinue,
        onCancel: (row) => setCancelRow(row),
        onReopen: (row) => setReopenRow(row),
    });

    return (
        <>
        <ConfirmationModal
            isOpen={!!cancelRow}
            handleCancel={() => setCancelRow(null)}
            title="Cancel this purchase request?"
            description={`${cancelRow?.refNumber} will be moved to Cancelled. You can re-open it later if needed.`}
            handleSubmit={handleCancelConfirm}
            isLoading={isLoading}
        />
        <ConfirmationModal
            isOpen={!!reopenRow}
            handleCancel={() => setReopenRow(null)}
            title="Re-open this purchase request?"
            description={`${reopenRow?.refNumber} will move back to Open and become editable again.`}
            handleSubmit={handleReopenConfirm}
            isLoading={isLoading}
        />
        <Card bordered={false} className="rounded-3xl w-full" style={{ boxShadow: '0 2px 8px 0 rgba(0,0,0,0.08)' }} styles={{ body: { padding: 'clamp(12px, 4vw, 32px)' } }}>
            <Row gutter={[0, 16]}>
                <Col span={24}>
                    <Row justify="space-between" align="middle" className="w-full gap-3">
                        <Title level={4} style={{ fontWeight: 600, marginBottom: 0 }}>
                            Purchase Request
                        </Title>
                        <PurchaseRequestHeader
                            search={filters.search}
                            onSearch={handleSearch}
                            onStatusChange={handleStatusChange}
                            onDateChange={handleDateChange}
                            onNewRequest={handleNewRequest}
                        />
                    </Row>
                </Col>

                <Col span={24} style={{ overflowX: 'auto' }}>
                    <GenericTable
                        columns={columns}
                        dataSource={tableData}
                        rowKey="id"
                        loading={isLoading}
                        className="w-full"
                        bordered={false}
                        pagination={false}
                    />
                </Col>

                <Col span={24}>
                    <Pagination
                        current={filters.page}
                        size="default"
                        className="text-end"
                        onChange={handlePageChange}
                        total={count}
                        pageSize={filters.limit}
                        showSizeChanger={false}
                    />
                </Col>
            </Row>
        </Card>
        </>
    );
};

export default PurchaseRequestList;
