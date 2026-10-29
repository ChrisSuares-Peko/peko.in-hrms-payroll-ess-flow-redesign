import { useCallback } from 'react';
import type { FC } from 'react';

import { Flex, Typography, Image } from 'antd';

import back from '@assets/svg/grayBack.svg';

interface BackNavigationProps {
    className?: string;
}

const { Text } = Typography;

const BackNavigation: FC<BackNavigationProps> = ({ className }) => {
    const handleGoBack = useCallback(() => {
        window.history.back();
    }, []);
    return (
        <Flex
            className={`${className} cursor-pointer`}
            align="center"
            gap={6}
            onClick={handleGoBack}
        >
            <Image
                src={back}
                alt="goback"
                preview={false}
                style={{ width: '1.2rem', height: '1.2rem' }}
                className="z-50"
            />
            <Text className="text-[#4D4D4D]">Go Back</Text>
        </Flex>
    );
};

export default BackNavigation;
