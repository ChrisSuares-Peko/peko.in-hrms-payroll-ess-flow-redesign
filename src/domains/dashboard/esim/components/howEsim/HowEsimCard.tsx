import React from 'react';

import { Flex, Typography } from 'antd';

type Props = {};

const HowEsimCard = (props: Props) => (
    <Flex gap={15} className="bg-bgLightPink rounded-lg p-6" vertical>
        <Typography.Text className="text-xl font-medium">How does eSIM work?</Typography.Text>
        <Typography.Text className="text-sm font-normal">
            eSIM works by utilizing a small, built-in chip within your device. This chip is
            programmable, allowing you to activate a mobile plan from a network provider that
            supports eSIM. Once activated, your device can connect to the cellular network as if it
            had a traditional SIM card inserted.
        </Typography.Text>
    </Flex>
);

export default HowEsimCard;
