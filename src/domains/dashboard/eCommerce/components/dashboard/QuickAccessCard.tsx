import { ReactNode } from 'react';

import { ArrowRightOutlined } from '@ant-design/icons';
import { Flex, Typography } from 'antd';

type QuickAccessCardProps = {
    icon: ReactNode;
    title: string;
    description: string;
    highlighted?: boolean;
    onClick?: () => void;
};

const QuickAccessCard = ({
    icon,
    title,
    description,
    highlighted,
    onClick,
}: QuickAccessCardProps) => (
    <button
        type="button"
        onClick={onClick}
        className={`flex-1 p-6 bg-white rounded-3xl shadow-sm border text-left transition hover:shadow-md ${
            highlighted ? 'border-lightRed' : 'border-stone-200'
        }`}
    >
        <Flex justify="space-between" align="center" gap={16}>
            <Flex vertical gap={16} align="start">
                <div className="w-16 h-16 bg-neutral-100 rounded-xl flex items-center justify-center text-2xl text-zinc-700">
                    {icon}
                </div>
                <div>
                    <Typography.Text className="block text-lg font-medium text-zinc-800">
                        {title}
                    </Typography.Text>
                    <Typography.Text className="block text-sm text-neutral-600">
                        {description}
                    </Typography.Text>
                </div>
            </Flex>
            <div className="w-8 h-8 rounded-full border border-lightRed flex items-center justify-center text-lightRed shrink-0">
                <ArrowRightOutlined className="text-sm" />
            </div>
        </Flex>
    </button>
);

export default QuickAccessCard;
