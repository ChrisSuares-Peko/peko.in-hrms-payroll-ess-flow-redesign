import { ReactNode } from 'react';

import { Flex, Typography } from 'antd';

type Tone = 'success' | 'warning' | 'neutral';

type StatsCardProps = {
    bgClass: string;
    icon: ReactNode;
    value: ReactNode;
    label: string;
    badge: { text: string; tone: Tone };
};

const toneClass: Record<Tone, string> = {
    success: 'text-textGreen',
    warning: 'text-amber-600',
    neutral: 'text-gray-500',
};

const StatsCard = ({ bgClass, icon, value, label, badge }: StatsCardProps) => (
    <div className={`${bgClass} rounded-3xl p-6 h-44 relative`}>
        <span
            className={`absolute right-4 top-4 px-3 py-1 bg-white rounded-full text-xs font-medium ${toneClass[badge.tone]}`}
        >
            {badge.text}
        </span>
        <Flex vertical gap={4} className="h-full">
            <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center text-lg text-zinc-800">
                {icon}
            </div>
            <div className="mt-auto">
                <Typography.Text className="block text-2xl font-bold text-zinc-800 leading-tight">
                    {value}
                </Typography.Text>
                <Typography.Text className="text-sm text-black">{label}</Typography.Text>
            </div>
        </Flex>
    </div>
);

export default StatsCard;
