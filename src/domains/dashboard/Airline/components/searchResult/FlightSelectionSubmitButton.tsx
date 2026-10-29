import { useState } from 'react';

import { Button, Divider, Flex, Typography } from 'antd';
import { useNavigate } from 'react-router-dom';

import { useAppSelector } from '@src/hooks/store';
import { paths } from '@src/routes/paths';
import { formatNumberWithLocalString } from '@utils/priceFormat';

import { Flight } from '../../types/Flight';
import FlightInfoDrawer from '../FlightInfoDrawer';
import SelectedResultCardSmall from '../SelectedResultCardSmall';

const FlightSelectionSubmitButton = ({ isMultiCity }: { isMultiCity?: boolean }) => {
    const navigate = useNavigate();

    const { selectedAirline, selectedInbountAirline } = useAppSelector(
        state => state.reducer.airline
    );

    const [drawerDetails, setDrawerDetails] = useState<Flight>();
    const [isDrawerOpen, setIsDrawerOpen] = useState<boolean>(false);
    const [selectedAirlinePrice, setSelectedAirlinePrice] = useState<number>();

    const price = (selectedAirline?.price || 0) + (selectedInbountAirline?.price || 0);

    if (!selectedAirline?.ResultIndex || !selectedInbountAirline?.ResultIndex) return null;

    const handleClick = () => {
        navigate(
            `${paths.dashboard.corporateTravel}/${paths.airline.index}/${paths.airline.results}/${paths.airline.details}`
        );
    };

    return (
        <Flex className="w-full bg-white px-5 py-3 rounded-2xl shadow-2xl gap-3 border border-red-500">
            <Flex vertical className="flex-1 mt-2">
                <Flex className="mb-2">
                    <Typography.Text className="text-xs text-gray-400">
                        {isMultiCity ? 'Segment 1' : 'Departure'}
                    </Typography.Text>
                </Flex>
                <SelectedResultCardSmall
                    item={selectedAirline}
                    setDrawerDetails={setDrawerDetails}
                    setIsDrawerOpen={setIsDrawerOpen}
                    setSelectedAirlinePrice={setSelectedAirlinePrice}
                    isBanner
                />
            </Flex>
            <Divider type="vertical" className="border-gray-200 h-full" />
            <Flex vertical className="flex-1 mt-2">
                <Flex className="mb-2">
                    <Typography.Text className="text-xs text-gray-400">
                        {isMultiCity ? 'Segment 2' : 'Return'}
                    </Typography.Text>
                </Flex>
                <SelectedResultCardSmall
                    item={selectedInbountAirline}
                    setDrawerDetails={setDrawerDetails}
                    setIsDrawerOpen={setIsDrawerOpen}
                    setSelectedAirlinePrice={setSelectedAirlinePrice}
                    isBanner
                />
            </Flex>
            <Flex vertical className=" flex justify-end self-start px-5 mt-6 gap-2">
                <Flex vertical className="items-center mb-1">
                    <Typography.Text className="text-xs text-gray-400">Price</Typography.Text>
                    <Typography.Text className="font-medium text-md mt-1">
                        ₹ {formatNumberWithLocalString(price)}
                    </Typography.Text>
                </Flex>
                <Button
                    key="submit"
                    type="primary"
                    danger
                    onClick={handleClick}
                    className="rounded-md"
                >
                    Book Now
                </Button>
            </Flex>

            {isDrawerOpen && drawerDetails && (
                <FlightInfoDrawer
                    handleClose={() => setIsDrawerOpen(!isDrawerOpen)}
                    flightDetails={drawerDetails}
                    price={selectedAirlinePrice}
                    isDrawerOpen={isDrawerOpen}
                    handleSubmit={handleClick}
                />
            )}
        </Flex>
    );
};

export default FlightSelectionSubmitButton;
