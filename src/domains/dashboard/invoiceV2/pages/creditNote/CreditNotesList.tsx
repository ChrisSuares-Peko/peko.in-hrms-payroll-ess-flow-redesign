import { PlusOutlined, SearchOutlined } from '@ant-design/icons';
import { Button, DatePicker, Flex, Input } from 'antd';
import { Content } from 'antd/es/layout/layout';
import dayjs, { Dayjs } from 'dayjs';
import { useNavigate } from 'react-router-dom';

import TypographyText from '@components/atomic/typography/typographyText';
import { paths } from '@src/routes/paths';

import CreditNoteStatsRow from '../../components/creditNote/CreditNoteStatsRow';
import CreditNoteTable from '../../components/creditNote/CreditNoteTable';
import useCreditNoteList from '../../hooks/creditNote/listing/useCreditNoteList';

const CreditNotesList = () => {
    const navigate = useNavigate();

    const handleView = (id: string) => {
        navigate(`/${paths.invoice.index}/${paths.invoice.creditNoteDetails.replace(':id', id)}`);
    };

    const {
        creditNotes,
        dashboard,
        isLoading,
        isDashboardLoading,
        filters,
        searchText,
        updateSearchText,
        handleDateRange,
        handlePageChange,
        goToCreate,
        updateStatus,
    } = useCreditNoteList();

    const rangePickerValue =
        filters.startDate && filters.endDate
            ? ([dayjs(filters.startDate), dayjs(filters.endDate)] as [Dayjs, Dayjs])
            : null;

    return (
        <Content className="px-0">
            <Flex justify="space-between" align="center" gap={12} wrap="wrap" className="mt-4 mb-6">
                <Flex vertical gap={2}>
                    <TypographyText className="text-[#101828] text-xl font-semibold leading-7">
                        Credit Notes
                    </TypographyText>
                    <TypographyText className="text-[#64748B] text-sm">
                        Refunds, returns, and overcharge corrections.
                    </TypographyText>
                </Flex>
                <Button
                    type="primary"
                    icon={<PlusOutlined />}
                    danger
                    className="h-9 w-full sm:w-auto px-4 font-medium text-sm rounded-lg"
                    onClick={goToCreate}
                >
                    New Credit Note
                </Button>
            </Flex>

            <CreditNoteStatsRow dashboard={dashboard} loading={isDashboardLoading} />

            <Flex vertical gap={20} className="pt-4">
                <Flex justify="space-between" align="center" gap={12} wrap="wrap">
                    <TypographyText className="text-[#101828] text-lg font-semibold leading-6">
                        Credit Note List
                    </TypographyText>
                    <Flex align="center" gap={12} wrap="wrap">
                        <DatePicker.RangePicker
                            className="h-10 w-full md:w-auto rounded-lg border-[#E4E4E7]"
                            onChange={handleDateRange}
                            format="YYYY-MM-DD"
                            value={rangePickerValue}
                        />
                        <Input
                            prefix={<SearchOutlined className="text-[#CBD5E1]" />}
                            placeholder="Search credit notes..."
                            value={searchText}
                            onChange={updateSearchText}
                            className="w-full md:w-[260px] h-10 rounded-lg border-[#E4E4E7]"
                        />
                    </Flex>
                </Flex>

                <CreditNoteTable
                    data={creditNotes?.creditNotes ?? []}
                    total={creditNotes?.recordsTotal ?? 0}
                    page={filters.page}
                    pageSize={filters.itemsPerPage}
                    loading={isLoading}
                    onView={handleView}
                    onUpdateStatus={updateStatus}
                    onPageChange={handlePageChange}
                />
            </Flex>
        </Content>
    );
};

export default CreditNotesList;
