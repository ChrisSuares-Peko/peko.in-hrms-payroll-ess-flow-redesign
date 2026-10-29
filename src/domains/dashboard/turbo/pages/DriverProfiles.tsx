import React, { useEffect, useState } from 'react';

import { Empty, Flex, Row, Spin } from 'antd';
import dayjs from 'dayjs';
import { useDispatch } from 'react-redux';

import useDebounceSearch from '@src/hooks/useDebounceSearch';
import { showToast } from '@src/slices/apiSlice';

import ProfileCards from '../components/driverProfile/ProfileCards';
import ProfileHeatder from '../components/driverProfile/ProfileHeatder';
import useGetAllDriversApi from '../hooks/useGetAllDrivers';
import { filterState } from '../types';

const DriverProfiles = () => {
    const today = dayjs();
    const todayFormatted = today.format('YYYY-MM-DD');
    const [modalData, setModalData] = useState<any>();
    const [openConfirmationModal, setOpenConfirmationModal] = useState(false);
    const dispatch = useDispatch();
    const initialValues = {
        searchText: '',
        page: 1,
        itemsPerPage: 5,
        from: todayFormatted,
        to: todayFormatted,
    };

    const [filter, setFilter] = useState<filterState>(initialValues);
    const [isSearching, setIsSearching] = useState(false);
    const { searchText, updateSearchText } = useDebounceSearch(setFilter);
    const { allData, deleteDriverApi, setRefresh, isLoading, downloadReport } =
        useGetAllDriversApi(filter);

    const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
        setIsSearching(true);
        updateSearchText(e);
    };

    useEffect(() => {
        if (!isLoading) setIsSearching(false);
    }, [isLoading]);
    // const { handleSearch, handlePageChange, handleDateChange, handleFromChange, handleToChange } =
    //        useFilter({
    //            setFilter,
    //            initalStartDate: initialValues.from,
    //            initalEndDate: initialValues.to,
    //        });
    const handleDelete = () => {
        deleteDriverApi({ id: modalData!?.id }).then((res: any) => {
            if (res) {
                setRefresh(true);
                dispatch(
                    showToast({
                        description: 'Driver deleted successfully',
                        variant: 'success',
                    })
                );
            }
            setOpenConfirmationModal(false);
        });
    };

    return (
        <>
            <ProfileHeatder
                searchText={searchText}
                handleSearch={handleSearch}
                downloadReport={downloadReport}
                isLoading={isLoading || isSearching}
            />
            {isLoading ? (
                <Flex className="justify-center w-full mt-20 align-middle">
                    <Spin />
                </Flex>
            ) : (
                <>
                    {allData && allData.length > 0 ? (
                        <Row className="mt-10" gutter={[20, 20]}>
                            {allData.map((item: any) => (
                                <ProfileCards
                                    setModalData={setModalData}
                                    item={item}
                                    openConfirmationModal={openConfirmationModal}
                                    setOpenConfirmationModal={setOpenConfirmationModal}
                                    handleDelete={handleDelete}
                                />
                            ))}
                        </Row>
                    ) : (
                        <Flex className="mt-20 " justify="center" align="center">
                            <Empty />
                        </Flex>
                    )}
                </>
            )}
        </>
    );
};

export default DriverProfiles;
