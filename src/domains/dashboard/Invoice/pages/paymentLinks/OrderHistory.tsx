import { useEffect, useMemo, useState } from 'react';

import { SearchOutlined } from '@ant-design/icons';
import { Input, Typography, Flex, Pagination, Col } from 'antd';
import { debounce } from 'lodash';

import GenericTable from '@components/atomic/GenericTable';

import InfoCard from '../../components/orderHistory/InfoCard';
import useFilter from '../../hooks/useFilter';
import { useAllpaymentLinks } from '../../hooks/useGetAllPaymentLinksApi';
import { getCardData, PaymentLinkColumns } from '../../utils/data';

const OrderHistoryTable = () => {
    const initialValues = {
        searchText: '',
        page: 1,
        itemsPerPage: 10,
        sort: 'DESC',
    };
    const [filters, setFilters] = useState(initialValues);
    const { handleSearch, handlePageChange, searchText } = useFilter({ setFilters });
    const { tableData, count, isLoading, statisticsData, resendPaymentLink } =
        useAllpaymentLinks(filters);
    const [tooltipText, setTooltipText] = useState('Copy to clipboard');
    const columns = PaymentLinkColumns({ tooltipText, setTooltipText, resendPaymentLink });
    const cardData = getCardData(statisticsData);

    const debouncedSetFilters = useMemo(
        () =>
            debounce((newSearchText: string) => {
                setFilters(prevFilters => ({
                    ...prevFilters,
                    searchText: newSearchText,
                    page: 1,
                }));
            }, 500),
        []
    );

    useEffect(() => {
        debouncedSetFilters(searchText);
        return () => {
            debouncedSetFilters.cancel();
        };
    }, [searchText, debouncedSetFilters]);

    return (
        <>
            <Col className="flex flex-col xl:flex-row gap-5">
                {cardData.map(
                    ({ bgColor, borderColor, icon1, title1, value1, icon2, title2, value2 }) => (
                        <Flex
                            key={title1}
                            className={`w-full xl:w-1/3 gap-3 p-4 rounded-2xl ${bgColor}`}
                        >
                            <InfoCard
                                borderColor={borderColor}
                                icon={icon1}
                                isCurrency={false}
                                title={title1}
                                value={value1}
                            />
                            <InfoCard
                                borderColor={borderColor}
                                icon={icon2}
                                isCurrency
                                title={title2}
                                value={value2}
                            />
                        </Flex>
                    )
                )}
            </Col>

            <Flex
                className="w-full mt-6"
                wrap="wrap"
                justify="space-between"
                align="center"
                gap={5}
            >
                <Typography.Text className="text-xl font-medium">Payment Links</Typography.Text>
                <Flex className="w-full sm:w-auto">
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
                </Flex>
            </Flex>
            <GenericTable
                columns={columns}
                dataSource={tableData.map(item => ({ key: item.id, ...item }))}
                pagination={false}
                loading={isLoading}
            />
            <Pagination
                current={filters.page}
                size="default"
                className="text-end pt-7 xs:mb-12 md:mb-0"
                onChange={handlePageChange}
                total={count}
                showSizeChanger={false}
            />
        </>
    );
};

export default OrderHistoryTable;
