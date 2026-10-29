import { type FC } from 'react';

import { SearchOutlined } from '@ant-design/icons';
import { Col, Flex, Input, Row, Select } from 'antd';

import { officeSuppliesFilterOptions } from '@domains/dashboard/officeSupplies/utils/data';

interface ProductListingProps {
    filter: string;
    setFilter: (v: string) => void;
    selectedCategoryName: string;
    searchText: string;
    setSearchText: (v: string) => void;
    setCurrentPage: (v: number) => void;
    data: any;
    isLoading: boolean;
}

const FiltersAdaptive: FC<ProductListingProps> = ({
    filter,
    setFilter,
    selectedCategoryName,
    searchText,
    setSearchText,
    setCurrentPage,
    data,
    isLoading,
}) => (
    <Flex vertical>
        <Row>
            <Col xs={24} md={12}>
                <Row className="" gutter={20} justify="space-between" align="middle">
                    <Col span={16}>
                        <Input
                            placeholder="Search for products"
                            suffix={
                                <SearchOutlined
                                    style={{ fontSize: '1.3rem' }}
                                    className={`cursor-pointer text-gray-200 `}
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
                            className="border-gray-200 border active:shadow-none  w-full"
                        />
                    </Col>
                    <Col span={8} className="flex justify-end">
                        <Select
                            className="border-gray-200 text-gray-200 rounded-sm"
                            defaultValue={filter}
                            style={{ width: 150 }}
                            onChange={v => {
                                setFilter(v);
                                setCurrentPage(1);
                            }}
                            options={officeSuppliesFilterOptions}
                        />
                    </Col>
                </Row>
            </Col>
        </Row>
    </Flex>
);

export default FiltersAdaptive;
