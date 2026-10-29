import React, { useEffect, useState } from 'react';

import { ArrowLeftOutlined, SearchOutlined } from '@ant-design/icons';
import { Button, Col, Input, Pagination, Row, Space, Typography } from 'antd';
import { useNavigate } from 'react-router-dom';

import GenericTable from '@components/atomic/GenericTable';
import { paths } from '@src/routes/paths';

import PayInvoiceModal from '../../Procure/components/Invoicing/PayInvoiceModal';
import useFilter from '../../Procure/hooks/useFilter';
import { useInvoice } from '../../Procure/hooks/useInvoice';
import { usePaymentLinkOnboarding } from '../../Procure/hooks/usePaymentLinkOnboarding';
import { invoicingColumns } from '../../Procure/utils/InvoicingColumns';

const { Title, Text } = Typography;

const initialFilters = { searchText: '', page: 1, limit: 10 };

const BillPayoutPage: React.FC = () => {
    const navigate = useNavigate();
    const [filters, setFilters] = useState(initialFilters);
    const [payingInvoice, setPayingInvoice] = useState<any | null>(null);

    const {  fetchStatus } = usePaymentLinkOnboarding();
    // const isVirtualAccountReady = record?.status === 'active';

    const { handlePageChange } = useFilter({ setFilter: setFilters });
    const { tableData, total: count, isLoading } = useInvoice(filters);

    useEffect(() => { fetchStatus(); }, [fetchStatus]);

    const columns = invoicingColumns(
        (id, invoiceNumber) => navigate(`${paths.dashboard.procure}/${paths.procure.invoicing.index}/${id}`, { state: { invoiceNumber } }),
        (row) => setPayingInvoice(row),
    );

    return (
        <Space direction="vertical" size={24} className="w-full p-5 md:p-7">
            <Row justify="space-between" align="middle">
                <Col>
                    <Space direction="vertical" size={2}>
                        <Title level={4} className="m-0">Bill Payout</Title>
                        <Text type="secondary">Pay vendor invoices from your procure module</Text>
                    </Space>
                </Col>
                <Col>
                    <Button icon={<ArrowLeftOutlined />} onClick={() => navigate(paths.dashboard.payout)}>
                        Back
                    </Button>
                </Col>
            </Row>

            <Input
                placeholder="Search"
                suffix={<SearchOutlined />}
                allowClear
                value={filters.searchText}
                onChange={e => setFilters(prev => ({ ...prev, searchText: e.target.value, page: 1 }))}
                maxLength={100}
            />

            <GenericTable
                columns={columns}
                dataSource={tableData}
                rowKey="id"
                loading={isLoading}
                scroll={{ x: 900 }}
                pagination={false}
            />

            <Pagination
                current={filters.page}
                size="default"
                className="text-end"
                onChange={handlePageChange}
                total={count}
                pageSize={filters.limit}
                showSizeChanger={false}
            />

            <PayInvoiceModal
                open={!!payingInvoice}
                invoice={payingInvoice}
                onConfirm={() => setPayingInvoice(null)}
                onCancel={() => setPayingInvoice(null)}
            />
        </Space>
    );
};

export default BillPayoutPage;
