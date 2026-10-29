import React, { useState } from 'react';

import { Col, Row, Typography } from 'antd';

import { useAppSelector } from '@src/hooks/store';

import AmenitiesCollapse from './AmenitiesCollapse';
import Ancillaries from './ancillaries/Ancillaries';
import FlightCard from './FlightCard';
import GSTForm from './GSTForm';
import PassengerCard from './PassengerCard';
import ReceiverDetails from './ReceiverDetails';
import useGetCountries from '../hooks/useGetCountries';
import { AllFareQuote } from '../types/fareRules';

type Props = {
    isLcc: boolean;
    formRef: React.MutableRefObject<any>;
    formDomRef: React.MutableRefObject<any>;
    formRef1: React.MutableRefObject<any>;
    formRef2: React.MutableRefObject<any>;
    contanctFormRef: React.MutableRefObject<any>;
    fareQuotes: AllFareQuote;
    showSpinner: boolean;
    setPassengerIsValid: (value: (prevArray: boolean[]) => boolean[]) => void;
    setShowSpinner: (value: boolean) => void;
};

const AirlineDetailBody = ({
    formRef,
    formDomRef,
    formRef1,
    formRef2,
    contanctFormRef,
    isLcc,
    fareQuotes,
    showSpinner,
    setPassengerIsValid,
    setShowSpinner,
}: Props) => {
    const airlineForm = useAppSelector(state => state.reducer.airline.formData);
    const { adultCount, childCount, infantCount } = airlineForm.passengerData;
    const bookingData = useAppSelector(state => state.reducer.airline.bookingData);
    const { Text } = Typography;
    const [sharedContactInfo, setSharedContactInfo] = useState({
        phone: '',
        email: '',
        phoneCode: '',
    });

    const updateSharedContactInfo = (
        data: Partial<{ phone: string; email: string; phoneCode: string }>
    ) => {
        setSharedContactInfo(prev => ({ ...prev, ...data }));
    };

    const { phoneCodes } = useGetCountries();

    const updatePassengerValidity = (index: number) => (value: boolean) => {
        setPassengerIsValid((prevArray: boolean[]) => {
            const newArray = [...prevArray];
            newArray[index] = value;
            return newArray;
        });
    };

    const renderAdultsCard = () =>
        Array.from({ length: adultCount }, (_, index) => (
            <PassengerCard
                formRef={formRef.current[index]}
                formDomRef={formDomRef.current[index]}
                passengerType="adult"
                fareQuotes={fareQuotes}
                phoneCodes={phoneCodes}
                cardTitle={`Adult Passenger ${index + 1}`}
                key={index}
                bookingData={bookingData.passengers}
                setReceiverDetails={updateSharedContactInfo}
                updatePassengerValidity={updatePassengerValidity(index)}
            />
        ));

    const renderChildCard = () =>
        Array.from({ length: childCount }, (_, index) => (
            <PassengerCard
                formRef={formRef.current[adultCount + index]}
                formDomRef={formDomRef.current[adultCount + index]}
                passengerType="child"
                fareQuotes={fareQuotes}
                phoneCodes={phoneCodes}
                cardTitle={`Child Passenger ${index + 1}`}
                key={index}
                bookingData={bookingData.passengers}
                setReceiverDetails={updateSharedContactInfo}
                updatePassengerValidity={updatePassengerValidity(adultCount + index)}
            />
        ));

    const renderInfantCard = () =>
        Array.from({ length: infantCount }, (_, index) => (
            <PassengerCard
                formRef={formRef.current[adultCount + childCount + index]}
                formDomRef={formDomRef.current[adultCount + childCount + index]}
                passengerType="infant"
                fareQuotes={fareQuotes}
                // countryData={countryData}
                phoneCodes={phoneCodes}
                cardTitle={`Infant Passenger ${index + 1}`}
                key={index}
                bookingData={bookingData.passengers}
                setReceiverDetails={updateSharedContactInfo}
                updatePassengerValidity={updatePassengerValidity(adultCount + childCount + index)}
            />
        ));
    return (
        <Col xs={24} xl={16}>
            {(!isLcc || showSpinner) && (
                <>
                    <FlightCard isRefundable={fareQuotes.combined.IsRefundable} />
                    <Row>
                        <Col
                            span={24}
                            className="flex justify-between items-center w-full mt-6 mb-2"
                        >
                            <Text className="text-[1.25rem] font-semibold leading-7 capitalize">
                                {adultCount + childCount + infantCount > 1
                                    ? `Passengers Details`
                                    : `Passenger Details`}{' '}
                            </Text>
                        </Col>
                    </Row>

                    {renderAdultsCard()}
                    {renderChildCard()}
                    {renderInfantCard()}

                    <GSTForm fareQuotes={fareQuotes} formRef2={formRef2} />

                    <ReceiverDetails
                        phoneCodes={phoneCodes}
                        formRef={formRef1}
                        contanctFormRef={contanctFormRef}
                        sharedContactInfo={sharedContactInfo}
                    />
                    <AmenitiesCollapse />
                </>
            )}

            {isLcc && (
                <Ancillaries
                    setShowSpinner={setShowSpinner}
                    fareQuotes={fareQuotes}
                    isSSRLoading={showSpinner}
                />
            )}
        </Col>
    );
};

export default AirlineDetailBody;
