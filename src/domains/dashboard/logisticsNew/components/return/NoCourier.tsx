import React from 'react';

import { Flex, Typography } from 'antd';
import { ReactSVG } from 'react-svg';

import noCourier from '../../assets/no-courier.svg';

const NoCourier = () => (
    <Flex vertical align="center" justify="center">
        <ReactSVG src={noCourier} />
        <Typography.Text>
            This company does not service the selected route. Please choose another delivery
            provider.
        </Typography.Text>
    </Flex>
);

export default NoCourier;
