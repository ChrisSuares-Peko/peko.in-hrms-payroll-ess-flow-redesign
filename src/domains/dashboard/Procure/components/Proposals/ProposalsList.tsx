import React, { useState } from 'react';

import { Card, Col, Pagination, Row, Typography } from 'antd';
import { useNavigate } from 'react-router-dom';

import GenericTable from '@components/atomic/GenericTable';
import { paths } from '@src/routes/paths';

import ProposalsHeader from './ProposalsHeader';
import useFilter from '../../hooks/useFilter';
import { useProposals } from '../../hooks/useProposals';
import { getProposalColumns } from '../../utils/ProposalColumns';

const { Title } = Typography;

const initialFilters = {
    search: '',
    status: undefined as string | undefined,
    startDate: undefined as string | undefined,
    endDate: undefined as string | undefined,
    page: 1,
    limit: 10,
};

const ProposalsList: React.FC = () => {
    const navigate = useNavigate();
    const [filters, setFilters] = useState(initialFilters);

    const { allProposals, allCount, isLoading, fetchAllProposals } = useProposals({ filters });
    const { handleSearch, handlePageChange } = useFilter({ setFilter: setFilters });

    const columns = getProposalColumns(
        (id, rfqId) => navigate(`${paths.dashboard.procure}/${paths.procure.proposals.index}/${id}?rfqId=${rfqId}`),
    );

    return (
        <Card className="rounded-3xl w-full !border-gray-100" styles={{ body: { padding: 32 }  }}>
            <Row gutter={[0, 16]}>
                <Col span={24}>
                    <Row justify="space-between" align="middle">
                        <Col className="mb-2 mr-10">
                            <Title level={4} style={{ fontWeight: 600, marginBottom: 0 }}>Proposals</Title>
                            <Typography.Text type='secondary'>Review and compare vendor proposals. Accept the best one to create a PO.</Typography.Text>
                        </Col>
                        <Col flex="auto">
                            <ProposalsHeader
                                searchText={filters.search}
                                onSearch={handleSearch}
                                onRefresh={fetchAllProposals}
                            />
                        </Col>
                    </Row>
                </Col>

                <Col span={24}>
                    <GenericTable
                        columns={columns}
                        dataSource={allProposals}
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
                        total={allCount}
                        pageSize={filters.limit}
                        showSizeChanger={false}
                    />
                </Col>
            </Row>
        </Card>
    );
};

export default ProposalsList;
