import { Typography } from 'antd';

interface Props {
    leftLabel: string;
    leftValue: string;
    rightLabel: string;
    rightValue: string;
}

const SummaryBar = ({ leftLabel, leftValue, rightLabel, rightValue }: Props) => (
    <div className="flex gap-3 mb-4">
        <div className="flex-1 px-6 py-4 bg-[#F8FAFC] rounded-[10px] flex flex-col items-center">
            <Typography.Text
                className="text-xs font-medium block mb-1"
                style={{ color: '#475569' }}
            >
                {leftLabel}
            </Typography.Text>
            <Typography.Text className="font-bold" style={{ fontSize: 22, color: '#16a34a' }}>
                {leftValue}
            </Typography.Text>
        </div>
        <div className="flex-1 px-6 py-4 bg-[#F8FAFC] rounded-[10px] flex flex-col items-center">
            <Typography.Text
                className="text-xs font-medium block mb-1"
                style={{ color: '#475569' }}
            >
                {rightLabel}
            </Typography.Text>
            <Typography.Text className="font-bold" style={{ fontSize: 22, color: '#dc2626' }}>
                {rightValue}
            </Typography.Text>
        </div>
    </div>
);

export default SummaryBar;
