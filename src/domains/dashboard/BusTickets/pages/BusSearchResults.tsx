import { useEffect, useMemo, useState } from 'react';

import { Col, Empty, Flex, Pagination, Row, Spin } from 'antd';
import { useNavigate } from 'react-router-dom';

import { useAppDispatch, useAppSelector } from '@src/hooks/store';
import { paths } from '@src/routes/paths';

import BusCard from '../components/busList/BusCard';
import BusListHeader from '../components/busList/BusListHeader';
import FilterSidebar from '../components/busList/FilterSidebar';
import SearchBar from '../components/busList/SearchBar';
import useSearchBusApi from '../hooks/useSearchBusApi';
import { clearBusResults, setSearchCities } from '../slices/busTicketSlice';
import { BestOption } from '../types/buslist';

export default function BusSearchResults() {
    const navigate = useNavigate();
    const dispatch = useAppDispatch();
    const { buses, isLoading, search } = useSearchBusApi();

    const from   = useAppSelector(state => state.reducer.busTicket.from);
    const to     = useAppSelector(state => state.reducer.busTicket.to);
    const fromId = useAppSelector(state => state.reducer.busTicket.sourceId);
    const toId   = useAppSelector(state => state.reducer.busTicket.destinationId);
    const date   = useAppSelector(state => state.reducer.busTicket.doj);

    useEffect(() => {
        dispatch(clearBusResults());
    }, [dispatch]);

    const [searchTrigger, setSearchTrigger] = useState(0);
    const [activeFilters, setActiveFilters] = useState<string[]>([]);
    const [priceRange, setPriceRange] = useState<[number, number]>([0, 10000]);
    const [bestOption, setBestOption] = useState<BestOption>(null);
    const [selectedDeparture, setSelectedDeparture] = useState<string[]>([]);
    const [selectedAmenities, setSelectedAmenities] = useState<string[]>([]);
    const [activeSort, setActiveSort] = useState<'departure' | 'duration' | 'arrival' | 'price' | null>(null);
    const [sortDir, setSortDir] = useState<'asc' | 'desc' | null>(null);
    const [currentPage, setCurrentPage] = useState(1);

    const ITEMS_PER_PAGE = 10;

    const minPrice = buses.length ? Math.floor(Math.min(...buses.map(b => b.price))) : 0;
    const maxPrice = buses.length ? Math.ceil(Math.max(...buses.map(b => b.price))) : 10000;

    const parseDurationMins = (d: string) => {
        const [h, m] = d.replace(/\s*hrs?/i, '').split(':').map(Number);
        return (h || 0) * 60 + (m || 0);
    };

    const toMins = (t: string) => { const [h, m] = t.split(':').map(Number); return h * 60 + m; };

    // Buses filtered by price only (used to compute departure time counts)
    const priceFilteredBuses = useMemo(() =>
        buses.filter(b => b.price >= priceRange[0] && b.price <= priceRange[1])
    , [buses, priceRange]);

    // Buses filtered by price + departure (used to compute type pill counts and best option)
    const baseFilteredBuses = useMemo(() => {
        let result = [...priceFilteredBuses];
        if (selectedDeparture.length > 0) {
            result = result.filter(bus => {
                const mins = toMins(bus.departTime);
                return selectedDeparture.some(label => {
                    if (label === 'Morning')   return mins >= 0    && mins <= 719;
                    if (label === 'Noon')      return mins >= 720  && mins <= 899;
                    if (label === 'Afternoon') return mins >= 900  && mins <= 1079;
                    if (label === 'Night')     return mins >= 1080;
                    return false;
                });
            });
        }
        return result;
    }, [priceFilteredBuses, selectedDeparture]);

    // Counts reflect current price + departure selection so pills update dynamically
    const busTypeFilters = useMemo(() => baseFilteredBuses.length ? [
        `AC (${baseFilteredBuses.filter(b => b.isAC).length})`,
        `Non AC (${baseFilteredBuses.filter(b => !b.isAC).length})`,
        `Sleeper (${baseFilteredBuses.filter(b => b.isSleeper).length})`,
        `Seater (${baseFilteredBuses.filter(b => b.isSeater).length})`,
        `Live tracking (${baseFilteredBuses.filter(b => b.liveTracking).length})`,
        `Free cancellation (${baseFilteredBuses.filter(b => b.hasFreeCancellation).length})`,
        `High rated (${baseFilteredBuses.filter(b => b.rating >= 4).length})`,
    ].filter(f => !f.endsWith('(0)')) : [], [baseFilteredBuses]);

    // Best option details reflect current price + departure filters
    const bestOptionDetails = useMemo(() => {
        if (!baseFilteredBuses.length) return { cheapest: '', earliest: '', fastest: '' };
        const cheapest = baseFilteredBuses.reduce((a, b) => a.price < b.price ? a : b);
        const earliest = baseFilteredBuses.reduce((a, b) => toMins(a.departTime) < toMins(b.departTime) ? a : b);
        const fastest  = baseFilteredBuses.reduce((a, b) => parseDurationMins(a.duration) < parseDurationMins(b.duration) ? a : b);
        return {
            cheapest: `₹${cheapest.price.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} · ${cheapest.duration}`,
            earliest: `${earliest.departTime} · ₹${earliest.price.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
            fastest:  `${fastest.duration} · ₹${fastest.price.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
        };
    }, [baseFilteredBuses]);

    const availableAmenities = useMemo(() =>
        [...new Set(buses.flatMap(b => b.amenities))].sort()
    , [buses]);

    // Departure counts reflect current price filter
    const departureCounts = useMemo(() => ({
        Morning:   priceFilteredBuses.filter(b => { const m = toMins(b.departTime); return m >= 0    && m <= 719;  }).length,
        Noon:      priceFilteredBuses.filter(b => { const m = toMins(b.departTime); return m >= 720  && m <= 899;  }).length,
        Afternoon: priceFilteredBuses.filter(b => { const m = toMins(b.departTime); return m >= 900  && m <= 1079; }).length,
        Night:     priceFilteredBuses.filter(b => { const m = toMins(b.departTime); return m >= 1080;              }).length,
    }), [priceFilteredBuses]);

    const filteredBuses = useMemo(() => {
        let result = [...buses];

        if (activeFilters.length > 0) {
            result = result.filter(bus =>
                activeFilters.every(f => {
                    const label = f.replace(/\s*\(\d+\)$/, '').toLowerCase();
                    if (label === 'ac') return bus.isAC;
                    if (label === 'non ac') return !bus.isAC;
                    if (label === 'sleeper') return bus.isSleeper;
                    if (label === 'seater') return bus.isSeater;
                    if (label === 'live tracking') return bus.liveTracking;
                    if (label === 'free cancellation') return bus.hasFreeCancellation;
                    if (label === 'high rated') return bus.rating >= 4;
                    return true;
                })
            );
        }

        result = result.filter(b => b.price >= priceRange[0] && b.price <= priceRange[1]);

        if (selectedDeparture.length > 0) {
            result = result.filter(bus => {
                const [h, m] = bus.departTime.split(':').map(Number);
                const mins = h * 60 + m;
                return selectedDeparture.some(label => {
                    if (label === 'Morning')   return mins >= 0    && mins <= 719;
                    if (label === 'Noon')      return mins >= 720  && mins <= 899;
                    if (label === 'Afternoon') return mins >= 900  && mins <= 1079;
                    if (label === 'Night')     return mins >= 1080;
                    return false;
                });
            });
        }

        if (selectedAmenities.length > 0) {
            result = result.filter(bus =>
                selectedAmenities.every(a => bus.amenities.some(ba => ba.toLowerCase().trim() === a.toLowerCase().trim()))
            );
        }

        if (bestOption === 'cheapest') {
            result = [...result].sort((a, b) => a.price - b.price);
        } else if (bestOption === 'earliest') {
            result = [...result].sort((a, b) => toMins(a.departTime) - toMins(b.departTime));
        } else if (bestOption === 'fastest') {
            result = [...result].sort((a, b) => parseDurationMins(a.duration) - parseDurationMins(b.duration));
        } else if (activeSort && sortDir) {
            const dir = sortDir === 'asc' ? 1 : -1;
            result = [...result].sort((a, b) => {
                if (activeSort === 'price')     return dir * (a.price - b.price);
                if (activeSort === 'departure') return dir * (toMins(a.departTime) - toMins(b.departTime));
                if (activeSort === 'arrival')   return dir * (toMins(a.arrivalTime) - toMins(b.arrivalTime));
                if (activeSort === 'duration')  return dir * (parseDurationMins(a.duration) - parseDurationMins(b.duration));
                return 0;
            });
        }

        return result;
    }, [buses, activeFilters, priceRange, selectedDeparture, selectedAmenities, bestOption, activeSort, sortDir]);

    const paginatedBuses = filteredBuses.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE);

    useEffect(() => {
        if (fromId && toId && date) {
            search(fromId, toId, date, from, to);
            setCurrentPage(1);
        }
    }, [fromId, toId, date, from, to, search, searchTrigger]);

    useEffect(() => {
        if (buses.length) {
            setPriceRange([minPrice, maxPrice]);
        }
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [buses]);

    useEffect(() => {
        setCurrentPage(1);
    }, [activeFilters, priceRange, selectedDeparture, selectedAmenities, bestOption, activeSort, sortDir]);

    const toggleFilter = (val: string) =>
        setActiveFilters(prev => prev.includes(val) ? prev.filter(x => x !== val) : [...prev, val]);

    const toggleDeparture = (val: string) =>
        setSelectedDeparture(prev => prev.includes(val) ? prev.filter(x => x !== val) : [...prev, val]);

    const toggleAmenity = (val: string) =>
        setSelectedAmenities(prev => prev.includes(val) ? prev.filter(x => x !== val) : [...prev, val]);

    const resetFilters = () => {
        setActiveFilters([]);
        setPriceRange([minPrice, maxPrice]);
        setBestOption(null);
        setSelectedDeparture([]);
        setSelectedAmenities([]);
        setActiveSort(null);
        setSortDir(null);
    };

    return (
        <Flex vertical className="min-h-screen bg-white">
            <SearchBar
                from={from}
                to={to}
                date={date}
                fromId={fromId}
                toId={toId}
                onSearch={({ from: newFrom, to: newTo, fromId: newFromId, toId: newToId, date: newDate }) => {
                    const valuesUnchanged = newFromId === fromId && newToId === toId && newDate === date;
                    dispatch(setSearchCities({ sourceId: newFromId, destinationId: newToId, from: newFrom, to: newTo, doj: newDate }));
                    if (valuesUnchanged) setSearchTrigger(prev => prev + 1);
                    navigate(`${paths.dashboard.corporateTravel}/${paths.bus.index}/${paths.bus.results}`);
                }}
            />

            {isLoading ? (
                <Flex justify="center" align="center" style={{ flex: 1, minHeight: 300 }}>
                    <Spin size="large" />
                </Flex>
            ) : (
                <Row gutter={[12, 8]} className="mt-4" >
                    <Col xs={24} md={7}>
                        <FilterSidebar
                            busTypeFilters={busTypeFilters}
                            activeFilters={activeFilters}
                            onToggleFilter={toggleFilter}
                            priceRange={priceRange}
                            onPriceChange={setPriceRange}
                            minPrice={minPrice}
                            maxPrice={maxPrice}
                            bestOption={bestOption}
                            onBestOption={setBestOption}
                            bestOptionDetails={bestOptionDetails}
                            selectedDeparture={selectedDeparture}
                            onToggleDeparture={toggleDeparture}
                            departureCounts={departureCounts}
                            availableAmenities={availableAmenities}
                            selectedAmenities={selectedAmenities}
                            onToggleAmenity={toggleAmenity}
                            onReset={resetFilters}
                        />
                    </Col>
                    <Col xs={24} md={17}>
                        <BusListHeader
                            activeSort={activeSort}
                            sortDir={sortDir}
                            onSortToggle={key => {
                                if (activeSort === key) {
                                    if (sortDir === 'asc') { setSortDir('desc'); }
                                    else if (sortDir === 'desc') { setActiveSort(null); setSortDir(null); }
                                } else {
                                    setActiveSort(key);
                                    setSortDir('asc');
                                }
                            }}
                        />

                        {filteredBuses.length === 0 ? (
                            <Flex justify="center" align="center" style={{ minHeight: 300 }}>
                                <Empty description={buses.length === 0 ? 'No buses found for this route' : 'No buses match the selected filters'} />
                            </Flex>
                        ) : (
                            <>
                                <Flex vertical gap={8} className="mt-4">
                                    {paginatedBuses.map(bus => (
                                        <BusCard key={bus.id} bus={bus} />
                                    ))}
                                </Flex>
                                <Flex justify="end" className="pt-6 pb-2">
                                    <Pagination
                                        current={currentPage}
                                        pageSize={ITEMS_PER_PAGE}
                                        total={filteredBuses.length}
                                        onChange={page => setCurrentPage(page)}
                                        showSizeChanger={false}
                                    />
                                </Flex>
                            </>
                        )}
                    </Col>
                </Row>
            )}
        </Flex>
    );
}
