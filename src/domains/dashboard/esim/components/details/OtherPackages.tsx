import React from 'react';

import { Col, Typography, Row, Card, Flex, Button } from 'antd';
import { useNavigate } from 'react-router-dom';

import { paths } from '@src/routes/paths';
import { formatNumberWithLocalString } from '@utils/priceFormat';

import { Package } from '../../types/packagesList';

type Props = {
    packages: Package[] | undefined;
    conversionRate: number;
    state: any;
};

const OtherPackages = ({ packages, conversionRate, state }: Props) => {
    const navigate = useNavigate();

    return (
        <Col className="mt-8" span={24}>
            <Typography.Text className="text-textBlack font-medium text-base sm:text-lg md:text-xl">
                {packages && `Other available Packages (${packages.length})`}
            </Typography.Text>
            <Row gutter={[10, 10]} className="mt-6">
                {packages &&
                    packages.map((item, i) => (
                        <Col
                            key={i}
                            xs={24}
                            sm={12}
                            md={8}
                            lg={8}
                            xl={6}
                            xxl={4}
                            className="flex justify-center"
                        >
                            <Card size="small" className="rounded-lg w-full">
                                <Typography.Text className="text-red-500 font-medium text-sm sm:text-base whitespace-nowrap">
                                    {item.title}
                                </Typography.Text>
                                <Flex gap={10} className="mt-2" justify="space-between" align="end">
                                    <Flex gap={10} vertical>
                                        <Typography.Text className="text-textBlack font-thin text-xs sm:text-sm whitespace-nowrap">
                                            Data: {item.data}
                                        </Typography.Text>
                                        <Typography.Text className="text-textBlack font-thin text-xs sm:text-sm whitespace-nowrap">
                                            Voice: {item?.voice ? `${item?.voice} min` : 'N/A'}
                                        </Typography.Text>
                                        <Typography.Text className="text-textBlack font-thin text-xs sm:text-sm whitespace-nowrap">
                                            SMS: {item?.text ?? 'N/A'}
                                        </Typography.Text>
                                        <Typography.Text className="text-textBlack font-thin text-xs sm:text-sm whitespace-nowrap">
                                            Validity: {`${item.day} Days`}
                                        </Typography.Text>

                                        <Button
                                            onClick={() => {
                                                navigate(
                                                    `${paths.dashboard.corporateTravel}/${paths.esim.index}/${paths.esim.packages}/${paths.esim.ReplacePackage}`,
                                                    {
                                                        state: {
                                                            price: item.price,
                                                            title: item.title,
                                                            data: item.data,
                                                            item: item.id,
                                                            country: state.country,
                                                            esimType: state.esimType,
                                                            id: item.id,
                                                            region: state.region,
                                                        },
                                                    }
                                                );
                                                window.scrollTo({
                                                    top: 0,
                                                    left: 0,
                                                    behavior: 'smooth',
                                                });
                                            }}
                                            danger
                                            className="text-xs sm:text-sm"
                                        >
                                            Buy for ₹{' '}
                                            {formatNumberWithLocalString(
                                                item.price * conversionRate
                                            )}
                                        </Button>
                                    </Flex>
                                </Flex>
                            </Card>
                        </Col>
                    ))}
            </Row>
        </Col>
    );
};

export default OtherPackages;
