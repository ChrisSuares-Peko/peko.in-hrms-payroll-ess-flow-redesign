/* eslint-disable no-nested-ternary */
import React, { lazy, Suspense, useCallback, useRef, useState } from 'react';

import { Button, Col, Empty, Flex, Row, Skeleton, Spin } from 'antd';
import { useDispatch } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { ReactSVG } from 'react-svg';

import left from '@domains/dashboard/Hike/assets/leftarrow.svg';
import right from '@domains/dashboard/Hike/assets/rightarrow.svg';
import useScreenSize from '@src/hooks/useScreenSize';
import { paths } from '@src/routes/paths';
import { showToast } from '@src/slices/apiSlice';

import HeaderBanner from '../components/HeaderBanner';
import HomePageHeader from '../components/HomePageHeader';
import SubCards from '../components/SubCards';
import useGetAllHike from '../hooks/useGetAllHikes';
import { resetAmount, resetHike } from '../slices/hikeSlice';

const HomePageCards = lazy(() => import('../components/HomePageCards'));

const HomePage: React.FC = () => {
    const navigate = useNavigate();
    const dispatch = useDispatch();
    const scrollContainerRef = useRef<HTMLDivElement>(null);
    const { hikeData, loading } = useGetAllHike();
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const [selectedHikes, setSelectedHikes] = useState<any>([]);
    const [currentIndex, setCurrentIndex] = useState(0);
    const { xs, md } = useScreenSize();

    const handleCardClick = (data: any) => {
        setSelectedHikes((prevSelectedHikes: any) => [...prevSelectedHikes, data]);
    };

    const handleSubmit = () => {
        dispatch(resetHike());
        dispatch(resetAmount());
        if (hikeData.length > 0) {
            navigate(paths.hike.purchasePage);
        } else {
            dispatch(
                showToast({
                    description: `No hike plans available`,
                    variant: 'error',
                })
            );
        }
    };

    // Function to scroll left
    const scrollLeft = () => {
        setCurrentIndex(prevIndex => (prevIndex > 0 ? prevIndex - 1 : 0));
    };

    // Function to scroll right
    const scrollRight = useCallback(() => {
        const totalVisibleCards = xs ? 1 : md ? 2 : 1; // 1 card for xs/sm, 2 cards for md+
        const maxIndex = Math.max(0, Math.ceil(hikeData.length / totalVisibleCards) - 1);
        setCurrentIndex(prevIndex => (prevIndex < maxIndex ? prevIndex + 1 : maxIndex));
    }, [hikeData, xs, md]);

    return (
        <>
            {loading ? (
                <Skeleton data-testid="skeleton-loading" />
            ) : (
                <>
                    <HomePageHeader />
                    <HeaderBanner />
                    {hikeData.length > 0 ? (
                        <Row justify="center" gutter={[20, 30]} className="relative py-4">
                            <Col xs={24} sm={24} md={20} lg={22} xl={14} className="relative">
                                {/* Scroll Left Arrow */}
                                {hikeData.length > (xs ? 1 : md ? 2 : 1) && (
                                    <ReactSVG
                                        src={left}
                                        className="absolute left-0 z-10 transform -translate-x-full -translate-y-1/2 cursor-pointer top-1/2"
                                        onClick={scrollLeft}
                                        aria-label="left arrow"
                                        beforeInjection={svg => {
                                            svg.setAttribute(
                                                'style',
                                                xs
                                                    ? 'width: 22px; height: 22px;'
                                                    : 'width: 42px; height: 42px;'
                                            );
                                        }}
                                        style={{ marginLeft: xs ? '15px' : '-12px' }}
                                    />
                                )}

                                <Flex
                                    className="w-full mx-auto overflow-hidden" // Ensures no scrollbar is visible
                                    style={{
                                        overflowX: 'hidden',
                                    }}
                                >
                                    <Flex
                                        ref={scrollContainerRef}
                                        className="flex transition-transform duration-300 ease-in-out"
                                        style={{
                                            transform: `translateX(-${currentIndex * (100 / (xs ? 1 : md ? 2 : 1))}%)`,
                                            width: `${hikeData.length * (100 / (xs ? 1 : md ? 2 : 1))}%`,
                                            margin: '0 auto',
                                        }}
                                    >
                                        {hikeData?.map((data, i) => (
                                            <Col
                                                key={i}
                                                role="button"
                                                tabIndex={0}
                                                onClick={() => handleCardClick(data)}
                                                onKeyDown={e => {
                                                    if (e.key === 'Enter' || e.key === ' ') {
                                                        handleCardClick(data);
                                                    }
                                                }}
                                                className={`flex-shrink-0 ${
                                                    xs ? 'w-full' : md ? 'w-1/2' : 'w-full'
                                                } px-2`}
                                            >
                                                <SubCards
                                                    salaryAmt={data.salaryAmount}
                                                    salaryValidation={data.salaryValidation}
                                                />
                                                <Col>
                                                    <Suspense fallback={<Spin />}>
                                                        <HomePageCards
                                                            logo={data.logo}
                                                            partner={data.partners}
                                                            amount={data.amount}
                                                            features={data.features}
                                                            planType={data.planType}
                                                            length={hikeData.length}
                                                        />
                                                    </Suspense>
                                                </Col>
                                            </Col>
                                        ))}
                                    </Flex>
                                </Flex>

                                {/* Scroll Right Arrow */}
                                {hikeData.length > (xs ? 1 : md ? 2 : 1) && (
                                    <ReactSVG
                                        src={right}
                                        className={`absolute right-0 top-1/2 transform -translate-y-1/2 z-10 cursor-pointer translate-x-full ${
                                            xs ? 'w-2 h-2' : 'w-8 h-8'
                                        }`}
                                        onClick={scrollRight}
                                        aria-label="right arrow"
                                        beforeInjection={svg => {
                                            svg.setAttribute(
                                                'style',
                                                xs
                                                    ? 'width: 22px; height: 22px;'
                                                    : 'width: 42px; height: 42px;'
                                            );
                                        }}
                                        style={{ marginRight: xs ? '15px' : '-12px' }}
                                    />
                                )}
                            </Col>
                        </Row>
                    ) : (
                        <Empty className="my-10" description="No Hike Plans Available" />
                    )}
                    <Flex justify="center" align="center">
                        <Button
                            danger
                            size="small"
                            type="primary"
                            onClick={handleSubmit}
                            disabled={hikeData.length < 1}
                            className="justify-center w-24 h-10 text-xs font-normal rounded-md sm:text-base sm:font-medium sm:w-32"
                        >
                            Buy Now
                        </Button>
                    </Flex>
                </>
            )}
        </>
    );
};

export default HomePage;
