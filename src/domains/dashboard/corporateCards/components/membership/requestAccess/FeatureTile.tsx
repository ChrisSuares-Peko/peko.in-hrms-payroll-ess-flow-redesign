import { ReactNode } from 'react';

import { Typography } from 'antd';

const { Text } = Typography;

interface FeatureTileProps {
    title: string;
    description: string;
    children: ReactNode;
}

const FeatureTile = ({ title, description, children }: FeatureTileProps) => (
    <div className="relative flex min-h-60 flex-col overflow-hidden rounded-3xl bg-iconBgRed pt-5 xl:min-h-64">
        <div className="flex flex-col gap-2 px-5">
            <Text className="text-base font-medium text-black xl:text-lg">{title}</Text>
            <Text className="text-xs text-black xl:text-sm">{description}</Text>
        </div>
        <div className="relative mt-3 min-h-28 flex-1">{children}</div>
    </div>
);

export default FeatureTile;
