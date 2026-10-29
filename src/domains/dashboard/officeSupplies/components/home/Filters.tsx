import { type FC } from 'react';

import { SearchOutlined } from '@ant-design/icons';
import { Col, Flex, Input, Row, Typography } from 'antd';

interface ProductListingProps {
    searchText: string;
    setSearchText: (v: string) => void;
}

const Filters: FC<ProductListingProps> = ({ searchText, setSearchText }) => (
    <Flex vertical>
        <Row>
            <Col xs={24} md={12}>
                <Typography.Text className="text-xl ms-2 text-textBlack">
                    Office Supplies
                </Typography.Text>
            </Col>
            <Col xs={24} md={12}>
                <Row
                    className="xs:mt-5 mt-0 gap-5 justify-end flex-row-reverse md:flex-row"
                    align="middle"
                >
                    <Col className="hidden md:block">
                        <Input
                            placeholder="Search for products"
                            suffix={
                                <SearchOutlined
                                    style={{ fontSize: '1.3rem' }}
                                    className="cursor-pointer text-gray-200"
                                    onClick={() => setSearchText(searchText)}
                                />
                            }
                            allowClear
                            type="text"
                            value={searchText}
                            onChange={e => {
                                setSearchText(e.target.value);
                            }}
                            maxLength={100}
                            className="border-gray-200 border active:shadow-none w-full"
                        />
                    </Col>
                    <Col xs={24} sm={24} md={0} lg={0} xl={0} className="mt-4">
                        <Input
                            placeholder="Search for products"
                            suffix={
                                <SearchOutlined
                                    style={{ fontSize: '1.3rem' }}
                                    className="cursor-pointer text-gray-200"
                                    onClick={() => setSearchText(searchText)}
                                />
                            }
                            allowClear
                            type="text"
                            value={searchText}
                            onChange={e => {
                                setSearchText(e.target.value);
                            }}
                            maxLength={100}
                            className="border-gray-200 border active:shadow-none w-full"
                        />
                    </Col>
                </Row>
            </Col>
        </Row>
    </Flex>
);

export default Filters;
