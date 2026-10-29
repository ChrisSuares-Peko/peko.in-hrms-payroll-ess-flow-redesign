import { Col, Flex, Typography } from 'antd';
import { Link } from 'react-router-dom';
import { ReactSVG } from 'react-svg';

import { paths } from '@src/routes/paths';

import FlightSVG from '../Assets/icons/corporate-travel-card/airplane-card.svg';
import EsimSVG from '../Assets/icons/corporate-travel-card/esim-card.svg';
import HotelSVG from '../Assets/icons/corporate-travel-card/hotel-card.svg';

import '../Assets/style.css';

type Props = {
    selectedType: 'airline' | 'hotel' | 'esim';
};

const CorporateTravelCard = ({ selectedType }: Props) => (
    <Col className="rounded-2xl shadow-lg w-fit px-6 border m-0">
        <Flex gap={30} justify="space-between" align="center" className="xs:flex-col sm:flex-row">
            <Flex vertical>
                <Typography.Text className="text-xl font-semibold">
                    Corporate Travel
                </Typography.Text>
                <Typography.Text className="text-xs text-gray-500">
                    Business travel simplified.
                </Typography.Text>
            </Flex>
            <Flex className=" xs:ms-4 md:ms-0 sm:me-2" gap={25}>
                <Link
                    className={`flex flex-col justify-between items-center py-3 px-2 w-28 ${selectedType === 'airline' && 'border-brandPrimary border-b-2'}`}
                    to={`/corporate-travel/${paths.airline.index}`}
                >
                    <ReactSVG
                        src={FlightSVG}
                        className={`${selectedType === 'airline' && 'selected-svg'}`}
                    />
                    <Typography.Text
                        className={`text-sm font-medium ${selectedType === 'airline' && 'text-brandPrimary'}`}
                    >
                        Air Ticket
                    </Typography.Text>
                </Link>
                <Link
                    className={`flex flex-col justify-between items-center py-3 px-2 w-28 ${selectedType === 'hotel' && 'border-brandPrimary border-b-2'}`}
                    to={`/corporate-travel/${paths.hotels.index}`}
                >
                    <ReactSVG
                        src={HotelSVG}
                        className={`${selectedType === 'hotel' && 'selected-svg'}`}
                    />
                    <Typography.Text
                        className={`text-sm font-medium ${selectedType === 'hotel' && 'text-brandPrimary'}`}
                    >
                        Hotel Booking
                    </Typography.Text>
                </Link>
                <Flex
                    className={`py-3 px-2 w-28 ${selectedType === 'esim' && 'border-brandPrimary border-b-2'}`}
                    justify="space-between"
                    align="center"
                    vertical
                >
                    <ReactSVG
                        src={EsimSVG}
                        className={`${selectedType === 'esim' && 'selected-svg'}`}
                    />
                    <Typography.Text
                        className={`text-sm font-medium ${selectedType === 'esim' && 'text-brandPrimary'}`}
                    >
                        eSim
                    </Typography.Text>
                </Flex>
            </Flex>
        </Flex>
    </Col>
);

export default CorporateTravelCard;
