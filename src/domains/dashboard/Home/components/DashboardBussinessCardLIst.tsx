import { Carousel, Col, Skeleton } from 'antd';

import useScreenSize from '@src/hooks/useScreenSize';

import DashboardBusinessCard from './DashboardBusinessCard';
import useBannersApi from '../hooks/useBannersApi';

const DashboardBussinessCardList = () => {
    const { data, isLoading } = useBannersApi('BOTTOM');
    const { xs } = useScreenSize();

    return (
        <div className="relative mt-2 overflow-hidden rounded-md sm:mt-0 lg:rounded-2xl">
            <Carousel
                className="mb-5 md:mt-5 rounded-3xl"
                slidesToShow={1}
                autoplay
                autoplaySpeed={4000}
                dots={{
                    className: xs
                        ? 'custom-slick-dots-bussiness-mobile'
                        : 'custom-slick-dots-bussiness',
                }}
                speed={1600}
                effect="scrollx"
            >
                {isLoading ? (
                    <Col className="h-72 w-72">
                        <Skeleton active />
                    </Col>
                ) : (
                    data?.map(item => <DashboardBusinessCard bannerData={item} key={item.id} />)
                )}
            </Carousel>
        </div>
    );
};
export default DashboardBussinessCardList;
