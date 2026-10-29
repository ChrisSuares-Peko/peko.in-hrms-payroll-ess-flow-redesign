import React from 'react';

import { SearchOutlined } from '@ant-design/icons';
import { Col, Row, Select, Input } from 'antd';

import { filterOptions2 } from '@src/domains/dashboard/Subscriptions/utils/data';

interface categoryProps {
    count?: number;
    category: string;
    setCategory: (value: any) => void;
    searchText: string;
    setSearchtext: (value: any) => void;
}

const SubHeader = ({ count, category, setCategory, searchText, setSearchtext }: categoryProps) => (
    <Row className="mt-8 md:mt-12 gap-5 justify-end flex-row-reverse md:flex-row" align="middle">
        <Col className=" hidden md:block">
            <Input
                placeholder="Search for softwares"
                value={searchText}
                suffix={<SearchOutlined />}
                allowClear
                type="text"
                maxLength={100}
                onChange={e => setSearchtext(e.target.value)}
                className="text-[.8rem] sm:text-[.9rem] w-fit"
            />
        </Col>
        <Col>
            <Select
                defaultValue={category}
                onChange={value => setCategory(value)}
                options={filterOptions2}
                style={{ width: 100 }}
                className="w-full"
            />
        </Col>
        <Col xs={24} sm={24} md={0} lg={0} xl={0} className="mt-4">
            <Input
                placeholder="Search for softwares"
                value={searchText}
                suffix={<SearchOutlined />}
                allowClear
                type="text"
                maxLength={100}
                onChange={e => setSearchtext(e.target.value)}
                className="text-[.8rem] sm:text-[.9rem]"
            />
        </Col>
    </Row>
);

export default SubHeader;
