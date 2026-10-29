import React from 'react';

import { Flex, Typography } from 'antd';
import { twMerge } from 'tailwind-merge';

type Props = {
    icon?: React.ReactNode;
    outerClass?: string;
    middleClass?: string;
    innerClass?: string;
    title: string;
    description?: string;
};

const OUTER_DEFAULT = 'w-[72px] h-[72px] rounded-full';
const MIDDLE_DEFAULT = 'w-14 h-14 rounded-full';
const INNER_DEFAULT = 'w-10 h-10 rounded-full';

const CenteredHeader: React.FC<Props> = ({
    icon,
    outerClass,
    middleClass,
    innerClass,
    title,
    description,
}) => {
    const renderIcon = () => {
        if (!icon) return null;

        // 1 layer — no middle or inner provided
        if (!middleClass && !innerClass) {
            return (
                <Flex justify="center" align="center" className={twMerge(OUTER_DEFAULT, outerClass)}>
                    {icon}
                </Flex>
            );
        }

        // 2 layers — no middle, only inner
        if (!middleClass && innerClass !== undefined) {
            return (
                <Flex justify="center" align="center" className={twMerge(OUTER_DEFAULT, outerClass)}>
                    <Flex justify="center" align="center" className={twMerge(MIDDLE_DEFAULT, innerClass)}>
                        {icon}
                    </Flex>
                </Flex>
            );
        }

        // 3 layers — outer + middle + inner
        return (
            <Flex justify="center" align="center" className={twMerge(OUTER_DEFAULT, outerClass)}>
                <Flex justify="center" align="center" className={twMerge(MIDDLE_DEFAULT, middleClass)}>
                    <Flex justify="center" align="center" className={twMerge(INNER_DEFAULT, innerClass)}>
                        {icon}
                    </Flex>
                </Flex>
            </Flex>
        );
    };

    return (
        <Flex vertical align="center" gap={12}>
            {renderIcon()}
            <Typography.Text className="text-xl font-bold text-[#101828] text-center block">
                {title}
            </Typography.Text>
            {description && (
                <Typography.Text className="text-sm text-gray-500 text-center leading-6 block">
                    {description}
                </Typography.Text>
            )}
        </Flex>
    );
};

export default CenteredHeader;
