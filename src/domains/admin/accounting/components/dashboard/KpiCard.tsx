import { ReactNode } from 'react';

import { Card, Flex, Typography } from 'antd';
import { useNavigate } from 'react-router-dom';

import { KpiTone } from '../../utils/dashboardData';

type KpiCardProps = {
    title: string;
    value: string;
    icon: ReactNode;
    tone?: KpiTone;
    to?: string;
    help?: ReactNode;
};

const valueTone: Record<KpiTone, string> = {
    default: 'text-textHeadings',
    danger: 'text-red-600',
    warning: 'text-amber-600',
};

const iconTone: Record<KpiTone, string> = {
    default: 'text-textHeadings',
    danger: 'text-red-600',
    warning: 'text-amber-600',
};

const KpiCard = ({ title, value, icon, tone = 'default', help, to }: KpiCardProps) => {
    const navigate = useNavigate();

    return (
        <Card
            className={`w-full h-full border-0 shadow-none bg-bgIconCard rounded-xl ${
                to ? 'cursor-pointer transition-shadow hover:shadow-md' : ''
            }`}
            onClick={to ? () => navigate(to) : undefined}
        >
            <Flex gap={14} align="center" className="h-full">
                <Flex
                    align="center"
                    justify="center"
                    className={`w-10 h-10 shrink-0 bg-white rounded-full text-lg ${iconTone[tone]}`}
                >
                    {icon}
                </Flex>
                <Flex vertical gap={4} className="min-w-0">
                    <Typography.Text className="text-[13px] text-textBody">
                        {title}
                        {help}
                    </Typography.Text>
                    <Typography.Text className={`text-lg font-semibold ${valueTone[tone]}`}>
                        {value}
                    </Typography.Text>
                </Flex>
            </Flex>
        </Card>
    );
};

export default KpiCard;
