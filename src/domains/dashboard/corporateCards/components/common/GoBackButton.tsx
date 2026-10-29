import type { FC } from 'react';

import { Flex, Image, Typography } from 'antd';

import back from '@assets/svg/grayBack.svg';

const { Text } = Typography;

interface GoBackButtonProps {
    onClick: () => void;
    className?: string;
}

const GoBackButton: FC<GoBackButtonProps> = ({ onClick, className }) => (
    <Flex
        role="button"
        tabIndex={0}
        className={`${className ?? ''} w-fit cursor-pointer`}
        align="center"
        gap={6}
        onClick={onClick}
        onKeyDown={event => {
            if (event.key === 'Enter' || event.key === ' ') {
                event.preventDefault();
                onClick();
            }
        }}
    >
        <Image src={back} alt="" preview={false} style={{ width: '1.2rem', height: '1.2rem' }} />
        <Text className="text-[#4D4D4D]">Go Back</Text>
    </Flex>
);

export default GoBackButton;
