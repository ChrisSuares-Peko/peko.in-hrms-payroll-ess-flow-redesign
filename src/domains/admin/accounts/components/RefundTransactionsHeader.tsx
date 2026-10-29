import { SearchOutlined } from '@ant-design/icons';
import { Col, DatePicker, Input, Row, Select } from 'antd';
import dayjs from 'dayjs';

import { DropDown } from '@customtypes/general';

type Props = {
    handleSearch?: (e: any) => void;
    searchText?: string;
    searchCorporate?: string;
    handleDateChange?: (dates: any, dateStrings: any) => void;
    from?: string;
    to?: string;
    categoryDatas?: DropDown | undefined;
    setSearchCorporate?: (val: string) => void;
    handleChangeFilters?: (val: string) => void;
    handleCategoryFilters?: (val: string) => void;
};
const dateFormat = 'YYYY-MM-DD';
const RefundTransactionsHeader = ({
    searchText,
    handleSearch,
    from,
    to,
    handleDateChange,
    setSearchCorporate,
    handleChangeFilters,
    handleCategoryFilters,
    searchCorporate,
    categoryDatas,
}: Props) => (
    <Row gutter={[20, 20]} justify="end">
        {/* <Col className="w-full sm:w-fit">
            <Typography.Text className="font-normal text-lg">
                Bulk Refund (For failure transactions)
            </Typography.Text>
        </Col> */}
        <Col className="w-full sm:w-fit">
            {categoryDatas && (
                <Select
                    allowClear
                    searchValue={searchCorporate}
                    onSearch={setSearchCorporate}
                    options={(categoryDatas || []).map(d => ({
                        value: d.value,
                        label: d.label,
                    }))}
                    placeholder="Select Corporate"
                    loading={categoryDatas.length < 0}
                    className="w-full"
                    onChange={handleCategoryFilters}
                    defaultActiveFirstOption={false}
                    filterOption={false}
                    showSearch
                />
            )}
        </Col>
        <Col className="w-full sm:w-fit">
            <DatePicker.RangePicker
                onChange={handleDateChange}
                format={dateFormat}
                defaultValue={[dayjs(from, dateFormat), dayjs(to, dateFormat)]}
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
                name="refund-transactions-search"
                autoComplete="off"
                // Browsers can silently prefill this field (e.g. with a saved username) the
                // first time a password-type field appears elsewhere on the page. Starting the
                // field read-only blocks that — browsers won't autofill a read-only input — and
                // clearing the attribute on focus restores normal typing for the user.
                readOnly
                onFocus={e => e.target.removeAttribute('readonly')}
            />
        </Col>
    </Row>
);
export default RefundTransactionsHeader;
