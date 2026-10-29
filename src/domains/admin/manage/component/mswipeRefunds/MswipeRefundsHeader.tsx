import React from 'react';

import { SearchOutlined } from '@ant-design/icons';
import { Col, DatePicker, Input, Row, Select } from 'antd';

import usePartnersForCorporate from '@src/domains/admin/users/hooks/usePartnersForCorporate';

import { MswipeRefundStatusOption } from '../../types/mswipeRefunds';

type Props = {
    searchText: string;
    handleSearch: (e: React.ChangeEvent<HTMLInputElement>) => void;
    statuses: MswipeRefundStatusOption[];
    handleStatusChange: (status?: string) => void;
    handlePartnerChange: (partnerId: string) => void;
    handleDateChange: (dates: any, dateStrings: [string, string]) => void;
};

const dateFormat = 'YYYY-MM-DD';

const MswipeRefundsHeader = ({
    searchText,
    handleSearch,
    statuses,
    handleStatusChange,
    handlePartnerChange,
    handleDateChange,
}: Props) => {
    const { partnerData } = usePartnersForCorporate('');

    return (
        <Row gutter={[20, 20]} justify="end">
            <Col className="w-full sm:w-fit">
                <Select
                    placeholder="Select Status"
                    className="w-full min-w-40"
                    options={statuses.map(({ status, name }) => ({ value: status, label: name }))}
                    allowClear
                    onChange={handleStatusChange}
                />
            </Col>
            <Col className="w-full sm:w-fit">
                <Select
                    placeholder="Select Partner"
                    className="w-full min-w-52"
                    options={partnerData}
                    allowClear
                    onChange={e => handlePartnerChange(e)}
                    showSearch
                    filterOption={(input, option) =>
                        (option?.label ?? '').toLowerCase().includes(input.toLowerCase())
                    }
                />
            </Col>
            <Col className="w-full sm:w-fit">
                <DatePicker.RangePicker
                    onChange={handleDateChange}
                    format={dateFormat}
                    className="w-full"
                />
            </Col>
            <Col className="w-full sm:w-fit">
                <Input
                    value={searchText}
                    placeholder="Search"
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
};

export default MswipeRefundsHeader;
