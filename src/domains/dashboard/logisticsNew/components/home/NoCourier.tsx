import React from 'react';

import { Flex, Typography } from 'antd';
import { ReactSVG } from 'react-svg';

import noCourier from '../../assets/no-courier.svg';

type props = {
    message?: string;
};
const NoCourier = ({ message }: props) => (
    <Flex vertical align="center" justify="center">
        <ReactSVG src={noCourier} />
        <Typography.Text>
            {message || 'Sorry no shipping agents found in this route'}
        </Typography.Text>
    </Flex>
);

export default NoCourier;
