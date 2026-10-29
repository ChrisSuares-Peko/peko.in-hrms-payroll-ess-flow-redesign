import React, { useState } from 'react';

import { Button, Card, Flex, Image, Skeleton, Typography } from 'antd';
import { useLocation, useNavigate } from 'react-router-dom';
import { ReactSVG } from 'react-svg';

import eSimDefault from '@domains/dashboard/esim/assets/images/eSimDefault.png';
import useScreenSize from '@src/hooks/useScreenSize';
import { paths } from '@src/routes/paths';
import { formatNumberWithLocalString } from '@utils/priceFormat';

import CountryModal from './CountryModal';
import CalenderSVG from '../../assets/icons/Calender.svg';
import DataSVG from '../../assets/icons/Data.svg';
import GlobeSVG from '../../assets/icons/globe_red.svg';
import MessageSVG from '../../assets/icons/Message.svg';
import PhoneSVG from '../../assets/icons/Phone.svg';
import '../../assets/style.css';
import { Country } from '../../types/packagesList';

type Props = {
    image: string;
    voice: string | null;
    sms: string | null;
    data: string;
    validity: number | null;
    coverage: Country[];
    price: number | null;
    title: string;
    conversionRate: number;
    id: string;
};

const PackageCard = ({
    coverage,
    data,
    image,
    sms,
    validity,
    voice,
    price,
    title,
    conversionRate,
    id,
}: Props) => {
    const navigate = useNavigate();
    const { state } = useLocation();
    const [isModalOpen, setIsModalOpen] = useState(false);
    const { xs, xxl } = useScreenSize();

    const toggleModal = () => setIsModalOpen(!isModalOpen);
    const [imageLoaded, setImageLoaded] = useState(false);

    const packageDetails = [
        {
            icon: PhoneSVG,
            title: 'Voice:',
            value: voice ? `${voice} min` : 'N/A',
        },
        {
            icon: MessageSVG,
            title: 'SMS:',
            value: sms ?? 'N/A',
        },
        {
            icon: DataSVG,
            title: 'Data:',
            value: data ?? 'N/A',
        },
        {
            icon: CalenderSVG,
            title: 'Validity:',
            value: `${validity} Days` || 'N/A',
        },
        {
            icon: GlobeSVG,
            title: 'Coverage:',
            value: coverage.length === 1 ? coverage[0].title : `${coverage.length}+ Countries `,
        },
    ];
    return (
        <Card
            size="small"
            className="rounded-xl p-2 scale_on_hover"
            style={xs || xxl ? {} : { height: '25rem' }}
            key={id}
        >
            <Flex vertical>
                {!imageLoaded && <Skeleton.Image style={{ width: 250, height: 140 }} active />}
                <Image
                    loading="lazy"
                    src={image || eSimDefault}
                    preview={false}
                    style={{ opacity: imageLoaded ? 1 : 0, transition: 'opacity 0.9s ease-in-out' }}
                    onLoad={() => setImageLoaded(true)}
                    // eslint-disable-next-line no-return-assign
                    onError={(e: React.SyntheticEvent<HTMLImageElement>) =>
                        ((e.target as HTMLImageElement).src = eSimDefault)
                    }
                />

                <Typography.Text className="text-red-500 text-lg font-medium m-2">
                    {title}
                </Typography.Text>
                <Flex gap={13} wrap="wrap" className="mt-4 m-2">
                    {packageDetails?.map((item, i) => (
                        <Flex onClick={() => item.title === 'Coverage:' && toggleModal()}>
                            <ReactSVG src={item.icon} />
                            <Typography.Text
                                className={`text-xs ms-2 ${item.title === 'Coverage:' ? 'text-red-500 cursor-pointer' : 'text-textGrey'}`}
                            >
                                {item.title}
                            </Typography.Text>
                            <Typography.Text
                                className={`text-xs font-medium ms-1 ${item.title === 'Coverage:' ? 'text-red-500 cursor-pointer' : 'text-textBlack'} `}
                            >
                                {item.value}
                            </Typography.Text>
                        </Flex>
                    ))}
                </Flex>
                <Button
                    onClick={() =>
                        navigate(paths.esim.details, {
                            state: {
                                price,
                                title,
                                data,
                                id,
                                ...state,
                            },
                        })
                    }
                    className="w-full my-4"
                    size="large"
                    danger
                >
                    <Typography.Text className="xs:text-xs lg:text-sm font-medium text-red-500  text-center w-full whitespace-nowrap overflow-hidden text-ellipsis">
                        ₹ {price ? formatNumberWithLocalString(price * conversionRate) : ''}
                    </Typography.Text>
                </Button>
                {isModalOpen && (
                    <CountryModal
                        isModalOpen={isModalOpen}
                        handleCancel={toggleModal}
                        country={coverage}
                    />
                )}
            </Flex>
        </Card>
    );
};

export default PackageCard;
