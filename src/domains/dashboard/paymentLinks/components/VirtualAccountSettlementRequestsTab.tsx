import { Button, Card, Flex, Table, Typography } from 'antd';

import type { SettlementRequestRow } from '../types/paymentLinkTypes';
import { settlementRequestColumns } from '../utils/data';

interface VirtualAccountSettlementRequestsTabProps {
    requests: SettlementRequestRow[];
    isLoading?: boolean;
    onCreateRequest: () => void;
}

const VirtualAccountSettlementRequestsTab = ({
    requests,
    isLoading = false,
    onCreateRequest,
}: VirtualAccountSettlementRequestsTabProps) => (
    <Card className="rounded-xl !shadow-[0px_1.2px_12.4px_1.1px_rgba(0,0,0,0.06)]" bordered={false}>
        <Flex vertical gap={16}>
            <Flex justify="space-between" align="center" wrap="wrap" gap={12}>
                <Flex vertical gap={4}>
                    <Typography.Text className="text-base font-semibold text-[#1F2A44]">
                        Settlement Requests
                    </Typography.Text>
                    <Typography.Text className="text-sm text-[#667085]">
                        Track withdrawal and settlement requests with their latest status
                    </Typography.Text>
                </Flex>

                <Button type="primary" danger onClick={onCreateRequest}>
                    Create Request
                </Button>
            </Flex>

            <div className="overflow-x-auto">
                <Table
                    columns={settlementRequestColumns}
                    dataSource={requests}
                    loading={isLoading}
                    pagination={false}
                    rowKey="key"
                    className="rounded-xl"
                    scroll={{ x: 'max-content' }}
                    locale={{ emptyText: 'No settlement requests created yet' }}
                />
            </div>
        </Flex>
    </Card>
);

export default VirtualAccountSettlementRequestsTab;
