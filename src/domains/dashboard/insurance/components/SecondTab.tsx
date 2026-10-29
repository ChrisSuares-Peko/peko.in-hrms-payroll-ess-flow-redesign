import React from 'react';

import { Col, Flex, Typography } from 'antd';
import Search from 'antd/es/input/Search';
import { ReactSVG } from 'react-svg';

import buildingRed from '@src/domains/dashboard/insurance/assets/svg/buildingRed.svg';
import markerRed from '@src/domains/dashboard/insurance/assets/svg/markerRed.svg';

import TabDetailsSection from './TabDetailsSection';
import { hospitalData } from '../utils/data';

const SecondTab = () => (
    <Col span={24} className="my-5 ">
        <Flex>
            <Typography.Text className="text-base font-normal">
                4 Cashless hospitals in &nbsp;
            </Typography.Text>
            <Typography.Text className="font-normal text-base flex text-bgOrange2">
                Kottayam <ReactSVG src={markerRed} width={20} className="mx-2" />
            </Typography.Text>
        </Flex>
        <Col sm={8} className="my-6">
            <Search placeholder="input search text" className="w-full rounded-none " />
        </Col>
        <TabDetailsSection icon={buildingRed} details={hospitalData} />
    </Col>
);

export default SecondTab;
