import React, { useState } from 'react';

import { Button, Flex, Tabs, TabsProps, Typography } from 'antd';

import AnnouncementModal from '@domains/dashboard/Payroll/components/modals/AnnouncementModal';
import useDebounce from '@src/hooks/useDebounce';

import AnnouncementTab from '../components/Announcements/AnnouncementTab';
import GetAnnouncementsList from '../hooks/announcementHooks/useAnnouncementListApi';
import { filterState } from '../types/salaryProfileTypes/employeeSalaryTable';
import useFilter from '../utils/general/useFilter';

type Props = {};
const Announcements = (props: Props) => {
    const [openAnnouncementModal, setOpenAnnouncementModal] = useState(false);
  
    const initialMonth = new Date().getMonth() + 1;
    const initialYear = new Date().getFullYear();

    const [filter, setFilter] = useState<filterState>({
        searchText: '',
        sort: '',
        page: 0,
        filter: '',

        year: initialYear,
        month: initialMonth,
        limit: 10,
    });
    const { handlePageChange, handleChangeMonth, handleChangeYear, handleSearch } = useFilter({
        setFilter,
    });
    const debouncedSearch = useDebounce(filter.searchText, 500);

    const { announcementData, count, isLoading, setRefresh } = GetAnnouncementsList(
        filter.page,
        filter.limit,
        debouncedSearch,
        filter.year,
        filter.month
    );

    const items: TabsProps['items'] = [
        {
            key: '1',
            label: 'Announcements',
            children: (
                <AnnouncementTab
                    announcementData={announcementData}
                    count={count}
                    isLoading={isLoading}
                    setRefresh={setRefresh}
                    handleSearch={handleSearch}
                    handleChangeYear={handleChangeYear}
                    handleChangeMonth={handleChangeMonth}
                    handlePageChange={handlePageChange}
                    searchText={filter.searchText}
                />
            ),
        },
    ];

    return (
        <Flex vertical className=" xs:mx-0">
            <Flex className="w-full" justify="space-between">
                <Typography.Text className="text-valueText text-xl font-medium">
                    Announcements
                </Typography.Text>
                <Button type="default" danger onClick={() => setOpenAnnouncementModal(true)}>
                    Add Announcements
                </Button>
            </Flex>
            {openAnnouncementModal && (
                <AnnouncementModal
                    open={openAnnouncementModal}
                    handleCancel={() => setOpenAnnouncementModal(false)}
                    setRefresh={setRefresh}
                />
            )}
            <Tabs defaultActiveKey="1" items={items} />
        </Flex>
    );
};

export default Announcements;
