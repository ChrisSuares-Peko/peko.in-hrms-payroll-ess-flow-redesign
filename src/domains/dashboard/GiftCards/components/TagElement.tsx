import { SearchOutlined } from '@ant-design/icons';
import { Select, Input, Row, Col, Typography } from 'antd';

import { filterOptionsInListing, giftCardCategories } from '@src/domains/dashboard/GiftCards/utils/data';
import { removeEmoji } from '@utils/regex';


interface tagProps {
    count?: number;
    category: string;
    setCategory: (value: any) => void;
    searchText: string;
    setSearchText: (value: any) => void;
    setCurrentPage: (value: number) => void;
    selectedCategory?: string;
}

const TagElement = ({ count, category, setCategory, searchText, setSearchText, setCurrentPage, selectedCategory = 'all' }: tagProps) => {
    const categoryLabel = selectedCategory === 'all'
        ? 'All Categories'
        : giftCardCategories.find(c => c.key === selectedCategory)?.label ?? 'All Categories';

    return (
    <Row className="mt-3 md:mt-9 gap-5 justify-between" align="middle">
        <Col className="w-full md:w-auto">
            <Typography.Text className="font-medium text-lg sm:text-xl">
                {categoryLabel}
            </Typography.Text>
        </Col>
        <Row gutter={[16, 16]} className="xs:w-full md:w-auto">
            <Col className="flex flex-col md:flex-row gap-2 w-full md:w-auto justify-end">
                <Input
                    placeholder="Search for gift cards"
                    value={searchText}
                    suffix={<SearchOutlined />}
                    allowClear
                    type="text"
                    // maxLength={100}
                    onChange={e => {
                        let filteredValue = e.target.value;
                        filteredValue = filteredValue.replace(removeEmoji, '');
                        setSearchText(filteredValue);
                        setCurrentPage(1);
                    }}
                    className="text-[.8rem] sm:text-[.9rem] w-full"
                />
            </Col>
            <Col>
                <Select
                    defaultValue={category}
                    onChange={value => {
                        setCategory(value);
                        setCurrentPage(1);
                    }}
                    options={filterOptionsInListing}
                    style={{ width: 100 }}
                    className="w-full xs:mt-2 sm:mt-0"
                />
            </Col>
        </Row>
    </Row>
    );
};

export default TagElement;
