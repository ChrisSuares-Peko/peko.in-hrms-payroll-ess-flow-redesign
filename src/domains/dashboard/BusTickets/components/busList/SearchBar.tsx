import { useMemo, useState } from 'react';

import { AutoComplete, Button, Col, DatePicker, Flex, Row, Typography } from 'antd';
import type { DefaultOptionType } from 'antd/es/select';
import dayjs, { Dayjs } from 'dayjs';
import customParseFormat from 'dayjs/plugin/customParseFormat';
import { ReactSVG } from 'react-svg';

import cityIcon from '../../assets/icons/cityIcon.svg';
import icSwap from '../../assets/icons/swapIcon.svg';
import useSearchCityApi from '../../hooks/useSearchCityApi';

dayjs.extend(customParseFormat);

const POPULAR_CITIES_ORDER = ['bangalore', 'bengaluru', 'chennai', 'hyderabad', 'pune', 'mumbai', 'delhi', 'kolkata'];
const POPULAR_CITIES_SET = new Set(POPULAR_CITIES_ORDER);

type SearchParams = {
    from: string;
    to: string;
    fromId: string;
    toId: string;
    date: string;
};

type Props = {
    from: string;
    to: string;
    date: string;
    fromId?: string;
    toId?: string;
    onSearch: (params: SearchParams) => void;
};

function formatDate(dateStr: string) {
    const formats = ['D MMMM YYYY', 'DD MMMM YYYY', 'D MMM YYYY', 'DD MMM YYYY', 'YYYY-MM-DD'];
    // eslint-disable-next-line no-restricted-syntax
    for (const fmt of formats) {
        const d = dayjs(dateStr, fmt);
        if (d.isValid()) return d;
    }
    return dayjs();
}

const fieldBox: React.CSSProperties = {
    borderRadius: 10,
    border: '1.5px solid #e2e2e2',
    height: '100%',
    minHeight: 56,
};

export default function SearchBar({ from, to, date, fromId, toId, onSearch }: Props) {
    const { options } = useSearchCityApi();

    const [fromSearch, setFromSearch] = useState(from);
    const [toSearch, setToSearch] = useState(to);
    const [fromCityId, setFromCityId] = useState<number | null>(fromId ? Number(fromId) : null);
    const [toCityId, setToCityId] = useState<number | null>(toId ? Number(toId) : null);
    const [fromState, setFromState] = useState('');
    const [toState, setToState] = useState('');
    const [selectedDate, setSelectedDate] = useState<Dayjs>(formatDate(date));

    const popularOptions = useMemo(() => {
        const popular = options.filter(opt => POPULAR_CITIES_SET.has(opt.lowerLabel));
        popular.sort((a, b) => POPULAR_CITIES_ORDER.indexOf(a.lowerLabel) - POPULAR_CITIES_ORDER.indexOf(b.lowerLabel));
        return popular.length > 0 ? popular : options.slice(0, 20);
    }, [options]);

    const popularGroup = useMemo((): DefaultOptionType[] => [{
        label: <Typography.Text style={{ fontSize: 12, color: '#8c8c8c', fontWeight: 500 }}>Popular Cities</Typography.Text>,
        options: popularOptions,
    }], [popularOptions]);

    const fromOptions = useMemo((): DefaultOptionType[] => {
        if (!fromSearch) return popularGroup;
        const lower = fromSearch.split(',')[0].trim().toLowerCase();
        return options.filter(opt => opt.lowerLabel.includes(lower) || opt.state.toLowerCase().includes(lower)).slice(0, 50);
    }, [fromSearch, options, popularGroup]);

    const toOptions = useMemo((): DefaultOptionType[] => {
        if (!toSearch) return popularGroup;
        const lower = toSearch.split(',')[0].trim().toLowerCase();
        return options.filter(opt => opt.lowerLabel.includes(lower) || opt.state.toLowerCase().includes(lower)).slice(0, 50);
    }, [toSearch, options, popularGroup]);

    const cityOptionRender = (option: DefaultOptionType) => {
        const label = (option.data?.label ?? option.label) as string;
        const state = (option.data?.state ?? option.state) as string | undefined;
        return (
            <Flex align="center" gap={8} style={{ padding: '8px 6px', borderBottom: '1px solid #F0F0F0' }}>
                <img src={cityIcon} width={14} height={14} style={{ opacity: 0.45, flexShrink: 0 }} alt="" />
                <Typography.Text style={{ fontSize: 13, fontWeight: 500 }}>
                    {label}{state ? `, ${state}` : ''}
                </Typography.Text>
            </Flex>
        );
    };

    const handleSwap = () => {
        setFromSearch(toSearch);
        setFromCityId(toCityId);
        setFromState(toState);
        setToSearch(fromSearch);
        setToCityId(fromCityId);
        setToState(fromState);
    };

    const handleSearch = () => {
        onSearch({
            from: fromSearch.split(',')[0].trim(),
            to: toSearch.split(',')[0].trim(),
            fromId: String(fromCityId ?? ''),
            toId: String(toCityId ?? ''),
            date: selectedDate.format('D MMMM YYYY'),
        });
    };

    return (
        <Row gutter={[12, 12]} align="stretch">

            <Col md={12} xs={24}>
                <Flex style={{ ...fieldBox, position: 'relative' }}>
                    {/* From */}
                    <Flex vertical justify="center" style={{ flex: 1, padding: '.5rem .5rem .5rem 1rem' }}>
                        <AutoComplete
                            value={fromSearch}
                            options={fromOptions}
                            filterOption={false}
                            onSearch={val => {
                                setFromSearch(val);
                                if (!val) { setFromCityId(null); setFromState(''); }
                            }}
                            onSelect={(_val, option: DefaultOptionType) => {
                                setFromCityId(option.value as number);
                                const state = option.state ?? option.data?.state ?? '';
                                setFromState(state);
                                setFromSearch(state ? `${option.label as string}, ${state}` : option.label as string);
                            }}
                            variant="borderless"
                            placeholder="Select City"
                            popupMatchSelectWidth={false}
                            optionRender={cityOptionRender}
                            className="!pl-0 !w-full"
                            style={{ fontSize: 24, fontWeight: 600, color: '#101010', width: '100%' }}
                        />
                                    </Flex>

                    {/* Center divider */}
                    <div style={{
                        position: 'absolute',
                        top: 0,
                        bottom: 0,
                        left: '50%',
                        width: 1,
                        background: '#e2e2e2',
                        transform: 'translateX(-50%)',
                    }} />

                    {/* Swap */}
                    <div style={{
                        position: 'absolute',
                        top: '50%',
                        left: '50%',
                        transform: 'translate(-50%, -50%)',
                        zIndex: 1,
                    }}>
                        <ReactSVG
                            src={icSwap}
                            onClick={handleSwap}
                            wrapper="div"
                            beforeInjection={svg => {
                                svg.setAttribute('style', 'cursor: pointer;');
                            }}
                        />
                    </div>

                    {/* To */}
                    <Flex vertical justify="center" style={{ flex: 1, padding: '.5rem 1rem .5rem 1rem' }}>
                        <AutoComplete
                            value={toSearch}
                            options={toOptions}
                            filterOption={false}
                            onSearch={val => {
                                setToSearch(val);
                                if (!val) { setToCityId(null); setToState(''); }
                            }}
                            onSelect={(_val, option: DefaultOptionType) => {
                                setToCityId(option.value as number);
                                const state = option.state ?? option.data?.state ?? '';
                                setToState(state);
                                setToSearch(state ? `${option.label as string}, ${state}` : option.label as string);
                            }}
                            variant="borderless"
                            placeholder="Select City"
                            popupMatchSelectWidth={false}
                            optionRender={cityOptionRender}
                            className="!pl-0 !w-full"
                            style={{ fontSize: 24, fontWeight: 600, color: '#101010', width: '100%' }}
                        />
                                    </Flex>
                </Flex>
            </Col>

            {/* Departure Date */}
            <Col md={7} xs={24}>
                <Flex vertical justify="center" className="!h-14 md:!h-full" style={{ ...fieldBox, padding: '10px 16px' }}>
                    <DatePicker
                        value={selectedDate}
                        onChange={val => val && setSelectedDate(val)}
                        variant="borderless"
                        disabledDate={current => current && current < dayjs().startOf('day')}
                        format="D MMMM YYYY"
                        className="!pl-0 !font-bold !text-base w-full"
                        allowClear={false}
                    />
                    <Typography.Text style={{ fontSize: 12, color: '#8c8c8c' }}>
                        {selectedDate.format('dddd')}
                    </Typography.Text>
                </Flex>
            </Col>

            {/* Search */}
            <Col md={5} xs={24}>
                <Flex align="center" justify="center" style={{ height: '100%', minHeight: 56 }}>
                    <Button
                        onClick={handleSearch}
                        danger
                        style={{ width: '100%', height: '100%', minHeight: 56 }}
                    >
                        Search
                    </Button>
                </Flex>
            </Col>

        </Row>
    );
}
