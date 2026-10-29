import { useCallback, useState } from 'react';

import { SearchOutlined } from '@ant-design/icons';
import { Button, Col, Flex, Input, message, Row, Tooltip, Typography } from 'antd';
import { useNavigate } from 'react-router-dom';

import useScreenSize from '@src/hooks/useScreenSize';
import { paths } from '@src/routes/paths';

const { Text } = Typography;

export default function Header() {
    const { sm } = useScreenSize();
    const navigate = useNavigate();
    const [searchValue, setSearchValue] = useState('');

    const handleSearchClick = useCallback(() => {
        if (searchValue.length >= 8) {
            message.success('Performing search...');
            navigate(`${paths.logistics.track}?trackingNo=${searchValue}`);
        } else {
            message.warning('Tracking number must be at least 8 characters long.');
        }
    }, [searchValue, navigate]);

    return (
        <>
            <Row justify="space-between" className="gap-4">
                <Col>
                    <Flex align="center">
                        <Typography.Text className="text-lg font-medium align-middle sm:text-xl">
                            Logistics
                        </Typography.Text>
                        {/* <Typography.Text className="text-zinc-500  text-[.8rem] ps-2 hidden sm:block">
                            (Serving 40+ Countries)
                        </Typography.Text> */}
                    </Flex>
                </Col>
                <Col className="sm:hidden">
                    <Button
                        onClick={() => navigate(paths.logistics.orderHistory)}
                        danger
                        className="text-[.8rem] sm:text-[.9rem]"
                        type="default"
                        size={sm ? 'middle' : 'small'}
                        block
                    >
                        Order History
                    </Button>
                </Col>
                <Flex justify="between" className="w-full md:w-fit">
                    <Col className="w-full mt-5 pe-1 md:w-fit sm:mt-0">
                        <Tooltip
                            title="Please enter the tracking number you received when your order was created"
                            placement="bottomLeft"
                            color="gray"
                        >
                            <Input
                                placeholder="Track your shipment"
                                className="text-[.8rem] sm:text-[.9rem]"
                                value={searchValue}
                                onChange={e => setSearchValue(e.target.value)}
                                addonAfter={<SearchOutlined onClick={handleSearchClick} />}
                                allowClear
                                type="text"
                                minLength={8}
                                maxLength={20}
                            />
                        </Tooltip>
                    </Col>
                    <Col className="hidden ps-1 sm:block">
                        <Button
                            onClick={() => navigate(paths.logistics.orderHistory)}
                            danger
                            className="text-[.8rem] sm:text-[.9rem]"
                            type="default"
                            block
                        >
                            Order History
                        </Button>
                    </Col>
                </Flex>
            </Row>
            <Flex
                justify="center"
                className="px-[.7rem] py-3 mb-2 mt-4 sm:mb-4 sm:mt-2 border-[1px] border-green-200  sm:border-0 bg-green-50 sm:bg-white"
            >
                <Text
                    className="text-[.9rem] text-center  sm:text-[1.1rem] md:text-[1.3rem] font-thin
                text-textGreenTitle sm:text-black"
                >
                    Book Now and one of our agent will pick up the parcel/document from your address
                </Text>
            </Flex>
        </>
    );
}
