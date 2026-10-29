import React from 'react';

import { Carousel, Col, Flex, Image, Row, Typography } from 'antd';
import { ReactSVG } from 'react-svg';

import ListIcon from '../assets/icons/ListIcon.svg';
import Slide1Img from '../assets/images/Paytm-BPOS-1.png';
import Slide2Img from '../assets/images/Paytm-BPOS-2.png';
import { firstCaroselItems, secondCaroselItems, thirdCaroselItems } from '../utils/index';

const ListItem = ({ text }: { text: string }) => (
    <Flex align="center" gap="middle">
        <ReactSVG src={ListIcon} />
        <Typography.Text className="text-valueText text-sm">{text}</Typography.Text>
    </Flex>
);

const FlexItem = ({ iconSrc, text }: { text: string; iconSrc: string }) => (
    <Col className="text-center text-xs flex flex-col items-center mt-6 w-1/2  sm:w-1/3 md:w-1/4 xl:w-1/5">
        <ReactSVG src={iconSrc} />
        <Typography.Text className="text-valueText text-xs lg:text-sm text-center mt-5">
            {text}
        </Typography.Text>
    </Col>
);

const SlideCards = () => (
    <Carousel
        slidesToShow={1}
        autoplay
        autoplaySpeed={40000}
        dots={{
            className: 'custom-slick-dots-paytmbpos',
        }}
        speed={300}
        effect="scrollx"
    >
        <Col className="rounded-xl border border-1  border-gray-200 bg-bgLightGrayFD" span={24}>
            <Row className="w-full h-full">
                <Col xl={16} className="p-5 sm:p-10">
                    <Typography.Text className="text-valueText text-base md:text-lg xl:text-xl font-semibold">
                        Why choose Paytm Billing Software for your business?
                    </Typography.Text>
                    <Flex vertical className="my-4" justify="space-between" gap="middle">
                        {firstCaroselItems.map((text, index) => (
                            <ListItem key={index} text={text} />
                        ))}
                    </Flex>
                </Col>
                <Col xl={8} className="p-10 hidden xl:block h-80">
                    <Image preview={false} src={Slide1Img} height="100%" />
                </Col>
            </Row>
        </Col>
        <Col className="rounded-xl border border-1 border-gray-200 bg-bgLightGrayFD">
            <Row className="w-full h-full">
                <Col xl={16} className="p-5 sm:p-10">
                    <Typography.Text className="text-valueText text-base md:text-lg xl:text-xl font-semibold">
                        Insightful Reports For Data Driven Decisions
                    </Typography.Text>
                    <Flex vertical className="my-4" justify="space-between" gap="middle">
                        {secondCaroselItems.map((text, index) => (
                            <ListItem key={index} text={text} />
                        ))}
                    </Flex>
                </Col>
                <Col xl={8} className="p-10 hidden xl:block h-80">
                    <Image preview={false} src={Slide2Img} height="100%" />
                </Col>
            </Row>
        </Col>
        <Col className="xl:h-[21rem] p-5 xl:p-10 rounded-xl border border-1 border-gray-200 bg-bgLightGrayFD">
            <Typography.Text className="text-valueText text-base md:text-lg xl:text-xl font-semibold">
                Unique features to give your business a competitive edge
            </Typography.Text>
            <Row>
                {thirdCaroselItems.map((item, index) => (
                    <FlexItem key={index} iconSrc={item.iconSrc} text={item.text} />
                ))}
            </Row>
        </Col>
    </Carousel>
);

export default SlideCards;
