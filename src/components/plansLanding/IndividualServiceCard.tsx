import React from 'react';

import { AppstoreOutlined } from '@ant-design/icons';
import { Button, Flex, Typography } from 'antd';

import type { IndividualServiceView } from '@utils/plansLandingData';

import { serviceIcons } from './serviceIcons';

interface Props {
    service: IndividualServiceView;
    onSubscribe: (service: IndividualServiceView) => void;
}

const IndividualServiceCard: React.FC<Props> = ({ service, onSubscribe }) => {
    const iconSrc = (service.iconKey && serviceIcons[service.iconKey]) || service.logo;

    return (
        <Flex
            vertical
            gap={12}
            className="h-full rounded-2xl border border-borderGray bg-white p-6 transition-[transform,box-shadow] duration-200 ease-out hover:-translate-y-1 hover:shadow-[0_8px_24px_rgba(0,0,0,0.08)] motion-reduce:transform-none motion-reduce:transition-none"
        >
            {iconSrc ? (
                <img src={iconSrc} alt="" aria-hidden className="h-11 w-11 object-contain" />
            ) : (
                <Flex
                    align="center"
                    justify="center"
                    className="h-11 w-11 rounded-lg bg-bgLightGray text-xl text-textGray"
                >
                    <AppstoreOutlined />
                </Flex>
            )}

            <Flex vertical gap={6} className="flex-grow">
                <Typography.Text className="text-base font-semibold text-textHeadings">
                    {service.name}
                </Typography.Text>
                <Typography.Text className="line-clamp-2 text-sm text-textGray">
                    {service.description}
                </Typography.Text>
            </Flex>

            <Flex align="center" justify="space-between" gap={8} wrap="wrap">
                <Flex align="baseline" gap={4}>
                    <Typography.Text className="text-lg font-semibold text-textHeadings">
                        {service.priceLabel}
                    </Typography.Text>
                    <Typography.Text className="text-xs text-textGray">
                        {service.pricePeriod}
                    </Typography.Text>
                </Flex>
                {service.isOwned ? (
                    <Button disabled className="!rounded-lg !font-medium">
                        Subscribed
                    </Button>
                ) : (
                    <Button
                        onClick={() => onSubscribe(service)}
                        className="!rounded-lg !border-lightRed !font-medium !text-lightRed !transition-colors !duration-200 hover:!bg-lightRed hover:!text-white motion-reduce:!transition-none"
                    >
                        Subscribe
                    </Button>
                )}
            </Flex>
        </Flex>
    );
};

export default IndividualServiceCard;
