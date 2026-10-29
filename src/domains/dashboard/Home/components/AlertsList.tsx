/* eslint-disable no-nested-ternary */
import { Typography, Carousel, Skeleton, Col, Flex, Image } from 'antd';

import AlertsEmpty from '@assets/AlertsEmpty.png';
import EarningsIcon from '@assets/icons/Earnings.svg';
import MoneyBackIcon from '@assets/icons/MoneyBack.svg';
import Supplies from '@assets/icons/Supplies.svg';
import DefaultAlert from '@assets/svg/defaultAlert.svg';
import useScreenSize from '@src/hooks/useScreenSize';

import AlertCard from './AlertCard';
import useAlertsApi from '../hooks/useAlertsApi';

type AlertsProps = {
    alertsREF?: React.MutableRefObject<null>;
};
const { Text } = Typography;

const AlertsList = ({ alertsREF }: AlertsProps) => {
    const { alerts, isLoading } = useAlertsApi();
    const { xs } = useScreenSize();
    const getImageSource = (title: string, fallbackImage: string) => {
        switch (title) {
            case 'Monthly Spending':
                return EarningsIcon;
            case 'Cashback':
                return MoneyBackIcon;
            case 'Order Pending':
                return Supplies;
            default:
                return fallbackImage ?? DefaultAlert;
        }
    };
    return (
        <div ref={alertsREF}>
            <Text className="pb-1 text-sm font-medium md:text-lg">Alerts</Text>
            {isLoading ? (
                <Flex>
                    {Array.from({ length: 2 }).map((_, index) => (
                        <Col span={12} key={index}>
                            <Skeleton.Avatar active size="large" />
                            <Skeleton
                                active
                                paragraph={{ rows: 1 }}
                                className="w-full "
                                rootClassName="mt-3"
                            />
                            <Skeleton.Button active className="pr-10 mt-3" block size="small" />
                        </Col>
                    ))}
                </Flex>
            ) : alerts && alerts.length > 0 ? (
                <Carousel
                    className="relative mt-4 md:mt-2"
                    responsive={[
                        {
                            breakpoint: 399,
                            settings: {
                                slidesToShow: 1,
                                slidesToScroll: 1,
                                infinite: true,
                                dots: true,
                                autoplay: true,
                            },
                        },
                        {
                            breakpoint: 576,
                            settings: {
                                slidesToShow: alerts.length === 1 ? 1 : 2,
                                slidesToScroll: 1,
                                infinite: true,
                                dots: true,
                                autoplay: true,
                            },
                        },
                        {
                            breakpoint: 768,
                            settings: {
                                slidesToShow: alerts.length === 1 ? 1 : 2,
                                slidesToScroll: 1,
                                infinite: true,
                                dots: true,
                                autoplay: true,
                            },
                        },
                        {
                            breakpoint: 992,
                            settings: {
                                slidesToShow: 2,
                                slidesToScroll: 1,
                                infinite: true,
                                dots: true,
                                autoplay: true,
                            },
                        },
                        {
                            breakpoint: 1199,
                            settings: {
                                slidesToShow: 2,
                                slidesToScroll: 1,
                                infinite: true,
                                dots: true,
                                autoplay: true,
                            },
                        },
                        {
                            breakpoint: 1600,
                            settings: {
                                slidesToShow: alerts.length === 1 ? 1 : 1,
                                slidesToScroll: 1,
                                infinite: true,
                                dots: true,
                                autoplay: true,
                            },
                        },
                        {
                            breakpoint: 2560,
                            settings: {
                                slidesToShow: alerts.length === 1 ? 1 : 2,
                            },
                        },
                    ]}
                    autoplay
                    dots={
                        xs
                            ? { className: 'custom-slick-dots-hide ' }
                            : { className: 'custom-slick-dots' }
                    }
                    // dots={{className: "custom-slick-dots-hide"}}
                >
                    {alerts.map((alert, index) => {
                        const imageSource = getImageSource(alert.type, alert.providerImage);
                        return (
                            <AlertCard
                                key={index}
                                title={alert.type}
                                value={alert.message}
                                image={imageSource}
                                linkUrl={alert.linkUrl}
                            />
                        );
                    })}
                </Carousel>
            ) : (
                <Flex vertical align="center" justify="center" className="my-6">
                    <Image src={AlertsEmpty} loading="lazy" preview={false} width="27%" />
                    <Typography.Text className="py-4 text-[0.8rem] font-normal text-center text-gray-400 mt-4">
                        Awesome! You are up-to-date. <br /> There are no alerts displayed at this
                        moment.
                    </Typography.Text>
                </Flex>
            )}
        </div>
    );
};
export default AlertsList;
