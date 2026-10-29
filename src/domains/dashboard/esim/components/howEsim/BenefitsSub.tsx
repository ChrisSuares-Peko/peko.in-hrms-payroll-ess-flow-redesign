import React from 'react';

import { Badge, Flex, Space, Typography } from 'antd';
import { ReactSVG } from 'react-svg';

import EsimSVG from '../../assets/icons/SimSVG.svg';

type Props = {};

const BenefitsSub = (props: Props) => (
    <Flex gap={20} vertical>
        <ReactSVG src={EsimSVG} />
        <Typography.Text className="text-sm font-normal">
            Installing your new eSIM is a simple and speedy process. Upon completing your purchase,
            you{`'`}ll receive an email from the eSIM provider containing an installation guide. The
            eSIM installation is entirely digital, requiring no physical intervention on your phone,
            and it{`'`}s safe to retain your physical SIM card throughout the process.
        </Typography.Text>
        <Typography.Text className="text-sm font-normal">
            Both iPhone and Android devices seamlessly integrate the installation of eSIM cards
        </Typography.Text>
        {/* <Typography.Text className="text-sm font-normal">
            Please note:
            <br /> - No computer is required for the purchase or installation, as both can be
            completed directly on your phone.
            <br /> - The installation is entirely digital, eliminating the need to wait for a
            physical SIM card.
            <br /> - The installation can be performed anywhere in the world, even after arriving at
            your destination.
        </Typography.Text> */}
        <Typography.Text className="text-sm font-normal">
            <Space direction="vertical">
                Please note:
                <Badge
                    color="#111"
                    text="No computer is required for the purchase or installation, as both can be
                    completed directly on your phone."
                />
                <Badge
                    color="#111"
                    text="The installation is entirely digital, eliminating the need to wait for a
                    physical SIM card."
                />
                <Badge
                    color="#111"
                    text="The installation can be performed anywhere in the world, even after arriving at
                    your destination."
                />
            </Space>
        </Typography.Text>
        <Typography.Text className="text-sm font-normal">
            Throughout the installation, minor adjustments to your settings are needed. The
            following guide will assist you through each step, enabling you to get online within
            minutes.
        </Typography.Text>
    </Flex>
);

export default BenefitsSub;
