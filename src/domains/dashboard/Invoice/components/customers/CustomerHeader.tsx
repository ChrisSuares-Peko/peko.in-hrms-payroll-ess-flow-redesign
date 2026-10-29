import React, { useState } from 'react';

import { SearchOutlined } from '@ant-design/icons';
import { Button, Col, Input, Row } from 'antd';

import { refresh } from '@src/domains/admin/manage/types/edocTypes';

import CustomerModal from './CustomerModal';

type Props = {
    handleSearch: (e: any) => void;
    searchText: string;
};

const CustomerHeader = ({ searchText, handleSearch, setRefresh }: Props & refresh) => {
    const [openModal, setOpenModal] = useState(false);

    return (
        <Row gutter={[10, 10]} justify="end">
            <Col className="flex flex-col sm:flex-row w-full sm:w-fit gap-3">
                <Button
                    type="primary"
                    className="w-full sm:w-fit"
                    danger
                    onClick={() => setOpenModal(true)}
                >
                    Add New Customer
                </Button>
                <Input
                    value={searchText}
                    placeholder="Search "
                    suffix={<SearchOutlined />}
                    onChange={handleSearch}
                    allowClear
                    type="text"
                    variant="outlined"
                    className="w-full sm:w-fit"
                    maxLength={90}
                />
            </Col>
            {openModal && (
                <CustomerModal
                    open={openModal}
                    handleCancel={() => setOpenModal(false)}
                    setRefresh={setRefresh}
                />
            )}
        </Row>
    );
};
export default CustomerHeader;
