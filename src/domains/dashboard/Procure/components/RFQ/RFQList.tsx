import React, { useEffect, useState } from 'react';

import { Card, Col, Pagination, Row, Typography } from 'antd';
import { useLocation, useNavigate } from 'react-router-dom';

import GenericTable from '@components/atomic/GenericTable';
import ConfirmationModal from '@components/molecular/modals/ConfirmationModal';
import { paths } from '@src/routes/paths';

import RFQHeader from './RFQHeader';
import useFilter from '../../hooks/useFilter';
import { useRFQ } from '../../hooks/useRFQ';
import { getRFQColumns } from '../../utils/RFQColumns';

const { Title } = Typography;

const initialFilters = {
    search: '',
    status: undefined as string | undefined,
    type: undefined as string | undefined,
    page: 1,
    limit: 10,
};

const RFQList: React.FC = () => {
    const [filters, setFilters] = useState(initialFilters);
    const [closeTarget, setCloseTarget] = useState<any>(null);
    const [reopenTarget, setReopenTarget] = useState<any>(null);
    const navigate = useNavigate();

    const location = useLocation();
    const { isLoading, tableData, count, close, reopen, fetchRFQs } = useRFQ(undefined, filters);
    const { handleSearch, handleStatusChange, handlePageChange } = useFilter({ setFilter: setFilters });

    useEffect(() => { fetchRFQs(); }, [location.key, fetchRFQs]);

    const handleConfirmClose = async () => {
        if (!closeTarget) return;
        const result = await close(closeTarget.id);
        if (result) fetchRFQs();
        setCloseTarget(null);
    };

    const handleConfirmReopen = async () => {
        if (!reopenTarget) return;
        const result = await reopen(reopenTarget.id);
        if (result) fetchRFQs();
        setReopenTarget(null);
    };

    const columns = getRFQColumns(
        row => navigate(`${paths.dashboard.procure}/rfq/${row.id}`),
        row => setCloseTarget(row),
        row => setReopenTarget(row)
    );

    return (
        <>
        <Row gutter={[0, 16]}>
            <Col span={24}>
               <Card className="rounded-3xl w-full !border-gray-100" styles={{ body: { padding: 32 }  }}>
                    <Row gutter={[0, 16]}>
                        <Col span={24}>
                            <Row gutter={[12, 12]} align="middle">
                                <Col xs={24} lg={5}>
                                    <Title level={4} style={{ fontWeight: 600, color: '#171717', marginBottom: 0 }}>
                                        Requests for Quotes
                                    </Title>
                                </Col>
                                <Col xs={24} lg={19} style={{ display: 'flex', justifyContent: 'flex-end' }}>
                                    <RFQHeader
                                        search={filters.search}
                                        onStatusChange={handleStatusChange}
                                        onSearch={handleSearch}
                                        onNewRequest={() => navigate(`${paths.dashboard.procure}/${paths.procure.rfq.index}/${paths.procure.rfq.create}`)}
                                    />
                                </Col>
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
            </Col>
        </Row>

        <ConfirmationModal
            isOpen={!!closeTarget}
            title="Close RFQ"
            description="Are you sure you want to close this RFQ?"
            handleSubmit={handleConfirmClose}
            handleCancel={() => setCloseTarget(null)}
            isLoading={isLoading}
        />

        <ConfirmationModal
            isOpen={!!reopenTarget}
            title="Re-open this RFQ?"
            description={`Re-opening ${reopenTarget?.refNumber} will move it back to Active and allow new proposals.`}
            handleSubmit={handleConfirmReopen}
            handleCancel={() => setReopenTarget(null)}
            isLoading={isLoading}
        />
        </>
    );
};

export default RFQList;
