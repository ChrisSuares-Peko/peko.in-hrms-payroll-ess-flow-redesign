import { useState } from 'react';

import { SearchOutlined } from '@ant-design/icons';
import { Button, Col, Flex, Input, Row, Tooltip, Typography } from 'antd';
// import clevertap from 'clevertap-web-sdk';
import { useNavigate } from 'react-router-dom';

import { useAppDispatch } from '@src/hooks/store';
import { paths } from '@src/routes/paths';
import { showToast } from '@src/slices/apiSlice';
import { removeEmoji } from '@utils/regex';

const { logistics } = paths;

const Header = () => {
    const navigate = useNavigate();
    const [searchValue, setSearchValue] = useState('');
    const dispatch = useAppDispatch();

    const handleSearchClick = () => {
        if (searchValue.length === 8) {
            // clevertap.event.push('log_track_shipment', {
            //     search_click: true,
            // });
            navigate(
                `/${logistics.index}/${logistics.orderHistory}/${logistics.trackOrderDetails}?trackingNo=${searchValue}`
            );
        } else {
            dispatch(
                showToast({
                    description: 'Tracking number must be exactly 8 digits long',
                    variant: 'error',
                })
            );
        }
    };

    return (
        <Row justify="space-between" className="gap-4">
            <Col xs={24} md={11} lg={8}>
                <Flex align="center">
                    <Typography.Text className="text-lg  align-middle sm:text-xl">
                        Logistics
                    </Typography.Text>
                    {/* <Typography.Text className="text-lg sm:text-xl ps-1 border-b-2 border-red-400">
                        Serving 40+ Countries
                    </Typography.Text> */}
                </Flex>
            </Col>
            {/* <Col className="sm:hidden">
                <Button
                    onClick={() => {
                        clevertap.event.push('log_order_history', {
                            click: true,
                        });
                        navigate(paths.logistics.orderHistory);
                    }}
                    danger
                    className="text-[.8rem] sm:text-[.9rem]"
                    type="default"
                    size={screens.sm ? 'middle' : 'small'}
                    block
                >
                    Order History
                </Button>
            </Col> */}
            <Col xs={24} md={12} lg={10} xl={8}>
                <Flex justify="between" className="w-full items-center" gap={10}>
                    <Col className="w-full pe-1 md:w-full sm:mt-0">
                        <Tooltip
                            title="Please enter the tracking number you received when your order was created"
                            placement="bottomLeft"
                            color="gray"
                        >
                            <Input
                                placeholder="Track your Shipment"
                                className="text-[.8rem] sm:text-[.9rem]"
                                value={searchValue}
                                onChange={e => {
                                    const input = e.target.value;
                                    const numericValue = input
                                        .replace(removeEmoji, '')
                                        .replace(/[^a-zA-Z0-9]/g, '');
                                    setSearchValue(numericValue);
                                }}
                                addonAfter={<SearchOutlined onClick={handleSearchClick} />}
                                allowClear
                                type="text"
                                minLength={8}
                                maxLength={8}
                            />
                        </Tooltip>
                    </Col>
                    <Col className="ps-1 sm:block">
                        <Button
                            onClick={() => navigate(paths.logistics.addressBook)}
                            danger
                            className="text-xs sm:text-sm"
                            type="default"
                            block
                        >
                            Address Book
                        </Button>
                    </Col>
                    <Col className="ps-1 sm:block">
                        <Button
                            onClick={() => {
                                // clevertap.event.push('log_order_history', {
                                //     click: true,
                                // });
                                navigate(paths.logistics.orderHistory);
                            }}
                            danger
                            className="text-xs sm:text-sm"
                            type="default"
                            block
                        >
                            Order History
                        </Button>
                    </Col>
                </Flex>
            </Col>
        </Row>
    );
};

export default Header;
