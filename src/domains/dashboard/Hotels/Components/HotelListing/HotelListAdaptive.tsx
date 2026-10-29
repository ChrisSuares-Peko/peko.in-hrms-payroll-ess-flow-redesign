import { useEffect, useState } from 'react';

import { Col, Flex, Modal, Pagination, Progress, Spin } from 'antd';
import Lottie from 'react-lottie';
import { useNavigate } from 'react-router-dom';

import { useAppSelector } from '@src/hooks/store';
import useScrollUpOnPageChange from '@src/hooks/useScrollTopOnPageChange';
import { paths } from '@src/routes/paths';

import BookedSm from './BookedSm';
import FilledBookingDetailsCardSm from './FilledBookingDetailsCardSm';
import Filterhotel from './Filterhotel';
import FilterHotelSm from './FilterHotelSm';
import HotelListSkeleton from './HotelListSkeleton';
import usePagination from '../../hooks/usePagination';
import { Hotels } from '../../types/types';
import { HotelSearchAnimation } from '../../utils/lottie';
import Empty from '../Empty';

interface ModalProps {
    openWindow: () => void;
    isLoading: boolean;
    data: Hotels[];
    conversationId: string;
    searchKey: string;
}

const HotelListAdaptive = ({
    openWindow,
    isLoading,
    data,
    conversationId,
    searchKey,
}: ModalProps) => {
    const navigate = useNavigate();
    const [isModalOpen, setIsmodalOpen] = useState<boolean>(false);
    const [filteredData, setFilteredData] = useState<Hotels[]>([]);
    const [currentPage, setCurrentPage] = useState<number>(1);

    const { hotelsRequest, hotelArr } = useAppSelector(state => state.reducer.hotels);
    const [sortOption, setSortOption] = useState<string>('priceLowToHigh');
    const [progress, setProgress] = useState(0);

    if (hotelArr?.length > 0) {
        isLoading = false;
        ({ conversationId } = hotelArr);
        searchKey = hotelArr?.commonData?.searchKey;
    }

    const dataSource = hotelArr;

   
    const { paginatedData, itemsPerPage, pageLoading } = usePagination<any>({
        currentPage,
        data: filteredData,
    });

    const toggleModal = () => setIsmodalOpen(!isModalOpen);

 

    useScrollUpOnPageChange(currentPage);

    const handleSortChange = (option: any) => {
        setSortOption(option);
        // Add any additional sorting logic here based on the selected option
    };

    const handleEditButtonClick = () => {
        navigate(`${paths.dashboard.corporateTravel}?active=2`);
    };
    let totalCount = 0;

    hotelsRequest.rooms.forEach((count: { adult: any; child: any }) => {
        totalCount += count.adult + count.child;
    });

    useEffect(() => {
        let interval: string | number | NodeJS.Timeout | undefined;
        if (isLoading) {
            setProgress(0); // Start from 0
            interval = setInterval(() => {
                setProgress(prevProgress => {
                    if (prevProgress >= 100) {
                        clearInterval(interval);
                        return 100;
                    }
                    return prevProgress + 1;
                });
            }, 100);
        } else {
            setProgress(0); // Reset to 0 when loading stops
        }

        // Cleanup on `isLoading` change or component unmount
        return () => clearInterval(interval);
    }, [isLoading]);

    return (
        <div>
            {/* Modal and other UI code */}
            <Modal
                // title="Filter Hotels"
                visible={isModalOpen}
                onCancel={toggleModal}
                footer={null}
                width={300}
            >
                <Filterhotel
                    title="Filter"
                    setFilteredData={setFilteredData}
                    dataSource={dataSource}
                    setCurrentPage={setCurrentPage}
                    sortOption={sortOption}
                />
            </Modal>
            <Flex vertical className="mb-6">
                {/* Main card */}
                <FilledBookingDetailsCardSm
                    hotelsRequest={hotelsRequest}
                    totalCount={totalCount}
                    handleEditButtonClick={handleEditButtonClick}
                />
                {isLoading && dataSource.length === 0 ? (
                    <Col span={24}>
                        <Progress
                            className="w-full"
                            percent={progress}
                            status="exception"
                            showInfo={false}
                        />
                    </Col>
                ) : null}
                {paginatedData?.length !== 0 && (
                    <FilterHotelSm
                        sortOption={sortOption}
                        handleSortChange={handleSortChange}
                        toggleModal={toggleModal}
                        hasFilterApplied={dataSource.length !== filteredData.length}
                    />
                )}
            </Flex>
            {isLoading && dataSource.length === 0 ? (
                <Flex justify="center">
                    <Spin
                        className="mt-28 pointer-events-none"
                        indicator={
                            <Lottie options={HotelSearchAnimation} height={100} width={100} />
                        }
                        spinning
                    />
                </Flex>
            ) : (
                <>
                    <div className="relative h-screen overflow-y-auto">
                        {!pageLoading && paginatedData?.length === 0 ? (
                            <Empty />
                        ) : (
                            <>
                                {pageLoading || paginatedData?.length === 0 ? (
                                    <HotelListSkeleton length={10} />
                                ) : (
                                    paginatedData.map((item, index) => (
                                        <BookedSm
                                            key={index}
                                            items={item}
                                            hotelKey={item.HotelCode}
                                            image={item?.Images?.[0] ? item?.Images[0] : undefined}
                                            name={item?.HotelName}
                                            facilities={item?.Address}
                                            reviews={item.HotelRating}
                                            conversationId={conversationId}
                                            price={item?.Rooms[0]?.TotalFare}
                                        />
                                    ))
                                )}
                            </>
                        )}
                    </div>

                    <Flex align="center" justify="center" className="my-4">
                        <Pagination
                            current={currentPage}
                            pageSize={itemsPerPage}
                            total={filteredData?.length}
                            size="small"
                            onChange={(page: number) => setCurrentPage(page)}
                        />
                    </Flex>
                    <Flex className="hidden">
                        <Filterhotel
                            title="Filter Hotels"
                            setFilteredData={setFilteredData}
                            dataSource={dataSource}
                            setCurrentPage={setCurrentPage}
                            sortOption={sortOption}
                        />
                    </Flex>
                </>
            )}
        </div>
    );
};

export default HotelListAdaptive;
