import React from 'react';

import { Badge, Button, Flex, List, Typography } from 'antd';
import { Content } from 'antd/es/layout/layout';
import { useNavigate } from 'react-router-dom';

import { AddressCardProps } from '@domains/dashboard/Subscriptions/types/types';
import useScreenSize from '@src/hooks/useScreenSize';
import { paths } from '@src/routes/paths';
import '../../assets/styles/styles.css';
import { formatNumberWithLocalString } from '@utils/priceFormat';

import { getUserDisplayText } from '../../utils/data';

const { Text, Paragraph } = Typography;

const PlanOfferCard = ({
    title,
    period,
    amount = '0',
    monthlyCost,
    offer,
    features,
    id,
    noOfUser,
}: AddressCardProps) => {
    const navigate = useNavigate();
    const handleSubmit = () => {
        navigate(`/${paths.subscriptions.index}/${paths.subscriptions.companyDetails}/${id}`);
    };
    const data = features?.split('\n');
    const { sm } = useScreenSize();

    const placement = sm ? undefined : 'start';
    const formattedAmount = formatNumberWithLocalString(amount);
    return (
        <Badge.Ribbon text={offer} color="green" placement={placement}>
            <Content className="relative h-full p-6 pt-5 border address-card pb-15 rounded-xl _scale_on_hover">
                <Flex justify="space-between" className="h-full" vertical>
                    <Flex vertical>
                        <Text className="text-lg font-normal">{title}</Text>
                        <Text
                            data-testid="amount"
                            className="mt-3 text-3xl font-medium"
                        >{`₹ ${formattedAmount}`}</Text>
                        <Paragraph className="mt-2 text-gray-400 lg:mt-5 mb-9">
                            {period} {getUserDisplayText(noOfUser)}
                        </Paragraph>
                        <List
                            size="small"
                            dataSource={data}
                            bordered={false}
                            split={false}
                            header={null}
                            className="my-3 bulleted-list"
                            renderItem={item => (
                                <List.Item style={{ paddingLeft: '0' }}> {item}</List.Item>
                            )}
                        />
                    </Flex>
                    <Button
                        type="primary"
                        danger
                        onClick={handleSubmit}
                        className="w-full mx-auto mt-auto xs:block"
                    >
                        Purchase
                    </Button>
                </Flex>
            </Content>
        </Badge.Ribbon>
    );
};

export default PlanOfferCard;
