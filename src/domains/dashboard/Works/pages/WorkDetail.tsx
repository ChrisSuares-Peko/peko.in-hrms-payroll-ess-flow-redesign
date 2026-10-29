import React from 'react';

import { Col, Empty, Flex, Image, Row, Skeleton, Typography } from 'antd';
import { Link, useParams } from 'react-router-dom';

import useScreenSize from '@src/hooks/useScreenSize';
import { formatNumberWithLocalString } from '@utils/priceFormat';

import headset from '../assets/svg/headset.svg';
import PlanCard from '../components/PlanCard';
import { useDetailsApi } from '../hooks/useDetailsApi';
import { usePlansApi } from '../hooks/usePlansApi';

const WorkDetail = () => {
    const { id } = useParams();
    const { data, isLoading } = useDetailsApi(id);
    const { name = '', description = '' } = data || {};
    const { data: plansData, isLoading: isPlansLoading } = usePlansApi(id);
    const { md } = useScreenSize();
    // const slidesToShow = data?.portfolio.length;

    return (
        <Flex vertical gap={20} className="">
            {isLoading ? (
                <Flex align="center" justify="center">
                    <Skeleton className="w-10/12 flex justify-center" paragraph={{ rows: 6 }} />
                </Flex>
            ) : (
                <>
                    <Flex justify="center" align="center">
                        <Typography.Text className="text-gray-500 font-semibold text-lg md:text-xl">
                            {name}
                        </Typography.Text>
                    </Flex>
                    <Flex justify="center" align="center" className="px-1 md:px-12">
                        <Typography.Text className="font-medium text-center px-1 md:px-3 text-xl sm:text-2xl md:text-3xl">
                            {description}
                        </Typography.Text>
                    </Flex>
                    <Flex justify="center" align="center">
                        <Typography.Text className="font-semibold text-base sm:text-xl">
                            Choose a Plan
                        </Typography.Text>
                    </Flex>
                </>
            )}
            <Row justify="center" gutter={[20, 20]} className="lg:px-11 xl:px-0 xxl:px-24">
                {isPlansLoading
                    ? Array.from({ length: 3 }).map((_, index) => (
                          <Col xs={24} sm={12} md={12} lg={12} xl={8} key={index}>
                              <Skeleton className="w-full" paragraph={{ rows: 15 }} />
                          </Col>
                      ))
                    : plansData.map((value, index) => (
                          <PlanCard
                              key={index}
                              planId={value.id}
                              planName={value.name}
                              billingCycle={value.billingCycle}
                              description={value.description}
                              price={formatNumberWithLocalString(value.price)}
                              feature={value.features}
                              workId={id}
                              isPopular={value.popular}
                          />
                      ))}

                {!isPlansLoading && plansData.length === 0 && (
                    <Flex className="py-32">
                        <Empty
                            image={Empty.PRESENTED_IMAGE_SIMPLE}
                            description={<span>No plans available</span>}
                        />
                    </Flex>
                )}
            </Row>

            <Flex
                align="center"
                justify="center"
                gap={10}
                className={`border-t border-t-gray-300 py-5 ${md ? 'flex-row' : 'flex-col'}`}
            >
                <Image src={headset} preview={false} height={25} />
                <Typography.Text className="text-base font-medium">
                    For Custom Services
                </Typography.Text>
                <Link to="/need-help">
                    <Typography.Text className="cursor-pointer hover:underline text-base text-bgOrange2">
                        Contact Sales
                    </Typography.Text>
                </Link>
            </Flex>
        </Flex>
    );
};
export default WorkDetail;
