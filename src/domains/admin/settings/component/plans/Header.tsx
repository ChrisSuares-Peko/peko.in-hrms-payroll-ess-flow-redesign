import React from 'react';

import { SearchOutlined } from '@ant-design/icons';
import { Button, Col, Input, Row } from 'antd';

type Props = {
    handleSearch: (e: any) => void;
    handleChangeFilters: (e: any) => void;
    setSearchText: (e: any) => void;
    searchText: string;
    setOpenModal: (e: any) => void;
};

const PlanHeader = ({
    searchText,
    setSearchText,
    handleSearch,
    handleChangeFilters,
    setOpenModal,
}: Props) => (
    <Row gutter={[20, 20]} justify="space-between">
        <Col className="flex w-full sm:w-fit gap-3">
            <Button
                type="primary"
                className="w-full sm:w-fit"
                danger
                onClick={() => setOpenModal(true)}
            >
                Add Plan
            </Button>
        </Col>
        <Col xs={24} sm={12} md={8}>
            <Input
                value={searchText}
                placeholder="Search For Plan"
                suffix={<SearchOutlined />}
                onChange={handleSearch}
                allowClear
                type="text"
                variant="outlined"
                maxLength={100}
            />
        </Col>
    </Row>
);
export default PlanHeader;
