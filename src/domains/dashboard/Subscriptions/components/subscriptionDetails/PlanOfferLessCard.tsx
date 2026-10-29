import React from 'react';

import { Button, Flex, List, Typography } from 'antd';
import { Content } from 'antd/es/layout/layout';
import { useNavigate } from 'react-router-dom';

import { AddressCardProps } from '@domains/dashboard/Subscriptions/types/types';
import { paths } from '@src/routes/paths';
import '../../assets/styles/styles.css';
import { formatNumberWithLocalString } from '@utils/priceFormat';

import { getUserDisplayText } from '../../utils/data';

const { Text, Paragraph } = Typography;

const PlanOfferLessCard = ({
    title,
    period,
    amount,
    monthlyCost,
    offer,
    features,
    id,
    noOfUser,
}: AddressCardProps) => {
    const navigate = useNavigate();

    // Convert amount to number and format to two decimal places
    // const formattedAmount = parseFloat(amount).toFixed();
    const data = features?.split('\n');
    const handleSubmit = () => {
        navigate(`${paths.subscriptions.companyDetails}/${id}`);
    };
    const formattedAmount = formatNumberWithLocalString(amount);

    return (
        <Content className="relative h-full p-6 pt-5 border address-card pb-15 rounded-xl _scale_on_hover">
            <Flex justify="space-between" className="h-full" vertical>
                <Flex vertical>
                    <Text className="text-lg font-normal">{title}</Text>
                    <Text className="mt-3 text-3xl font-medium">{`₹ ${formattedAmount}`}</Text>
                    <Paragraph className="mt-2 text-gray-400 lg:mt-5 mb-9">
                        {period} {getUserDisplayText(noOfUser)}
                    </Paragraph>
                    <List
                        size="small"
                        dataSource={data}
                        bordered={false}
                        split={false}
                        header={null}
                        className="my-3 text-xs bulleted-list"
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
    );
};

export default PlanOfferLessCard;
