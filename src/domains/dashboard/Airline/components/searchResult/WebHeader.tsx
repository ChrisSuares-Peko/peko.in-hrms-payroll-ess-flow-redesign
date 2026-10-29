import { ArrowDownOutlined, ArrowUpOutlined } from '@ant-design/icons';
import { Flex, Typography } from 'antd';

import { useAppSelector } from '@src/hooks/store';
import { formattedDateOnly } from '@utils/dateFormat';

import { retrieveAirport } from '../../utils/airlineData';

function createdFormattedDate(dateStirng: string) {
    let [day, month, year] = dateStirng.split('-');
    if (!month) {
        [day, month, year] = dateStirng.split(' ');
    }
    const date = new Date(`${year}-${month}-${day}`);

    return formattedDateOnly(date);
}

interface WebHeaderProps {
    filterValue: { type: string; highest: boolean };
    setFilterValue: (value: { type: string; highest: boolean }) => void;
    isDomesticRoundTrip?: boolean;
    isMultiCity?: boolean;
    isOutbount?: boolean;
    searchParams?: {
        fromLocation1?: string;
        toLocation1?: string;
        depart1?: string;
        arrive?: string;
    };
}

const WebHeader = ({
    filterValue,
    setFilterValue,
    isDomesticRoundTrip,
    isMultiCity,
    isOutbount,
    searchParams,
}: WebHeaderProps) => {
    const updateFilterValue = (type: string) => {
        setFilterValue({
            type,
            highest: !filterValue.highest,
        });
    };

    // Use searchParams if provided (from actual search), otherwise fallback to Redux (for initial render)
    const { searchData } = useAppSelector(state => state.reducer.airline);
    const params = searchParams && Object.keys(searchParams).length > 0 ? searchParams : searchData;

    // Multi-city leg 2 is the BASE fields (fromLocation→toLocation on `depart`), not the
    // round-trip reverse of the *1 fields. Base fields live on searchData (the full tripData),
    // since searchParams only carries the *1 leg.
    const isMultiCitySecondLeg = isMultiCity && !isOutbount;

    let origin: string;
    let destinations: string;
    if (isMultiCitySecondLeg) {
        origin = retrieveAirport(searchData.fromLocation || '');
        destinations = retrieveAirport(searchData.toLocation || '');
    } else if (isOutbount) {
        origin = retrieveAirport(params.fromLocation1 || '');
        destinations = retrieveAirport(params.toLocation1 || '');
    } else {
        origin = retrieveAirport(params.toLocation1 || '');
        destinations = retrieveAirport(params.fromLocation1 || '');
    }

    let date = '';
    if (isMultiCitySecondLeg) {
        date = createdFormattedDate(searchData.depart || '');
    } else if (isOutbount) {
        date = createdFormattedDate(params.depart1 || '');
    } else if (params.arrive && params.arrive !== 'Invalid Date') {
        date = createdFormattedDate(params.arrive);
    }

    return (
        <Flex
            vertical
            className="md:bg-[#F4F6FA] px-[7%] min-h-10 w-full rounded-[12px] justify-center py-3"
            gap={5}
        >
            {(isDomesticRoundTrip || isMultiCity) && (
                <Flex className="gap-2">
                    {isMultiCity && (
                        <Typography.Text className="font-bold text-iconRed">
                            {isOutbount ? 'Segment 1:' : 'Segment 2:'}
                        </Typography.Text>
                    )}
                    <Typography.Text className="font-bold">
                        {origin} → {destinations}
                    </Typography.Text>
                    <Typography.Text>{date}</Typography.Text>
                </Flex>
            )}
            <Flex className="" justify="space-between" align="center">
                <Typography.Text className="text-xs hidden md:flex">Airlines</Typography.Text>
                <Typography.Text
                    onClick={() => updateFilterValue('departure')}
                    className={`text-xs ${filterValue.type === 'departure' && 'font-semibold text-iconRed'} cursor-pointer`}
                >
                    Departure
                    {filterValue.highest === true && filterValue.type === 'departure' && (
                        <ArrowDownOutlined className="ms-2" />
                    )}
                    {filterValue.highest === false && filterValue.type === 'departure' && (
                        <ArrowUpOutlined className="ms-2" />
                    )}
                </Typography.Text>
                <Typography.Text
                    onClick={() => updateFilterValue('duration')}
                    className={`text-xs ${filterValue.type === 'duration' && 'font-semibold text-iconRed'} cursor-pointer`}
                >
                    Duration
                    {filterValue.highest === true && filterValue.type === 'duration' && (
                        <ArrowDownOutlined className="ms-2" />
                    )}
                    {filterValue.highest === false && filterValue.type === 'duration' && (
                        <ArrowUpOutlined className="ms-2" />
                    )}
                </Typography.Text>
                <Typography.Text
                    onClick={() => updateFilterValue('arrival')}
                    className={`text-xs ${filterValue.type === 'arrival' && 'font-semibold text-iconRed'} cursor-pointer`}
                >
                    Arrival
                    {filterValue.highest === true && filterValue.type === 'arrival' && (
                        <ArrowDownOutlined className="ms-2" />
                    )}
                    {filterValue.highest === false && filterValue.type === 'arrival' && (
                        <ArrowUpOutlined className="ms-2" />
                    )}
                </Typography.Text>
                <Typography.Text
                    onClick={() => updateFilterValue('price')}
                    className={`text-xs ${filterValue.type === 'price' && 'font-semibold text-iconRed'} cursor-pointer me-2`}
                >
                    Price
                    {filterValue.highest === true && filterValue.type === 'price' && (
                        <ArrowDownOutlined className="ms-2" />
                    )}
                    {filterValue.highest === false && filterValue.type === 'price' && (
                        <ArrowUpOutlined className="ms-2" />
                    )}
                </Typography.Text>
            </Flex>
        </Flex>
    );
};

export default WebHeader;
