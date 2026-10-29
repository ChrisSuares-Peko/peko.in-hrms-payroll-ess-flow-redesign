import { Typography } from 'antd';

export const GrayText = ({ text }: { text: string }) => (
    <Typography.Text className="text-neutral-500 text-[.81rem] font-normal">{text}</Typography.Text>
);

export const BoldText = ({ text }: { text: string }) => (
    <Typography.Text className="text-[.81rem] font-medium">{text}</Typography.Text>
);
