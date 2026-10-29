import React from 'react';

import { Flex, Typography } from 'antd';

type Props = {};

const Welcome = (props: Props) => (
    <Flex gap={10} vertical>
        <Typography.Text className="text-sm sm:text-base font-normal">
            Float is a global eSIM service, provided by Peko.
            <br /> Float is designed to simplify connectivity for travellers and businesses. With
            Float, users can easily purchase eSIMs and stay connected while traveling across
            different parts of the world, eliminating the need for physical SIM cards, or dealing
            with local carriers. It offers seamless, borderless connectivity that is ideal for
            businesses with employees who frequently travel or operate internationally.
        </Typography.Text>
        <Typography.Text className="text-lg sm:text-xl font-medium mt-5">
            Key features
        </Typography.Text>
        <Typography.Text className="text-sm sm:text-base font-normal">
            Global Coverage: Access to a wide range of networks in various countries without
            changing SIMs. <br />
            Business-Focused: Tailored plans and solutions for enterprises, ensuring reliable and
            cost-effective communication for teams on the go. <br />
            Instant Activation: Users can instantly buy and activate eSIMs on Peko, ensuring
            uninterrupted connectivity. <br />
            Flexible Plans: Float offers customizable data plans suited for both short-term trips
            and extended stays, perfect for business travellers needing consistent access.
        </Typography.Text>
        <Typography.Text className="text-sm sm:text-base font-normal">
            With Float, businesses can manage multiple eSIMs for their teams, streamline
            communication, and reduce roaming costs.
        </Typography.Text>
    </Flex>
);

export default Welcome;
