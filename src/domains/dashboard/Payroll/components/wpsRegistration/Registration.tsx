import type { FC } from 'react';

import { Flex, Image, Typography } from 'antd';

import WpsLogo from '../../assets/images/wps.png';

interface RegistrationProps {}

const Registration: FC<RegistrationProps> = () => (
    <Flex vertical>
        <Flex gap={20} align="center">
            <Image preview={false} src={WpsLogo} height={40} width={40} />
            <Typography.Text className={`font-medium sm:text-xl `}>
                Business Registration with Lulu
            </Typography.Text>
        </Flex>
    </Flex>
);

export default Registration;
