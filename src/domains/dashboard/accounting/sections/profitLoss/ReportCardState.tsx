import { Empty, Flex, Spin } from 'antd';

interface ReportCardStateProps {
    loading?: boolean;
    description?: string;
}

const ReportCardState = ({
    loading,
    description = 'No data for the selected period',
}: ReportCardStateProps) => (
    <Flex align="center" justify="center" className="min-h-[180px] w-full">
        {loading ? (
            <Spin />
        ) : (
            <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description={description} />
        )}
    </Flex>
);

export default ReportCardState;
