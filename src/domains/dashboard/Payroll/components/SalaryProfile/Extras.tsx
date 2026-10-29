import React from 'react';

import { Flex } from 'antd';

import BonusAndIncentives from './BonusAndIncentives';
import Overtime from './Overtime';

const Extras = () => (
    <Flex vertical gap={40}>
        <BonusAndIncentives />
        <Overtime />
    </Flex>
);

export default Extras;
