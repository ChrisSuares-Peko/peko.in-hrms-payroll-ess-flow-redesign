import React from 'react';

import { Button, Flex, Image, Typography } from 'antd';
import { Link } from 'react-router-dom';

import { paths } from '@src/routes/paths';

const { Text } = Typography;
interface AlertCardProps {
    title: string;
    value: string;
    image: string;
    linkUrl?: string;
}
const AlertCard = ({ title, value, image, linkUrl }: AlertCardProps) => {
    let buttonText;
    switch (title) {
        case 'Monthly Spending':
        case 'Cashback':
            buttonText = 'View Transaction';
            break;
        case 'DED Renewal':
            buttonText = 'Renew License';
            break;
        default:
            buttonText = 'Pay Now';
    }

    let linkPath;
    switch (title) {
        case 'Monthly Spending':
        case 'Cashback':
            linkPath = paths.dashboard.reports;
            break;
        case 'DED Renewal':
            linkPath = paths.dashboard.licenseRenewal;
            break;
        case 'Order Pending':
            linkPath = paths.dashboard.officeSupplies;
            break;
        default:
            linkPath = linkUrl ?? paths.dashboard.billPayments;
    }
    return (
        <Flex
            vertical
            className="h-full px-3 py-3 mr-2 bg-white border border-gray-200 border-solid rounded-md sm:px-5 md:py-6 md:rounded-2xl md:ml-1 md:mr-1 xxl:max-w-56"
            gap={14}
        >
            <Flex className="w-10 h-10 rounded-full bg-gray-50" align="center" justify="center">
                <Image src={image} loading="lazy" preview={false} />
            </Flex>
            <Flex vertical gap={2} className="min-w-0">
                <Text className="overflow-hidden text-xs font-semibold text-ellipsis whitespace-nowrap">
                    {title || 'Alert'}
                </Text>
                <Flex
                    className="overflow-hidden whitespace-normal h-12 text-ellipsis"
                    style={{
                        WebkitLineClamp: 2,
                        display: '-webkit-box',
                        WebkitBoxOrient: 'vertical',
                        lineHeight: '1.5em',
                        maxHeight: '4.5em',
                        fontSize: '0.65rem',
                    }}
                >
                    {value || ' '}
                </Flex>
            </Flex>

            <Link to={linkPath}>
                <Flex className="w-full mt-auto" justify="end">
                    <Button danger size="small" className="w-full ">
                        {buttonText}
                    </Button>
                </Flex>
            </Link>
        </Flex>
    );
};

export default AlertCard;
