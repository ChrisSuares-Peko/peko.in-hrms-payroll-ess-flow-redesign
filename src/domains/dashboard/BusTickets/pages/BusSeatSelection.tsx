import { useEffect, useMemo, useState } from 'react';

import { Col, Flex, Row, Skeleton, Typography } from 'antd';
import { useNavigate, useSearchParams } from 'react-router-dom';

import { useAppDispatch, useAppSelector } from '@src/hooks/store';
import { paths } from '@src/routes/paths';

import BookingSummary from '../components/BookingSummary';
import BusSummaryCard from '../components/reviewBooking/BusSummaryCard';
import SeatMap from '../components/SeatMap';
import BusTabs from '../components/seatSelection/BusTabs';
import useTripDetailsApi from '../hooks/useTripDetailsApi';
import { setSelectedSeatData, setSelectedSeats, setSelectedTripInfo } from '../slices/busTicketSlice';
import { SelectedSeatData, StopPoint } from '../types/buslist';
import { mapTripDetailsToDecks } from '../utils/mapTripDetails';
import { type TabKey } from '../utils/seatSelectionData';

function minsToAmPm(val: string): string {
    const m = parseInt(val, 10);
    if (Number.isNaN(m)) return val;
    const total = m % (24 * 60);
    const h = Math.floor(total / 60);
    const min = total % 60;
    const ampm = h >= 12 ? 'PM' : 'AM';
    const h12 = h % 12 || 12;
    return `${String(h12).padStart(2, '0')}:${String(min).padStart(2, '0')} ${ampm}`;
}

export default function BusSeatSelection() {
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    const dispatch = useAppDispatch();

    const storedSeats = useAppSelector(state => state.reducer.busTicket.selectedSeats);
    const storedSeatData = useAppSelector(state => state.reducer.busTicket.selectedSeatData);
    const storedTripInfo = useAppSelector(state => state.reducer.busTicket.selectedTripInfo);
    const searchData = useAppSelector(state => state.reducer.busTicket.searchData);

    const urlBusId = searchParams.get('busId') || '';
    const isSameTrip = !!storedTripInfo?.busId && (urlBusId === storedTripInfo.busId || !urlBusId);

    const busId = urlBusId || (isSameTrip ? storedTripInfo?.busId : '') || '';
    const operator = searchParams.get('operator') || (isSameTrip ? storedTripInfo?.operator : '') || '';
    const type = searchParams.get('type') || (isSameTrip ? storedTripInfo?.busType : '') || '';
    const from = searchParams.get('from') || (isSameTrip ? storedTripInfo?.from : '') || '';
    const to = searchParams.get('to') || (isSameTrip ? storedTripInfo?.to : '') || '';
    const departTime = searchParams.get('departTime') || (isSameTrip ? storedTripInfo?.departTime : '') || '';
    const arrivalTime = searchParams.get('arrivalTime') || (isSameTrip ? storedTripInfo?.arrivalTime : '') || '';
    const duration = searchParams.get('duration') || (isSameTrip ? storedTripInfo?.duration : '') || '';
    const date = searchParams.get('date') || (isSameTrip ? storedTripInfo?.departDate : '') || '';
    const isRtc = searchParams.get('bpDpSeatLayout') === 'true';

    const [selectedSeatInfo, setSelectedSeatInfo] = useState<Record<string, SelectedSeatData>>(() => {
        if (!isSameTrip) return {};
        const result: Record<string, SelectedSeatData> = {};
        storedSeats.forEach((id, i) => { if (storedSeatData[i]) result[id] = storedSeatData[i]; });
        return result;
    });
    const [activeTab, setActiveTab] = useState<TabKey>('boarding');
    const [selectedBoardingId, setSelectedBoardingId] = useState<string>(isSameTrip ? (storedTripInfo?.boardingPointId ?? '') : '');
    const [selectedDropId, setSelectedDropId] = useState<string>(isSameTrip ? (storedTripInfo?.droppingPointId ?? '') : '');

    const rtcReady = isRtc && !!selectedBoardingId && !!selectedDropId;
    const rawTrip = useMemo(
        () => searchData?.availableTrips.find(t => String(t.id) === busId),
        [searchData, busId],
    );

    const { tripDetails, isLoading: tripLoading } = useTripDetailsApi(busId, {
        bpId: isRtc ? selectedBoardingId : undefined,
        dpId: isRtc ? selectedDropId : undefined,
        skip: isRtc && !rtcReady,
    });

    const { lowerDeck, upperDeck } = useMemo(() => {
        if (!tripDetails) return { lowerDeck: undefined, upperDeck: undefined };
        const { lower, upper } = mapTripDetailsToDecks(tripDetails);
        return { lowerDeck: lower, upperDeck: upper };
    }, [tripDetails]);

    const amenities = useMemo(() => {
        if (!rawTrip?.amenities) return [];
        return rawTrip.amenities.split(',').map(a => a.trim()).filter(Boolean);
    }, [rawTrip]);

    const boardingPoints: StopPoint[] = useMemo(() => {
        if (!rawTrip?.boardingTimes) return [];
        const pts = Array.isArray(rawTrip.boardingTimes) ? rawTrip.boardingTimes : [rawTrip.boardingTimes];
        return pts.map(p => ({ id: p.bpId, name: p.bpName, time: minsToAmPm(p.time), date, address: p.address, landmark: p.landmark }));
    }, [rawTrip, date]);

    const dropPoints: StopPoint[] = useMemo(() => {
        if (!rawTrip?.droppingTimes) return [];
        const pts = Array.isArray(rawTrip.droppingTimes) ? rawTrip.droppingTimes : [rawTrip.droppingTimes];
        return pts.map(p => ({ id: p.bpId, name: p.bpName, time: minsToAmPm(p.time), date, address: p.address, landmark: p.landmark }));
    }, [rawTrip, date]);

    useEffect(() => {
        if (!isSameTrip) {
            dispatch(setSelectedSeats([]));
            dispatch(setSelectedSeatData([]));
        }
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    useEffect(() => {
        if (boardingPoints.length && !selectedBoardingId) setSelectedBoardingId(boardingPoints[0].id);
    }, [boardingPoints, selectedBoardingId]);

    useEffect(() => {
        if (dropPoints.length && !selectedDropId) setSelectedDropId(dropPoints[0].id);
    }, [dropPoints, selectedDropId]);

    const selectedSeats = Object.keys(selectedSeatInfo);
    const totalAmount = Object.values(selectedSeatInfo).reduce((sum, s) => sum + s.fare, 0);
    const boardingPoint = boardingPoints.find(b => b.id === selectedBoardingId);
    const dropPoint = dropPoints.find(d => d.id === selectedDropId);

    const handleSeatToggle = (seatId: string, price: number, seatName: string, ladiesSeat: boolean) => {
        setSelectedSeatInfo(prev => {
            if (prev[seatId] !== undefined) {
                const next = { ...prev };
                delete next[seatId];
                return next;
            }
            return { ...prev, [seatId]: { seatName, fare: price, ladiesSeat } };
        });
    };

    return (
        <Flex vertical style={{ minHeight: '100vh', padding: '20px 16px' }}>
            <Row gutter={[16, 16]} align="stretch">

                <Col xs={24} lg={18}>
                    <Flex vertical gap={16} style={{ height: '100%' }}>
                        <BusSummaryCard
                            operator={operator}
                            busType={type}
                            departStop={from}
                            departTime={departTime}
                            departDate={date}
                            arrivalStop={to}
                            arrivalTime={arrivalTime}
                            arrivalDate={rawTrip?.nextDay === 'true' ? '(next day)' : date}
                            duration={duration}
                            rating={parseFloat(String(rawTrip?.rating ?? '0')) || 0}
                            ratingCount={parseInt(String(rawTrip?.total_rating_count ?? '0'), 10)}
                        />

                        <Flex gap={16} align="flex-start" style={{ flex: 1, flexWrap: 'wrap' }}>
                            <div style={{ flexShrink: 0, maxWidth: '100%' }}>
                                {(() => {
                                    if (tripLoading) {
                                        return (
                                            <Flex gap={16} style={{ background: 'white', borderRadius: 12, padding: '16px 12px', boxShadow: '0 1px 6px rgba(0,0,0,0.06)' }}>
                                                {[0, 1].map(deck => (
                                                    <Flex key={deck} vertical gap={6}>
                                                        {[...Array(5)].map((_, row) => (
                                                            <Flex key={row} gap={6} align="center">
                                                                <Skeleton.Avatar active shape="square" style={{ width: 44, height: 44, borderRadius: 8 }} />
                                                                {deck === 0 && <div style={{ width: 10 }} />}
                                                                <Skeleton.Avatar active shape="square" style={{ width: 44, height: 44, borderRadius: 8 }} />
                                                                <Skeleton.Avatar active shape="square" style={{ width: 44, height: 44, borderRadius: 8 }} />
                                                                {deck === 1 && <div style={{ width: 10 }} />}
                                                            </Flex>
                                                        ))}
                                                    </Flex>
                                                ))}
                                            </Flex>
                                        );
                                    }
                                    if (isRtc && !rtcReady) {
                                        return (
                                            <Flex vertical align="center" justify="center" gap={8}
                                                style={{ background: 'white', borderRadius: 12, padding: '40px 20px', boxShadow: '0 1px 6px rgba(0,0,0,0.06)', minHeight: 200, minWidth: 200 }}
                                            >
                                                <Typography.Text style={{ fontSize: 14, color: '#8c8c8c', textAlign: 'center' }}>
                                                    Please select a boarding point and drop point to view available seats.
                                                </Typography.Text>
                                            </Flex>
                                        );
                                    }
                                    return (
                                        <SeatMap
                                            selectedSeats={selectedSeats}
                                            onSeatToggle={handleSeatToggle}
                                            lowerDeck={lowerDeck}
                                            upperDeck={upperDeck}
                                        />
                                    );
                                })()}
                            </div>

                            <div style={{ flex: 1, minWidth: 220 }}>
                                <BusTabs
                                    activeTab={activeTab}
                                    onTabChange={setActiveTab}
                                    boardingPoints={boardingPoints}
                                    selectedBoardingId={selectedBoardingId}
                                    onBoardingSelect={setSelectedBoardingId}
                                    dropPoints={dropPoints}
                                    selectedDropId={selectedDropId}
                                    onDropSelect={setSelectedDropId}
                                    amenities={amenities}
                                    rating={rawTrip?.rating}
                                    ratingsBreakUp={rawTrip?.ratingsBreakUp}
                                    totalRatingCount={rawTrip?.total_rating_count}
                                    cancellationPolicy={rawTrip?.cancellationPolicy}
                                    imagesMetadataUrl={rawTrip?.imagesMetadataUrl}
                                    busImageCount={rawTrip?.busImageCount}
                                />
                            </div>
                        </Flex>
                    </Flex>
                </Col>

                <Col xs={24} lg={6}>
                    <BookingSummary
                        totalAmount={totalAmount}
                        selectedSeats={selectedSeats}
                        boardingPoint={boardingPoint}
                        dropPoint={dropPoint}
                        onProceed={() => {
                            dispatch(setSelectedSeats(selectedSeats));
                            dispatch(setSelectedSeatData(Object.values(selectedSeatInfo)));
                            dispatch(setSelectedTripInfo({
                                operator,
                                busType: type,
                                from,
                                to,
                                departTime,
                                arrivalTime,
                                departDate: date,
                                arrivalDate: rawTrip?.nextDay === 'true' ? '(next day)' : date,
                                duration,
                                departStop: boardingPoint?.name ?? '',
                                arrivalStop: dropPoint?.name ?? '',
                                busId,
                                boardingPointId: selectedBoardingId,
                                droppingPointId: selectedDropId,
                                cancellationPolicy: rawTrip?.cancellationPolicy ?? '',
                                rating: parseFloat(String(rawTrip?.rating ?? '0')) || 0,
                                ratingCount: parseInt(String(rawTrip?.total_rating_count ?? '0'), 10),
                            }));
                            navigate(`${paths.dashboard.corporateTravel}/${paths.bus.index}/${paths.bus.results}/${paths.bus.seatSelection}/${paths.bus.traveller}`);
                        }}
                    />
                </Col>

            </Row>
        </Flex>
    );
}
