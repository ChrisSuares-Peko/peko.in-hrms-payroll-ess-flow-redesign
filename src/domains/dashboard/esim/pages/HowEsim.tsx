import React from 'react';

import { Divider, Flex } from 'antd';

import Benefits from '../components/howEsim/Benefits';
import BenefitsSub from '../components/howEsim/BenefitsSub';
import HowEsimCard from '../components/howEsim/HowEsimCard';
import Installation from '../components/howEsim/Installation';
import Welcome from '../components/howEsim/Welcome';

type Props = {};

const HowEsim = (props: Props) => (
    // <Row className="gap-6 p-0 m-0">
    <Flex gap={30} vertical>
        <Welcome />
        <Divider className="p-0 m-0 -ml-10" style={{ width: '105%' }} />
        <HowEsimCard />
        <Benefits />
        <BenefitsSub />
        <Installation />
    </Flex>
    // </Row>
);

export default HowEsim;
