import { useEffect, useState } from 'react';

import { Col, Flex, Progress, Row, Select, Typography, Pagination, Spin, Modal } from 'antd';
import { Content } from 'antd/es/layout/layout';
import Lottie from 'react-lottie';
import { ReactSVG } from 'react-svg';

import filterIcon from '@domains/dashboard/Hotels/Assets/icons/filter.svg';
import Detailshead from '@domains/dashboard/Hotels/Components/HotelListing/Detailshead';
import HotelList from '@domains/dashboard/Hotels/Components/HotelListing/HotelList';
import Filterhotel from '@src/domains/dashboard/Hotels/Components/HotelListing/Filterhotel';
import { useAppSelector } from '@src/hooks/store';
import useScrollUpOnPageChange from '@src/hooks/useScrollTopOnPageChange';

import HotelListSkeleton from './HotelListSkeleton';
import usePagination from '../../hooks/usePagination';
import { HotelSearchAnimation } from '../../utils/lottie';
import Empty from '../Empty';
import '../../Assets/style.css';

interface hotelsProps {
    isLoading: boolean;
    conversationId: string;
    searchKey: string;
    hotelsSearch: any;
}

const DetailsWeb = ({ isLoading, conversationId, searchKey, hotelsSearch }: hotelsProps) => {
    const [isModalOpen, setIsmodalOpen] = useState<boolean>(false);
    const [filteredData, setFilteredData] = useState<any[]>([]);
    const [progress, setProgress] = useState(0);
    const [currentPage, setCurrentPage] = useState<number>(1);
    // const [itemsPerPage] = useState<number>(10);
    const { hotelsRequest, hotelArr } = useAppSelector(state => state.reducer.hotels);
    const [sortOption, setSortOption] = useState<string>('priceLowToHigh');

    isLoading = true;
    if (hotelArr?.data === false) {
        isLoading = false;
    }

    // const startIndex = (currentPage - 1) * itemsPerPage;
    // const endIndex = startIndex + itemsPerPage;

    // const paginatedData = filteredData?.slice(startIndex, endIndex);
    const { paginatedData, itemsPerPage, pageLoading } = usePagination<any>({
        currentPage,
        data: filteredData,
    });

    if (hotelArr?.length > 0) {
        isLoading = false;
        ({ conversationId } = hotelArr);
        searchKey = hotelArr?.commonData?.searchKey;
    }
    const dataSource = hotelArr;

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

   
    const toggleModal = () => setIsmodalOpen(!isModalOpen);
    useScrollUpOnPageChange(currentPage);

    return (
        <>
            <Flex>
                <Detailshead isLoading={isLoading} hotelsSearch={hotelsSearch} />
            </Flex>
            {isLoading ? (
                <Col span={24}>
                    <Progress
                        className="w-full"
                        percent={progress}
                        status="exception"
                        showInfo={false}
                    />
                </Col>
            ) : null}
            {isLoading ? (
                <Flex justify="center">
                    <Spin
                        className="mt-36 pointer-events-none"
                        indicator={
                            <Lottie options={HotelSearchAnimation} height={200} width={200} />
                        }
                        spinning
                    />
                </Flex>
            ) : (
                <>
                    {hotelArr?.data === false ? (
                        <Empty />
                    ) : (
                        <Row gutter={16} className="py-3 mb-16">
                            <Col span={0} xl={7} xxl={6}>
                                <Content className="border border-solid border-gray-200 rounded-[20px] overflow-hidden">
                                    <Filterhotel
                                        title="Filter"
                                        setFilteredData={setFilteredData}
                                        dataSource={dataSource}
                                        setCurrentPage={setCurrentPage}
                                        sortOption={sortOption}
                                    />
                                </Content>
                            </Col>

                            <Col span={24} xl={17} xxl={18}>
                                {dataSource?.length === 0 ? (
                                    <Empty />
                                ) : (
                                    <>
                                        <Flex justify="space-between">
                                            <Typography.Text
                                                className="font-medium mt-2"
                                                data-testid="show-text"
                                            >
                                                Showing Properties in {hotelsRequest.cityName}
                                            </Typography.Text>
                                            <Flex gap={15}>
                                                <Select
                                                    defaultValue={sortOption}
                                                    className="custom_sort w-44 h-8"
                                                    options={[
                                                        { label: 'Popular', value: 'popular' },
                                                        {
                                                            label: 'Price Low to High',
                                                            value: 'priceLowToHigh',
                                                        },
                                                        {
                                                            label: 'Price High to Low',
                                                            value: 'priceHighToLow',
                                                        },
                                                    ]}
                                                    onChange={value => setSortOption(value)}
                                                />
                                                <ReactSVG
                                                    className=" xl:hidden"
                                                    src={filterIcon}
                                                    onClick={toggleModal}
                                                />
                                            </Flex>
                                        </Flex>

                                        <div className="py-5 my-1 bg-gray-100 rounded-[20px]">
                                            {!pageLoading && paginatedData?.length === 0 ? (
                                                <Empty />
                                            ) : (
                                                <>
                                                    {pageLoading || paginatedData?.length === 0 ? (
                                                        <HotelListSkeleton length={10} />
                                                    ) : (
                                                        paginatedData.map((item, index) => (
                                                            <HotelList
                                                                key={index}
                                                                index={index}
                                                                items={item}
                                                                hotelKey={item.HotelCode}
                                                                image={
                                                                    item?.Images?.[0]
                                                                        ? item?.Images[0]
                                                                        : undefined
                                                                }
                                                                name={item?.HotelName}
                                                                facilities={item?.Address}
                                                                reviews={item.HotelRating}
                                                                // cancellationPolicy={
                                                                //     item?.rooms[0]?.ratePlan?.cancelPolicyIndicator
                                                                // }
                                                                // searchKey={searchKey}
                                                                conversationId={conversationId}
                                                                price={item?.Rooms[0]?.TotalFare}
                                                                // style={{
                                                                //     marginBottom:
                                                                //         index === paginatedData.length - 1
                                                                //             ? '1rem'
                                                                //             : '0',
                                                                // }}
                                                            />
                                                        ))
                                                    )}
                                                </>
                                            )}
                                        </div>

                                        <Flex justify="end">
                                            <Pagination
                                                current={currentPage}
                                                pageSize={itemsPerPage}
                                                total={filteredData?.length}
                                                onChange={(page: number) => setCurrentPage(page)}
                                                showSizeChanger={false}
                                            />
                                        </Flex>
                                    </>
                                )}
                            </Col>
                        </Row>
                    )}
                </>
            )}
            {/* Modal and other UI code */}
            <Modal
                // title="Filter Hotels"
                visible={isModalOpen}
                onCancel={toggleModal}
                footer={null}
                width={300}
            >
                <Filterhotel
                    title="Filter Hotels"
                    setFilteredData={setFilteredData}
                    dataSource={dataSource}
                    setCurrentPage={setCurrentPage}
                    sortOption={sortOption}
                />
            </Modal>
        </>
    );
};

export default DetailsWeb;
