import { useMemo, useState } from 'react';

import { AutoComplete, Button, DatePicker, Flex, Typography } from 'antd';
import type { DefaultOptionType } from 'antd/es/select';
import dayjs, { Dayjs } from 'dayjs';
import { useNavigate } from 'react-router-dom';

import { useAppDispatch } from '@src/hooks/store';
import { paths } from '@src/routes/paths';
import { showToast } from '@src/slices/apiSlice';

import cityIcon from '../../assets/icons/cityIcon.svg';
import dateIcon from '../../assets/icons/dateIcon.svg';
import useSearchCityApi from '../../hooks/useSearchCityApi';
import { setSearchCities } from '../../slices/busTicketSlice';

const POPULAR_CITIES_ORDER = ['bangalore', 'bengaluru', 'chennai', 'hyderabad', 'pune', 'mumbai', 'delhi', 'kolkata'];
const POPULAR_CITIES_SET = new Set(POPULAR_CITIES_ORDER);

const INPUT_STYLE: React.CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    gap: 10,
    border: '1px solid #d9d9d9',
    borderRadius: 12,
    padding: '0 18px',
    background: 'white',
    height: 60,
};

export default function SearchBus() {
    const dispatch = useAppDispatch();
    const navigate = useNavigate();
    const { options } = useSearchCityApi();

    const [fromCityId, setFromCityId] = useState<number | null>(null);
    const [toCityId, setToCityId]     = useState<number | null>(null);
    const [departDate, setDepartDate] = useState<Dayjs | null>(dayjs());
    const [fromSearch, setFromSearch] = useState('');
    const [toSearch, setToSearch]     = useState('');

    const popularOptions = useMemo(() => {
        const popular = options.filter(opt => POPULAR_CITIES_SET.has(opt.lowerLabel));
        popular.sort((a, b) => POPULAR_CITIES_ORDER.indexOf(a.lowerLabel) - POPULAR_CITIES_ORDER.indexOf(b.lowerLabel));
        return popular.length > 0 ? popular : options.slice(0, 20);
    }, [options]);

    const popularGroup = useMemo((): DefaultOptionType[] => [{
        label: <Typography.Text style={{ fontSize: 16, color: '#000', fontWeight: 500 }}>Popular Cities</Typography.Text>,
        options: popularOptions,
    }], [popularOptions]);

    const cleanLabel = (s: string) => s.replace(/\s*\(.*?\)\s*/g, '').trim();

    const rankOptions = (query: string) => {
        const lower = query.toLowerCase();
        return options
            .filter(opt => cleanLabel(opt.lowerLabel).includes(lower))
            .sort((a, b) => {
                const aStarts = cleanLabel(a.lowerLabel).startsWith(lower) ? 0 : 1;
                const bStarts = cleanLabel(b.lowerLabel).startsWith(lower) ? 0 : 1;
                return aStarts - bStarts;
            })
            .slice(0, 50);
    };

    const fromOptions = useMemo((): DefaultOptionType[] => {
        if (!fromSearch) return popularGroup;
        return rankOptions(fromSearch);
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [fromSearch, options, popularGroup]);

    const toOptions = useMemo((): DefaultOptionType[] => {
        if (!toSearch) return popularGroup;
        return rankOptions(toSearch);
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [toSearch, options, popularGroup]);

    const cityOptionRender = (option: DefaultOptionType) => {
        const label = (option.data?.label ?? option.label) as string;
        const state = (option.data?.state ?? option.state) as string | undefined;
        return (
            <Flex
                align="center"
                gap={8}
                style={{ padding: '8px 6px', borderBottom: '1px solid #F0F0F0' }}
            >
                <img src={cityIcon} width={14} height={14} style={{ opacity: 0.45, flexShrink: 0 }} alt="" />
                <Typography.Text style={{ fontSize: 13, fontWeight: 500 }}>
                    {label}{state ? `, ${state}` : ''}
                </Typography.Text>
            </Flex>
        );
    };

    const handleSearch = () => {
        if (!fromCityId) {
            dispatch(showToast({ description: 'Please select a departure city.', variant: 'error' }));
            return;
        }
        if (!toCityId) {
            dispatch(showToast({ description: 'Please select a destination city.', variant: 'error' }));
            return;
        }
        if (fromCityId === toCityId) {
            dispatch(showToast({ description: 'Departure and destination cities cannot be the same.', variant: 'error' }));
            return;
        }
        if (!departDate) {
            dispatch(showToast({ description: 'Please select departure date.', variant: 'error' }));
            return;
        }
        dispatch(setSearchCities({
            sourceId: String(fromCityId),
            destinationId: String(toCityId),
            from: fromSearch,
            to: toSearch,
            doj: departDate.format('D MMMM YYYY'),
        }));
        navigate(`${paths.dashboard.corporateTravel}/${paths.bus.index}/${paths.bus.results}`);
    };

    return (
        <Flex vertical gap={20}>
            <style>{`.bus-search-input input::placeholder { font-weight: 600 !important; color: #aaa !important; }`}</style>
            {/* Manage Booking */}
            <Flex justify="end">
                <Button
                    className="h-11 px-6 rounded-lg border border-[#FF4F4F] text-[#FF4F4F] bg-white hover:bg-[#fff4f4] hover:text-[#FF4F4F] hover:border-[#FF4F4F]"
                    onClick={() => navigate(`${paths.dashboard.corporateTravel}/${paths.bus.index}/${paths.bus.manageBookings}`)}
                >
                    Manage Booking
                </Button>
            </Flex>

            {/* Search fields */}
            <Flex gap={16} wrap="wrap" align="flex-end">
                {/* From */}
                <Flex vertical gap={6} style={{ flex: 1, minWidth: 180 }}>
                    <Typography.Text style={{ fontSize: 14, color: 'rgba(0,0,0,0.85)', fontWeight: 700 }}>From</Typography.Text>
                    <div style={INPUT_STYLE}>
                        <img src={cityIcon} width={28} height={28} style={{ flexShrink: 0 }} alt="" />
                        <AutoComplete
                            value={fromSearch}
                            options={fromOptions}
                            filterOption={false}
                            onSearch={val => { setFromSearch(val); if (!val) setFromCityId(null); }}
                            onSelect={(_val, option: DefaultOptionType) => {
                                setFromCityId(option.value as number);
                                const state = option.state ?? option.data?.state;
                                setFromSearch(state ? `${option.label as string}, ${state}` : option.label as string);
                            }}
                            variant="borderless"
                            placeholder="Enter location"
                            popupMatchSelectWidth={false}
                            optionRender={cityOptionRender}
                            className="bus-search-input [&_input]:!text-[18px] [&_input]:!font-semibold [&_input]:!text-[#101010]"
                            style={{ flex: 1 }}
                        />
                    </div>
                </Flex>

                {/* To */}
                <Flex vertical gap={6} style={{ flex: 1, minWidth: 180 }}>
                    <Typography.Text style={{ fontSize: 14, color: 'rgba(0,0,0,0.85)', fontWeight: 700 }}>To</Typography.Text>
                    <div style={INPUT_STYLE}>
                        <img src={cityIcon} width={28} height={28} style={{ flexShrink: 0 }} alt="" />
                        <AutoComplete
                            value={toSearch}
                            options={toOptions}
                            filterOption={false}
                            onSearch={val => { setToSearch(val); if (!val) setToCityId(null); }}
                            onSelect={(_val, option: DefaultOptionType) => {
                                setToCityId(option.value as number);
                                const state = option.state ?? option.data?.state;
                                setToSearch(state ? `${option.label as string}, ${state}` : option.label as string);
                            }}
                            variant="borderless"
                            placeholder="Enter location"
                            popupMatchSelectWidth={false}
                            optionRender={cityOptionRender}
                            className="bus-search-input [&_input]:!text-[18px] [&_input]:!font-semibold [&_input]:!text-[#101010]"
                            style={{ flex: 1 }}
                        />
                    </div>
                </Flex>

                {/* Departure Date */}
                <Flex vertical gap={6} style={{ flex: 1, minWidth: 180 }}>
                    <Typography.Text style={{ fontSize: 14, color: 'rgba(0,0,0,0.85)', fontWeight: 700 }}>Departure Date</Typography.Text>
                    <div style={INPUT_STYLE}>
                        <img src={dateIcon} width={28} height={28} style={{ flexShrink: 0 }} alt="" />
                        <Flex vertical style={{ flex: 1 }}>
                            <DatePicker
                                value={departDate}
                                onChange={setDepartDate}
                                variant="borderless"
                                disabledDate={current => current && current < dayjs().startOf('day')}
                                format="DD MMM YYYY"
                                placeholder="Select date"
                                suffixIcon={null}
                                className="bus-search-input [&_input]:!text-[18px] [&_input]:!font-semibold [&_input]:!text-[#101010]"
                                style={{ padding: 0 }}
                            />
                            {departDate && (
                                <Typography.Text style={{ fontSize: 12, color: 'rgba(0,0,0,0.45)', paddingLeft: 11, lineHeight: 1 }}>
                                    {departDate.format('dddd')}
                                </Typography.Text>
                            )}
                        </Flex>
                    </div>
                </Flex>

                {/* Search Button */}
                <Button
                    onClick={handleSearch}
                    danger
                    type="primary"
                    size="large"
                    style={{ height: 60, paddingInline: 36, borderRadius: 12, fontWeight: 500, fontSize: 18, flexShrink: 0 }}
                >
                    Search Buses
                </Button>
            </Flex>
        </Flex>
    );
}
