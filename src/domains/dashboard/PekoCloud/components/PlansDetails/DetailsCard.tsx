import React from 'react';

import { Col, Divider, Flex, Row, Typography } from 'antd';
import { capitalize } from 'lodash';
import { Link } from 'react-router-dom';
import { ReactSVG } from 'react-svg';

import ExclamationCircleOutlinedAlert from '@domains/dashboard/PekoCloud/assets/icons/exclamation-circle-filled-alert.svg';
import ExclamationCircleOutlinedWarning from '@domains/dashboard/PekoCloud/assets/icons/exclamation-circle-filled.svg';
import { paths } from '@src/routes/paths';

const DetailsCard = () => (
    <Flex
        className="w-4/6 h-full  text-xs "
        justify="space-between"
        align="flex-start"
        vertical
        gap={24}
    >
        {true && ( // downgrade plan: alert usage exceeded
            <Flex
                className="p-2.5 flex gap-1 text-xs w-full"
                style={{
                    border: '#FFF6F6',
                    textAlign: 'center',
                    backgroundColor: '#FFF6F6',
                }}
            >
                <ReactSVG src={ExclamationCircleOutlinedAlert} />
                <Typography.Text className="text-xs">
                    Note: You cannot degrade when your memory is full. Delete some files and try
                    again.
                </Typography.Text>
                <Link className="text-[#FF4F4F]" to={`${paths.pekoCloud.index}`}>
                    Go to Hub dashboard {'>'}
                </Link>
            </Flex>
        )}
        <Flex
            className="w-full h-full px-10 py-8 text-xs border border-gray-200 border-solid rounded-xl"
            justify="space-between"
            align="flex-start"
            vertical
            gap={14}
        >
            <Flex justify="center" align="center" gap="middle">
                <Typography.Text className="text-lg font-medium">
                    {`Hub ${capitalize('Monthly')}`}
                </Typography.Text>

                <Typography.Text className="font-medium">
                    5 GB Free and ₹ 20/1GB/ Monthly
                </Typography.Text>
            </Flex>
            <Divider />
            <Flex justify="center" className="w-full" vertical align="center" gap="middle">
                <Row className="w-full" gutter={[0, 15]}>
                    <Col className="flex justify-between w-full">
                        <Flex className="w-1/3" justify="space-between">
                            <Typography.Text>Hub Subscription</Typography.Text>
                            <Typography.Text>{5} GB</Typography.Text>
                        </Flex>
                        <Flex className="w-1/3">
                            <Typography.Text className="">
                                ₹ {99} {capitalize('Monthly')}
                            </Typography.Text>
                        </Flex>
                    </Col>
                    <Col className="flex justify-between w-full">
                        <Flex className="w-1/3" justify="space-between">
                            <Typography.Text>Additional Memory</Typography.Text>
                            <Typography.Text>{2} GB</Typography.Text>
                        </Flex>
                        {true && ( // if plans downgrading
                            <Flex className="w-1/3 px-5" gap="small">
                                <Typography.Text className=" text-[#FF0000]">
                                    Downgrade
                                </Typography.Text>
                                <Typography.Text className=" text-[#FF0000]">
                                    {`${'01'}`} GB
                                </Typography.Text>
                            </Flex>
                        )}
                        <Flex className="w-1/3" gap="small">
                            <Typography.Text className="">
                                ₹ {40} {capitalize('Monthly')}
                            </Typography.Text>
                            {true && ( // if plans downgrading
                                <Typography.Text className="text-[#FF0000]">
                                    - ₹ {20}
                                </Typography.Text>
                            )}
                        </Flex>
                    </Col>
                </Row>
            </Flex>
            <Divider />
            <Flex justify="center" className="w-full" vertical align="center" gap="middle">
                <Row className="w-full" gutter={[0, 15]}>
                    <Col className="flex justify-between w-full">
                        <Flex className="w-1/3" justify="space-between">
                            <Typography.Text>Total Monthly Payment</Typography.Text>
                            <Typography.Text>{7} GB</Typography.Text>
                        </Flex>
                        <Flex className="w-1/3">
                            <Typography.Text className="">
                                ₹ {119} {capitalize('Monthly')}
                            </Typography.Text>
                        </Flex>
                    </Col>
                </Row>
            </Flex>
        </Flex>
        {true && ( // downgrade warning about changes take place
            <Flex
                className="p-2.5 flex gap-1 items-center text-xs w-full"
                style={{
                    border: '#FFFCEC',
                    textAlign: 'center',
                    backgroundColor: '#FFFCEC',
                }}
            >
                <ReactSVG src={ExclamationCircleOutlinedWarning} />
                <Typography.Text className="text-xs">
                    Note: Downgrading memory in Hub will be reflected after payment date of
                    subscription on {`${'19.06.2024'}`}
                </Typography.Text>
            </Flex>
        )}
    </Flex>
);

export default DetailsCard;
