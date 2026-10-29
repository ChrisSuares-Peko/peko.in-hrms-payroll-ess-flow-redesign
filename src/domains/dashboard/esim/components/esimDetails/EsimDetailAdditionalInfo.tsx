import React from 'react';

import { Col, Typography, Flex } from 'antd';

import AdditionalInfoTab from './AdditionalInfoTab';
import EsimTab from './EsimTab';

type Props = {
    countryName: string;
    esim: string;
    esimState?: string;
    purchasedFor?: string;
};

const EsimDetailsAdditionalInfoList = ({
    countryName,
    esim,
    esimState,
    purchasedFor,
}: Props) => (
    <Col className="mt-8" span={24}>
        <AdditionalInfoTab
            countryName={countryName}
            esim={esim}
            esimState={esimState}
            purchasedFor={purchasedFor}
        />
        <Flex vertical className="mt-10" gap={20}>
            <Typography.Text className="text-xl">Installation Guidelines:</Typography.Text>
            <EsimTab />
        </Flex>
    </Col>
);

export default EsimDetailsAdditionalInfoList;
