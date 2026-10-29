import { Card, DatePicker, Flex, Spin, Table, Typography } from 'antd';
import type { Dayjs } from 'dayjs';
import dayjs from 'dayjs';

import type { VirtualAccountStatementApiRow } from '../types/paymentLinkTypes';
import { statementColumns } from '../utils/data';

const { RangePicker } = DatePicker;

interface VirtualAccountStatementTabProps {
    isLoading: boolean;
    rows: VirtualAccountStatementApiRow[];
    page: number;
    dateRange: [Dayjs, Dayjs];
    onPageChange: (page: number) => void;
    onDateRangeChange: (values: [Dayjs | null, Dayjs | null] | null) => void;
}

const VirtualAccountStatementTab = ({
    isLoading,
    rows,
    page,
    dateRange,
    onPageChange,
    onDateRangeChange,
}: VirtualAccountStatementTabProps) => (
    <Card className="rounded-xl !shadow-[0px_1.2px_12.4px_1.1px_rgba(0,0,0,0.06)]" bordered={false}>
        <Flex vertical gap={16}>
            <Flex justify="space-between" align="center" wrap="wrap" gap={12}>
                <Flex vertical gap={4}>
                    <Typography.Text className="text-base font-semibold text-[#1F2A44]">
                        Statement Entries
                    </Typography.Text>
                    <Typography.Text className="text-sm text-[#667085]">
                        Showing transactions for the selected period
                    </Typography.Text>
                </Flex>
                <RangePicker
                    value={dateRange}
                    onChange={onDateRangeChange}
                    disabledDate={current => current && current.isAfter(dayjs(), 'day')}
                    allowClear={false}
                    format="DD MMM YYYY"
                />
            </Flex>

            <Spin spinning={isLoading}>
                <div className="overflow-x-auto">
                    <Table
                        columns={statementColumns}
                        dataSource={rows}
                        pagination={{
                            current: page,
                            pageSize: 20,
                            onChange: onPageChange,
                            showSizeChanger: false,
                            hideOnSinglePage: true,
                        }}
                        rowKey="key"
                        className="rounded-xl"
                        scroll={{ x: 'max-content' }}
                        locale={{ emptyText: 'No transactions found for this period' }}
                    />
                </div>
            </Spin>
        </Flex>
    </Card>
);

export default VirtualAccountStatementTab;
