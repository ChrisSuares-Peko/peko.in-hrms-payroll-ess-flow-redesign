import React from 'react';

import { Button, Card, Col, Flex, Image, Row, Typography } from 'antd';
import Lottie from 'react-lottie';
import { useLocation } from 'react-router-dom';
import { ReactSVG } from 'react-svg';

import animation from '@assets/animation/EsimLoader.json';
import { formatNumberWithLocalString } from '@utils/priceFormat';

import CalenderSVG from '../assets/icons/Calender.svg';
import DataSVG from '../assets/icons/Data.svg';
import MessageSVG from '../assets/icons/Message.svg';
import PhoneSVG from '../assets/icons/Phone.svg';
import usePayment from '../hooks/usePayment';
import useGetTopUpPackages from '../hooks/useSearchTopUpPackages';
import { TopUpPlan } from '../types/TopUp';

import '../assets/style.css';

type Props = {};

const TopUp = (props: Props) => {
    const { state } = useLocation();
    const { data, conversionRate, isLoading, packagesTotal } = useGetTopUpPackages(state.iccid);
    usePayment();

    const handlePayment = (item: TopUpPlan, price: string) => {
        // handleSubmission(paymentData);
    };

    const defaultOptions = {
        loop: true,
        autoplay: true,
        animationData: animation,
        rendererSettings: {
            preserveAspectRatio: 'xMidYMid slice',
        },
    };

    return (
        <>
            {isLoading ? (
                <Lottie options={defaultOptions} height={400} width={600} isClickToPauseDisabled />
            ) : (
                <Row>
                    <Col span={24}>
                        <Typography.Text className="font-medium">
                            {data && data.length === 0
                                ? 'No top-up packages available'
                                : `Available top-up packages (${packagesTotal})`}
                        </Typography.Text>
                    </Col>
                    <Col span={24}>
                        <Row gutter={[30, 20]} className="mt-6">
                            {data &&
                                data.map((item: TopUpPlan, i: number) => (
                                    <Col key={i} xs={24} sm={12} md={8} lg={8} xl={6}>
                                        <Card
                                            size="small"
                                            className="flex flex-col justify-between h-full p-2 rounded-xl scale_on_hover"
                                            key={i}
                                            bodyStyle={{
                                                display: 'flex',
                                                flexDirection: 'column',
                                                alignItems: 'center',
                                                height: '100%',
                                            }}
                                        >
                                            <Flex vertical className="w-full">
                                                <Image
                                                    src={state.image}
                                                    preview={false}
                                                    className="object-cover w-full"
                                                />
                                                <Typography.Text className="m-2 text-lg font-medium text-center text-red-500">
                                                    {state.operator}
                                                </Typography.Text>
                                                <Flex vertical gap={10} className="w-full m-2 mt-4">
                                                    <Flex>
                                                        <ReactSVG src={PhoneSVG} />
                                                        <Typography.Text className="text-xs ms-2 text-textGrey">
                                                            Voice :{' '}
                                                            {item?.voice
                                                                ? `${item?.voice} min`
                                                                : 'N/A'}
                                                        </Typography.Text>
                                                    </Flex>
                                                    <Flex>
                                                        <ReactSVG src={MessageSVG} />
                                                        <Typography.Text className="text-xs ms-2 text-textGrey">
                                                            SMS : {item?.text ?? 'N/A'}
                                                        </Typography.Text>
                                                    </Flex>
                                                    <Flex>
                                                        <ReactSVG src={DataSVG} />
                                                        <Typography.Text className="text-xs ms-2 text-textGrey">
                                                            Data : {item?.data ?? 'N/A'}
                                                        </Typography.Text>
                                                    </Flex>
                                                    <Flex>
                                                        <ReactSVG src={CalenderSVG} />
                                                        <Typography.Text className="text-xs ms-2 text-textGrey">
                                                            Validity :{' '}
                                                            {/* {`${item?.day} Days` ?? 'N/A'} */}
                                                        </Typography.Text>
                                                    </Flex>
                                                </Flex>
                                                <Button
                                                    onClick={() =>
                                                        handlePayment(
                                                            item,
                                                            (item.price * conversionRate).toFixed(2)
                                                        )
                                                    }
                                                    className="w-full my-4"
                                                    size="large"
                                                    danger
                                                >
                                                    <Typography.Text className="w-full text-sm font-medium text-center text-red-500">
                                                        ₹{' '}
                                                        {formatNumberWithLocalString(
                                                            item.price * conversionRate
                                                        )}
                                                    </Typography.Text>
                                                </Button>
                                            </Flex>
                                        </Card>
                                    </Col>
                                ))}
                        </Row>
                    </Col>
                </Row>
            )}
        </>
    );
};

export default TopUp;
