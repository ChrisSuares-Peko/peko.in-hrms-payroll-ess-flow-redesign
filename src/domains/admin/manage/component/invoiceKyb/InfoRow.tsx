import { Flex, Typography } from 'antd';

// Reusable component for displaying a labeled row
const InfoRow = ({ label, value }: { label: string; value: string | undefined }) => (
    <Flex justify="space-between" className="mt-5">
        <Typography.Text className="text-base">{label}</Typography.Text>
        <Typography.Text className="text-base">{value || 'N/A'}</Typography.Text>
    </Flex>
);
export default InfoRow;
