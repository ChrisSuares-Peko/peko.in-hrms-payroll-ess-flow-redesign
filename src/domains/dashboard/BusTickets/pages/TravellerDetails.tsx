import { useRef } from 'react';

import { Col, Flex, Row, Typography } from 'antd';
import { useNavigate } from 'react-router-dom';

import { useAppDispatch, useAppSelector } from '@src/hooks/store';
import { paths } from '@src/routes/paths';
import { showToast } from '@src/slices/apiSlice';


import BusSummaryCard from '../components/reviewBooking/BusSummaryCard';
import ContactDetails from '../components/travellerDetails/ContactDetails';
import GSTDetails from '../components/travellerDetails/GSTDetails';
import ProceedSidebar from '../components/travellerDetails/ProceedSidebar';
import TravellerCard from '../components/travellerDetails/TravellerCard';
import useBlockTicketApi from '../hooks/useBlockTicketApi';
import { setBlockData, setContactDetails, setPassengers, setSelectedSeatData, setSelectedSeats, setTravellerForms } from '../slices/busTicketSlice';
import { InventoryItem } from '../types/buslist';

export default function TravellerDetails() {
    const navigate = useNavigate();
    const dispatch = useAppDispatch();
    const { block, isLoading: blocking } = useBlockTicketApi();

    const selectedSeatNames = useAppSelector(state => state.reducer.busTicket.selectedSeats);
    const seatData          = useAppSelector(state => state.reducer.busTicket.selectedSeatData);
    const tripInfo          = useAppSelector(state => state.reducer.busTicket.selectedTripInfo);
    const savedForms        = useAppSelector(state => state.reducer.busTicket.travellerForms) ?? [];
    const blockKey          = useAppSelector(state => state.reducer.busTicket.blockKey);
    const blockTime         = useAppSelector(state => state.reducer.busTicket.blockTime);
    const blockInitiatedAt  = useAppSelector(state => state.reducer.busTicket.blockInitiatedAt);

    const from     = tripInfo?.from ?? '';
    const to       = tripInfo?.to ?? '';
    const date     = tripInfo?.departDate ?? '';
    const operator = tripInfo?.operator ?? '';
    const busType  = tripInfo?.busType ?? '';

    const seats = selectedSeatNames.length
        ? selectedSeatNames.map((seatNumber, i) => ({ seatNumber, passengerNumber: i + 1 }))
        : [{ seatNumber: 'U9', passengerNumber: 1 }];

    const travellerRefs = useRef(seats.map(() => ({ current: null as any })));
    const contactRef = useRef<any>(null);
    const gstRef = useRef<any>(null);

    const handleProceed = async () => {
        const allRefs = [
            ...travellerRefs.current,
            { current: contactRef.current },
            ...(gstRef.current ? [{ current: gstRef.current }] : []),
        ];

        const errorsArray = await Promise.all(allRefs.map(ref => ref.current?.validateForm?.()));
        await Promise.all(allRefs.map(ref => ref.current?.submitForm?.()));

        const allValid = errorsArray.every(e => !e || Object.keys(e).length === 0);
        if (!allValid) return;

        const idPairs = travellerRefs.current.map(ref => {
            const v = ref.current?.values ?? {};
            return `${v.idType}::${v.idNumber}`.toLowerCase();
        });
        const hasDuplicate = idPairs.some((pair, i) => idPairs.indexOf(pair) !== i);
        if (hasDuplicate) {
            dispatch(showToast({ variant: 'error', description: 'Two or more passengers cannot have the same ID type and ID number.' }));
            return;
        }

        const inventoryItems: InventoryItem[] = travellerRefs.current.map((ref, i) => {
            const v = ref.current?.values ?? {};
            const seat = seatData[i] ?? { seatName: seats[i]?.seatNumber ?? '', fare: 0, ladiesSeat: false };
            const dob = v.dob ?? '';
            const age = dob
                ? Math.floor((Date.now() - new Date(dob).getTime()) / (365.25 * 24 * 60 * 60 * 1000))
                : 0;
            return {
                seatName: seat.seatName,
                fare: seat.fare,
                ladiesSeat: seat.ladiesSeat ? 'true' : 'false',
                passenger: {
                    name: `${v.firstName ?? ''} ${v.lastName ?? ''}`.trim(),
                    age,
                    mobile: Number(v.phone ?? 0),
                    title: v.gender === 'female' ? 'Ms' : 'Mr',
                    email: v.email ?? '',
                    gender: v.gender === 'female' ? 'FEMALE' : 'MALE',
                    idType: v.idType ?? '',
                    idNumber: v.idNumber ?? '',
                    address: v.address ?? '',
                    primary: i === 0 ? 'true' : 'false',
                },
            };
        });

        dispatch(setTravellerForms(travellerRefs.current.map(ref => {
            const v = ref.current?.values ?? {};
            return {
                firstName: v.firstName ?? '',
                lastName: v.lastName ?? '',
                dob: v.dob ?? '',
                gender: v.gender ?? 'male',
                countryCode: v.countryCode ?? '+91',
                phone: v.phone ?? '',
                email: v.email ?? '',
                idType: v.idType ?? '',
                idNumber: v.idNumber ?? '',
                address: v.address ?? '',
                employee: v.employee ?? '',
            };
        })));

        dispatch(setPassengers(inventoryItems.map((item, i) => ({
            id: i + 1,
            name: item.passenger.name,
            email: item.passenger.email,
            idType: item.passenger.idType,
            idNumber: item.passenger.idNumber,
            seat: item.seatName,
            ticketNumber: '',
        }))));

        const contactValues = contactRef.current?.values ?? {};
        const contactPhone = contactValues.phone ?? '';
        const contactEmail = contactValues.email ?? '';

        dispatch(setContactDetails({ contactPhone, contactEmail }));

        if (blockKey && blockInitiatedAt) {
            const expiresAt = new Date(blockInitiatedAt).getTime() + blockTime * 1000;
            if (expiresAt > Date.now()) {
                navigate(`${paths.dashboard.corporateTravel}/${paths.bus.index}/${paths.bus.results}/${paths.bus.seatSelection}/${paths.bus.traveller}/${paths.bus.review}`);
                return;
            }
        }

        const { data: result, error, responseCode } = await block(inventoryItems);
        if (error) {
            dispatch(showToast({ variant: 'error', description: error }));
            if (responseCode === '001') {
                dispatch(setSelectedSeats([]));
                dispatch(setSelectedSeatData([]));
                navigate(-1);
            }
            return;
        }
        if (!result) return;

        dispatch(setBlockData({
            blockKey: result.blockKey ?? '',
            blockTime: (result.blockTime ?? 8) * 60,
        }));

        navigate(`${paths.dashboard.corporateTravel}/${paths.bus.index}/${paths.bus.results}/${paths.bus.seatSelection}/${paths.bus.traveller}/${paths.bus.review}`);
    };

    return (
        <Flex vertical gap={20} style={{ padding: '0 0 40px' }}>
            <Row gutter={20} align="top">
                {/* Left: trip card + traveller forms */}
                <Col xs={24} md={15}>
                    <Flex vertical gap={20}>
                        <BusSummaryCard
                            operator={operator}
                            busType={busType}
                            departStop={from}
                            departTime={tripInfo?.departTime}
                            departDate={date}
                            arrivalStop={to}
                            arrivalTime={tripInfo?.arrivalTime}
                            arrivalDate={tripInfo?.arrivalDate}
                            duration={tripInfo?.duration}
                            rating={tripInfo?.rating}
                            ratingCount={tripInfo?.ratingCount}
                        />

                        <Typography.Text style={{ fontSize: 20, fontWeight: 500, color: '#1A1A1A' }}>
                            Traveller Details
                        </Typography.Text>

                        {seats.map((seat, i) => (
                            <TravellerCard
                                key={seat.seatNumber}
                                seatNumber={seat.seatNumber}
                                passengerNumber={seat.passengerNumber}
                                formRef={travellerRefs.current[i]}
                                savedValues={savedForms[i]}
                                onUseSameContact={i === 0 ? (phone, email) => {
                                    contactRef.current?.setFieldValue('phone', phone);
                                    contactRef.current?.setFieldValue('email', email);
                                    contactRef.current?.setFieldTouched('phone', false);
                                    contactRef.current?.setFieldTouched('email', false);
                                } : undefined}
                            />
                        ))}
                    </Flex>
                </Col>

                {/* Right: contact + GST + proceed — top-aligned with trip card */}
                <Col xs={24} md={9}>
                    <Flex vertical gap={20}>
                        <Typography.Text style={{ fontSize: 20, fontWeight: 500, color: '#1A1A1A' }}>
                            Contact Details
                        </Typography.Text>
                        <ContactDetails formRef={contactRef} />
                        <GSTDetails formRef={gstRef} />
                        <ProceedSidebar onProceed={handleProceed} loading={blocking} />
                    </Flex>
                </Col>
            </Row>
        </Flex>
    );
}
