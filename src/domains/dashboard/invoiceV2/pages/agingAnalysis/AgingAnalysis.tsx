import React from 'react';

import { Col, Flex, Row, Typography } from 'antd';

import AgingBucketChart from '../../components/agingAnalysis/AgingBucketChart';
import AgingHistoryTable from '../../components/agingAnalysis/AgingHistoryTable';
import AgingStatsRow from '../../components/agingAnalysis/AgingStatsRow';
import PaidVsOutstandingChart from '../../components/agingAnalysis/PaidVsOutstandingChart';
import { useAgingAnalysis } from '../../hooks/agingAnalysis/useAgingAnalysis';

const AgingAnalysis: React.FC = () => {
    const {
        summary,
        filteredBuckets,
        filterOptions,
        paidVsOutstanding,
        invoiceRows,
        totalRecords,
        isLoadingAgingAnalysis,
        timePeriod,
        page,
        pageSize,
        onTimePeriodChange,
        onPageChange,
        onSortChange,
    } = useAgingAnalysis();

    return (
        <Flex vertical gap={24} className="p-6">
            <Flex vertical gap={4}>
                <Typography.Title level={4} className="!mb-0 !font-bold !text-gray-900">
                    Analytics
                </Typography.Title>
                <Typography.Text className="text-sm text-gray-500">
                    Track outstanding receivables by age and payment status
                </Typography.Text>
            </Flex>

            <AgingStatsRow
                totalOutstanding={summary.outstanding}
                outstandingDelta={summary.outstandingDelta}
                totalOverdue={summary.overdue}
                overdueDelta={summary.overdueDelta}
                paidThisMonth={summary.paid}
                paidDelta={summary.paidDelta}
                avgDaysToPay={summary.avgDaysToPay}
                isLoading={isLoadingAgingAnalysis}
            />

            <Row gutter={[16, 16]} className="mt-4">
                <Col xs={24} lg={16}>
                    <AgingBucketChart data={filteredBuckets} height={220} />
                </Col>
                <Col xs={24} lg={8}>
                    {paidVsOutstanding && (
                        <PaidVsOutstandingChart data={paidVsOutstanding} height={220} />
                    )}
                </Col>
            </Row>

            <AgingHistoryTable
                invoices={invoiceRows}
                total={totalRecords}
                page={page}
                pageSize={pageSize}
                isLoading={isLoadingAgingAnalysis}
                onPageChange={onPageChange}
                onSortChange={onSortChange}
                filterOptions={filterOptions}
                selectedFilter={timePeriod}
                onFilterChange={onTimePeriodChange}
            />
        </Flex>
    );
};

export default AgingAnalysis;
