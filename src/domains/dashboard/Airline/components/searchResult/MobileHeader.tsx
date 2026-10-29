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

interface MobileHeaderProps {
    filterValue: { type: string; highest: boolean };
    setFilterValue: (value: { type: string; highest: boolean }) => void;
    isDomesticRoundTrip?: boolean;
    isOutbount?: boolean;
    searchParams?: {
        fromLocation1?: string;
        toLocation1?: string;
        depart1?: string;
        arrive?: string;
    };
}

const MobileHeader = ({
    filterValue,
    setFilterValue,
    isDomesticRoundTrip,
    isOutbount,
    searchParams,
}: MobileHeaderProps) => {
    const updateFilterValue = (type: string) => {
        setFilterValue({
            type,
            highest: !filterValue.highest,
        });
    };

    // Use searchParams if provided (from actual search), otherwise fallback to Redux (for initial render)
    const { searchData } = useAppSelector(state => state.reducer.airline);
    const params = searchParams && Object.keys(searchParams).length > 0 ? searchParams : searchData;

    const origin = isOutbount
        ? retrieveAirport(params.fromLocation1 || '')
        : retrieveAirport(params.toLocation1 || '');
    const destinations = isOutbount
        ? retrieveAirport(params.toLocation1 || '')
        : retrieveAirport(params.fromLocation1 || '');

    let date: string;
    if (isOutbount) {
        date = createdFormattedDate(params.depart1 || '');
    } else if (params.arrive && params.arrive !== 'Invalid Date') {
        date = createdFormattedDate(params.arrive);
    } else {
        date = '';
    }

    return (
        <Flex
            vertical
            className="md:bg-[#F4F6FA] px-2 min-h-10 w-full rounded-sm justify-center py-3 border-t border-b border-solid"
            gap={5}
        >
            {isDomesticRoundTrip && (
                <Flex className="gap-2">
                    <Typography.Text className="font-bold">
                        {origin} → {destinations}
                    </Typography.Text>
                    <Typography.Text>{date}</Typography.Text>
                </Flex>
            )}
            <Flex className="mt-0.5" justify="space-between" align="center">
                <Typography.Text className="text-xs hidden md:flex">Airlines</Typography.Text>
                <Typography.Text
                    onClick={() => updateFilterValue('departure')}
                    className={`text-[0.6rem] ${filterValue.type === 'departure' && 'font-semibold text-iconRed'} cursor-pointer`}
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
                    className={`text-[0.6rem] ${filterValue.type === 'duration' && 'font-semibold text-iconRed'} cursor-pointer`}
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
                    className={`text-[0.6rem] ${filterValue.type === 'arrival' && 'font-semibold text-iconRed'} cursor-pointer`}
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
                    className={`text-[0.6rem] ${filterValue.type === 'price' && 'font-semibold text-iconRed'} cursor-pointer me-2`}
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

export default MobileHeader;
