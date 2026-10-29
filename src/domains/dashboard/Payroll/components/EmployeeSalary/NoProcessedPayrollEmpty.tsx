import { FileTextOutlined } from '@ant-design/icons';
import { Button, Flex, Typography } from 'antd';

interface NoProcessedPayrollEmptyProps {
    onRunPayroll: () => void;
}

const NoProcessedPayrollEmpty = ({ onRunPayroll }: NoProcessedPayrollEmptyProps) => (
    <Flex
        vertical
        align="center"
        gap={12}
        style={{ padding: '60px 0', background: '#f8fafc', borderRadius: 12 }}
    >
        <FileTextOutlined style={{ fontSize: 36, color: '#cbd5e1' }} />
        <Typography.Text style={{ fontSize: 15, fontWeight: 600, color: '#1e293b' }}>
            Payroll hasn&apos;t been processed for this month yet
        </Typography.Text>
        <Typography.Text style={{ fontSize: 13, color: '#64748b' }}>
            Run payroll for the selected cycle to see employees here.
        </Typography.Text>
        <Button
            type="primary"
            danger
            onClick={onRunPayroll}
            style={{ marginTop: 8, borderRadius: 8 }}
        >
            Run Payroll
        </Button>
    </Flex>
);

export default NoProcessedPayrollEmpty;
