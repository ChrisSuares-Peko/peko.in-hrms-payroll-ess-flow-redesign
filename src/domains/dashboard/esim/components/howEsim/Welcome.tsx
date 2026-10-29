import React from 'react';

import { Flex, Typography } from 'antd';

type Props = {};

const Welcome = (props: Props) => (
    <Flex gap={10} vertical>
        <Typography.Text className="text-xl font-medium">Welcome to eSIM</Typography.Text>
        <Typography.Text className="text-base font-normal">
            eSIM, short for embedded SIM, is a technology that allows you to activate a mobile plan
            without needing a physical SIM card. <br /> Instead of inserting a SIM card into your
            device, eSIM is built into the device itself, enabling you to connect to a mobile
            network seamlessly.
        </Typography.Text>
    </Flex>
);

export default Welcome;
