import { SearchOutlined } from '@ant-design/icons';
import { Button, Flex, Input, Row, Select } from 'antd';

import { DownloadType } from '@customtypes/general';

import { OndcProductFilters } from '../../../types/ondcProduct';

const VISIBILITY_OPTIONS = [
    { value: 'visible', label: 'Visible' },
    { value: 'hidden', label: 'Hidden' },
];
const AVAILABILITY_OPTIONS = [
    { value: 'in', label: 'In stock' },
    { value: 'out', label: 'Out of stock' },
];

type Props = {
    handleDownloadReport: (type: string) => void;
    searchText: string;
    handleSearch: (e: any) => void;
    filterOptions: OndcProductFilters;
    category?: string;
    onCategoryChange: (v?: string) => void;
    seller?: string;
    onSellerChange: (v?: string) => void;
    /** seller NP (bpp_id) */
    sellerNp?: string;
    onSellerNpChange: (v?: string) => void;
    visibility?: string;
    onVisibilityChange: (v?: string) => void;
    availability?: string;
    onAvailabilityChange: (v?: string) => void;
    city?: string;
    onCityChange: (v?: string) => void;
};

const ProductCatalogHeader = ({
    handleDownloadReport,
    searchText,
    handleSearch,
    filterOptions,
    category,
    onCategoryChange,
    seller,
    onSellerChange,
    sellerNp,
    onSellerNpChange,
    visibility,
    onVisibilityChange,
    availability,
    onAvailabilityChange,
    city,
    onCityChange,
}: Props) => (
    <Row justify="space-between" className="w-full gap-5">
        <Flex className="flex justify-start flex-wrap gap-3">
            <Button danger onClick={() => handleDownloadReport(DownloadType.Excel)}>
                Excel
            </Button>
            <Button danger onClick={() => handleDownloadReport(DownloadType.Csv)}>
                CSV
            </Button>
            <Button danger onClick={() => handleDownloadReport(DownloadType.Pdf)}>
                PDF
            </Button>
            <Select
                allowClear
                placeholder="Category"
                className="min-w-[150px]"
                value={category}
                onChange={onCategoryChange}
                onClear={() => onCategoryChange(undefined)}
                options={filterOptions.categories.map(c => ({ label: c, value: c }))}
            />
            <Select
                allowClear
                placeholder="Seller"
                className="min-w-[150px]"
                value={seller}
                onChange={onSellerChange}
                onClear={() => onSellerChange(undefined)}
                options={filterOptions.sellers.map(s => ({ label: s, value: s }))}
            />
            <Select
                allowClear
                showSearch
                optionFilterProp="label"
                placeholder="Seller NP"
                className="min-w-[160px]"
                popupMatchSelectWidth={false}
                value={sellerNp}
                onChange={onSellerNpChange}
                onClear={() => onSellerNpChange(undefined)}
                options={filterOptions.sellerNps.map(np => ({
                    label: np.name,
                    value: np.bppId,
                    title: np.bppId,
                }))}
            />
            <Select
                allowClear
                placeholder="Visibility"
                className="min-w-[130px]"
                value={visibility}
                onChange={onVisibilityChange}
                onClear={() => onVisibilityChange(undefined)}
                options={VISIBILITY_OPTIONS}
            />
            <Select
                allowClear
                placeholder="Availability"
                className="min-w-[140px]"
                value={availability}
                onChange={onAvailabilityChange}
                onClear={() => onAvailabilityChange(undefined)}
                options={AVAILABILITY_OPTIONS}
            />
            <Select
                allowClear
                showSearch
                optionFilterProp="label"
                placeholder="City"
                className="min-w-[140px]"
                value={city}
                onChange={onCityChange}
                onClear={() => onCityChange(undefined)}
                options={filterOptions.cities.map(c => ({ label: c.name, value: c.code }))}
            />
        </Flex>
        <Flex className="w-full md:w-auto">
            <Input
                value={searchText}
                placeholder="Search product, seller, ..."
                suffix={<SearchOutlined />}
                onChange={handleSearch}
                allowClear
                type="text"
                variant="outlined"
                maxLength={100}
                className="md:w-[280px]"
            />
        </Flex>
    </Row>
);

export default ProductCatalogHeader;
