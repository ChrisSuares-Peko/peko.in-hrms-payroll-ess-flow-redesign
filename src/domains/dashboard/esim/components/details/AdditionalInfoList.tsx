import React from 'react';

import { Col, Typography, Flex, List, Row } from 'antd';

import { useAppSelector } from '@src/hooks/store';

import { Country } from '../../types/packagesList';

type Props = {
    network: string | undefined;
    planType: string | undefined;
    eKyc: boolean | undefined;
    topUpOption: boolean | undefined;
    countries: Country[] | undefined;
};

const AdditionalInfoList = ({ eKyc, network, planType, topUpOption, countries }: Props) => {
    const esimType = useAppSelector(state => state.reducer.esim.searchData);

    const countryTitle = esimType.esimType === 'local' ? 'Country' : 'Countries';

    const additionalInfo = [
        {
            title: 'Service Operator',
            content: network,
        },
        {
            title: 'Sim Type',
            content: planType,
        },
        {
            title: 'eKYC (Identity Verification)',
            content: eKyc === true ? 'Required' : 'Not Required',
            // 'The validity period starts when the eSIM connects to any supported network/s.',
        },
        {
            title: 'Top-up Option',
            content: topUpOption === true ? 'Available' : 'Not Available',
        },
        {
            title: countryTitle,
            content: countries && countries.map(item => item.title).join(', '), // Join country titles into a string
        },
    ];

    return (
        <Col className="mt-8" span={24}>
            <Typography.Text className="text-textBlack font-medium text-base">
                Additional Information
            </Typography.Text>
            <Flex vertical>
                <List
                    className="mt-6"
                    dataSource={additionalInfo}
                    renderItem={(item, index) => (
                        <Row
                            className={`py-3 px-6 
            ${
                index % 2 === 0 ? 'bg-listBg' : 'bg-white'
            } ${index === additionalInfo.length - 1 ? '' : 'border-none'} rounded-md`}
                        >
                            <Col span={24}>
                                <Flex>
                                    <Typography.Text className="text-gray-600 text-sm xs:w-36 sm:w-64">
                                        {item.title}
                                    </Typography.Text>
                                    <Typography.Text className="text-gray-600 text-sm xs:w-32  sm:w-[48rem]">
                                        {item.content}
                                    </Typography.Text>
                                </Flex>
                            </Col>
                        </Row>
                    )}
                />
            </Flex>
        </Col>
    );
};

export default AdditionalInfoList;
