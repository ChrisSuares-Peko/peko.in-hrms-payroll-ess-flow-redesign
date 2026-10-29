import React from 'react';

import { Col, Flex, Image, Row, Typography } from 'antd';

import { useAppSelector } from '@src/hooks/store';

import defaultImage from '../../Assets/defaultImage.jpg';

const Summary = () => {
    const { hotelResponse } = useAppSelector(state => state.reducer.hotels);
    const response = hotelResponse as any;
    const description = response?.HotelDetails[0]?.Description;
    const locationMatch = description.match(/<p>Location\s*:[\s\S]*?<\/p>/);

    const locationDescription = locationMatch ? locationMatch[0] : '';

    return (
        <Flex className="">
            <Row gutter={20}>
                <Col xs={24} md={10}>
                    <Image
                        loading="eager"
                        // height={screens.xxl ? 260 : 240}
                        width="100%"
                        src={
                            response.HotelDetails[0]?.Images?.[0] !== '' &&
                            response.HotelDetails[0]?.Images?.[0] !== undefined
                                ? response.HotelDetails[0]?.Images?.[0]
                                : defaultImage
                        }
                        preview={false}
                        className={`rounded-[28px] object-cover ${
                            response.HotelDetails[0]?.Images?.[0] === '' ? 'border-b border-t' : ''
                        }`}
                    />
                </Col>
                <Col xs={24} md={14}>
                    <Flex vertical gap={15}>
                        <Typography.Text className="mt-4 text-xl font-medium text-valueText xxl:text-2xl">
                            {response.HotelDetails[0].HotelName}
                        </Typography.Text>
                        <Flex align="center" gap={3}>
                            {/* <ReactSVG src={MapPin} /> */}
                            <Typography.Text className="text-sm font-normal text-textGrey xxl:text-sm">
                                {response.HotelDetails[0].Address}
                            </Typography.Text>
                        </Flex>

                        <Typography
                            dangerouslySetInnerHTML={{
                                __html: locationDescription!,
                            }}
                            className="text-sm font-light text-justify line-clamp-8"
                            style={{ lineHeight: '1.5' }}
                        />
                    </Flex>
                </Col>
            </Row>
        </Flex>
    );
};

export default Summary;
