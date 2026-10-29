import React from 'react';

import { SearchOutlined } from '@ant-design/icons';
import { Button, DatePicker, Flex, Input, Row, Select } from 'antd';
import type { RangePickerProps } from 'antd/es/date-picker';

const { RangePicker } = DatePicker;

type Props = {
    onStatusChange: (val: string | undefined) => void;
    onSearch: (val: string) => void;
    onDateChange?: RangePickerProps['onChange'];
    onNewRequest: () => void;
    search: string;
};

const PurchaseRequestHeader: React.FC<Props> = ({ onStatusChange, onSearch, onDateChange, onNewRequest, search }) => (
    <Row justify="end" className="w-full">
        <Flex className="flex-col justify-end gap-3 px-0 md:flex-row" align="center">
            <Select
                placeholder="Select Status"
                allowClear
                className="w-full md:w-auto min-w-52"
                options={[
                    { label: 'All',              value: ''                 },
                    { label: 'Open',             value: 'Open'             },
                    { label: 'Converted to RFQ', value: 'Converted to RFQ' },
                    { label: 'Converted to PO',  value: 'Converted to PO'  },
                    { label: 'Cancelled',        value: 'Cancelled'        },
                ]}
                onChange={(val: string) => onStatusChange(val || undefined)}
            />
            <RangePicker onChange={onDateChange} className="w-full" />
            <Input
                placeholder="Search"
                suffix={<SearchOutlined />}
                allowClear
                className="w-full md:w-auto min-w-52"
                value={search}
                onChange={e => onSearch(e.target.value.replace(/●|\p{Extended_Pictographic}/gu, '').trimStart())}
                maxLength={100}
            />
            <Button type="primary" danger onClick={onNewRequest} className="w-full md:w-auto">
                New Request
            </Button>
        </Flex>
    </Row>
);

export default PurchaseRequestHeader;
