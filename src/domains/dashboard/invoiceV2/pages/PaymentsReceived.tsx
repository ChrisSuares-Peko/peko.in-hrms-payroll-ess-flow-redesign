import { SearchOutlined } from '@ant-design/icons';
import { DatePicker, Flex, Input, Select } from 'antd';
import { Content } from 'antd/es/layout/layout';
import dayjs, { Dayjs } from 'dayjs';

import TypographyText from '@components/atomic/typography/typographyText';

import PaymentsReceivedStatsRow from '../components/paymentsReceived/PaymentsReceivedStatsRow';
import PaymentsReceivedTable from '../components/paymentsReceived/PaymentsReceivedTable';
import { PAYMENT_MODE_OPTIONS } from '../constants/settings';
import usePaymentsReceivedList from '../hooks/paymentsReceived/usePaymentsReceivedList';

const PaymentsReceived = () => {
    const {
        paymentsReceived,
        isLoading,
        filters,
        searchText,
        updateSearchText,
        handleDateRange,
        handleModeChange,
        handlePageChange,
    } = usePaymentsReceivedList();

    const rangePickerValue =
        filters.startDate && filters.endDate
            ? ([dayjs(filters.startDate), dayjs(filters.endDate)] as [Dayjs, Dayjs])
            : null;

    return (
        <Content className="px-0">
            <Flex vertical gap={2} className="mt-4 mb-6">
                <TypographyText className="text-[#101828] text-xl font-semibold leading-7">
                    Payments Received
                </TypographyText>
                <TypographyText className="text-[#64748B] text-sm">
                    Track all cash received across your invoices.
                </TypographyText>
            </Flex>

            <PaymentsReceivedStatsRow
                totalReceived={paymentsReceived?.totalReceived ?? 0}
                totalPayments={paymentsReceived?.recordsTotal ?? 0}
                loading={isLoading && !paymentsReceived}
            />

            <Flex vertical gap={20} className="pt-4">
                <Flex align="center" gap={12} wrap="wrap">
                    <DatePicker.RangePicker
                        className="h-10 w-full md:w-auto rounded-lg border-[#E4E4E7]"
                        onChange={handleDateRange}
                        format="YYYY-MM-DD"
                        value={rangePickerValue}
                    />
                    <Select
                        className="h-10 w-full md:w-[170px]"
                        placeholder="All Modes"
                        allowClear
                        value={filters.mode || undefined}
                        onChange={handleModeChange}
                        onClear={() => handleModeChange('')}
                        options={PAYMENT_MODE_OPTIONS}
                    />
                    <Input
                        prefix={<SearchOutlined className="text-[#CBD5E1]" />}
                        placeholder="Search customer..."
                        value={searchText}
                        onChange={updateSearchText}
                        className="w-full md:w-[220px] h-10 rounded-lg border-[#E4E4E7]"
                    />
                </Flex>

                <PaymentsReceivedTable
                    data={paymentsReceived?.receipts ?? []}
                    total={paymentsReceived?.recordsTotal ?? 0}
                    page={filters.page}
                    pageSize={filters.itemsPerPage}
                    loading={isLoading}
                    onPageChange={handlePageChange}
                />
            </Flex>
        </Content>
    );
};

export default PaymentsReceived;
