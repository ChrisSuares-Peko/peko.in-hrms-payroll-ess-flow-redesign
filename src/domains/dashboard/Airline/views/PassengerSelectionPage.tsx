import React, { useEffect, useRef, useState } from 'react';

import { EditOutlined, PlusOutlined } from '@ant-design/icons';
import { Button, Col, Divider, Flex, Row, Typography } from 'antd';
import { ReactSVG } from 'react-svg';

import dropdown from '@src/domains/dashboard/Airline/assets/icons/dropdown.svg';
import { useAppDispatch, useAppSelector } from '@src/hooks/store';
import { showToast } from '@src/slices/apiSlice';
import { formatNumberWithLocalString } from '@utils/priceFormat';

import PassengerModal from '../components/adaptive/PassengerModal';
import ContactInfoForm from '../components/ContactInfoForm';
import GSTForm from '../components/GSTForm';
import useBasicInfoApi from '../hooks/useGetBasicInfo';
import useGetCountries from '../hooks/useGetCountries';
import useSurchargeDetails from '../hooks/useSurchargeApi';
import { addPassengersData, setPaymentDetails } from '../slices/airlineSlice';
import { AllFareQuote } from '../types/fareRules';
import { retrieveAirlineName } from '../utils/airlineData';

type Props = {
    handlePrevClick: () => void;
    handleClick: () => void;
    fareQuotes: AllFareQuote;
};
const { Text } = Typography;

const PassengerSelectionPage = ({ handlePrevClick, handleClick, fareQuotes }: Props) => {
    const {
        formData: airlineForm,
        isGSTDetailsValid,
        bookingData,
        selectedAirline: selectedAirlineData,
        TraceId,
    } = useAppSelector(state => state.reducer.airline);
    const { getSurchargeData } = useSurchargeDetails();

    const [openPassengerModal, setOpenPassengerModal] = useState(false);
    const { data } = useBasicInfoApi();

    const [adultpassengerCount, setAdultPassengerCount] = useState(0);
    const [childPassengerCount, setChildPassengerCount] = useState(0);
    const [infantPassengerCount, setInfantPassengerCount] = useState(0);

    const [passengerType, setPassengerType] = useState<'adult' | 'child' | 'infant'>('adult');
    const [cardTitle, setCardTitle] = useState<string>('');
    const [isNewPassenger, setIsNewPassenger] = useState<boolean>(true);
    const [sharedContactInfo, setSharedContactInfo] = useState({
        phone: '',
        email: '',
        phoneCode: '',
    });

    const gstFormRef = useRef(null);
    const dispatch = useAppDispatch();

    const { countryData, phoneCodes } = useGetCountries();

    const addPassengerHandler = (ptcType: string) => {
        if (ptcType === 'adult' && airlineForm.passengerData.adultCount > adultpassengerCount) {
            setPassengerType('adult');
            setCardTitle(`Adult Passenger ${adultpassengerCount + 1}`);
        } else if (
            ptcType === 'child' &&
            airlineForm.passengerData.childCount > childPassengerCount
        ) {
            setPassengerType('child');
            setCardTitle(`Child Passenger ${childPassengerCount + 1}`);
        } else if (
            ptcType === 'infant' &&
            airlineForm.passengerData.infantCount > infantPassengerCount
        ) {
            setPassengerType('infant');
            setCardTitle(`Infant Passenger ${infantPassengerCount + 1}`);
        } else {
            return;
        }
        setOpenPassengerModal(true);
        setIsNewPassenger(true);
    };

    const editPassengerHandler = (item: any) => {
        const { PaxType } = item;
        let passengerType2: 'adult' | 'child' | 'infant';
        if (PaxType === 1) {
            passengerType2 = 'adult';
        } else if (PaxType === 2) {
            passengerType2 = 'child';
        } else if (PaxType === 3) {
            passengerType2 = 'infant';
        } else {
            return;
        }

        setPassengerType(passengerType2);
        setCardTitle(item.passengerId);
        setIsNewPassenger(false);
        setOpenPassengerModal(true);
    };

    const handleFormSubmit = (values: any) => {
        const existingPassengerIndex = bookingData.passengers.findIndex(
            (passenger: any) => passenger.passengerId === values.passengerId
        );

        if (passengerType === 'adult' && existingPassengerIndex === -1) {
            setAdultPassengerCount(adultpassengerCount + 1);
        } else if (passengerType === 'child' && existingPassengerIndex === -1) {
            setChildPassengerCount(childPassengerCount + 1);
        } else if (passengerType === 'infant' && existingPassengerIndex === -1) {
            setInfantPassengerCount(infantPassengerCount + 1);
        }

        setOpenPassengerModal(false);
        dispatch(addPassengersData(values));
    };

    const handleBooking = async () => {
        if (!isGSTDetailsValid) {
            return;
        }
        const { gstDetails } = bookingData;
        const isAnyFieldFilled = Object.values(gstDetails).some(value => !!value);
        const isAllFieldFilled = Object.values(gstDetails).every(value => !!value);
        if (isAnyFieldFilled && !isAllFieldFilled) {
            dispatch(
                showToast({
                    description: 'Please provide complete GST details or leave the field blank.',
                    variant: 'error',
                })
            );
            return;
        }

        const passengerCount =
            airlineForm.passengerData.adultCount +
            airlineForm.passengerData.childCount +
            airlineForm.passengerData.infantCount;

        if (bookingData.passengers.length !== passengerCount) {
            dispatch(
                showToast({
                    description: 'Please add passengers and fill all the required fields.',
                    variant: 'error',
                })
            );
            return;
        }

        const requestBody = {
            ResultIndex: selectedAirlineData.ResultIndex,
            passengers: bookingData.passengers,
            TraceId,
            transactionId: new Date().valueOf(),
            isLcc: selectedAirlineData.lcc,
            amount: selectedAirlineData.price,
        };

        const billSummary = [
            {
                key: 'Service name',
                value: 'Airline',
            },
            {
                key: 'Airline',
                value: retrieveAirlineName(selectedAirlineData.flightCode) ?? ' ',
            },
            {
                key: 'Company',
                value: data?.name ?? ' ',
            },
        ];

        const surchargeData = await getSurchargeData(selectedAirlineData.price);
        const paymentSummary = [
            {
                key: 'Base amount',
                value: `₹ ${formatNumberWithLocalString(selectedAirlineData.price)}`,
            },
            {
                key: 'Platform fee (inclusive of GST)',
                value: `₹ ${formatNumberWithLocalString(surchargeData?.surcharge ?? 0)}`,
            },
        ];
        const platformFee = surchargeData?.surcharge
            ? parseFloat(surchargeData.surcharge)
            : 0;
        const totalAmount = (Number(selectedAirlineData.price) || 0) + platformFee;

        dispatch(
            setPaymentDetails({
                billSummary,
                paymentSummary,
                passengerDetails: requestBody.passengers,
                totalAmount,
                title: 'Bill Summary',
                payload: requestBody,
                url: 'travel/flight/payment',
            })
        );
        handleClick();
    };

    const updateSharedContactInfo = (
        details: Partial<{ phone: string; email: string; phoneCode: string }>
    ) => {
        setSharedContactInfo(prev => ({ ...prev, ...details }));
    };

    useEffect(() => {
        const passengerCount = bookingData.passengers.reduce(
            (acc: { adult: number; child: number; infant: number }, passenger) => {
                if (passenger.PaxType === 1) {
                    acc.adult += 1;
                } else if (passenger.PaxType === 2) {
                    acc.child += 1;
                } else {
                    acc.infant += 1;
                }
                return acc;
            },
            {
                adult: 0,
                child: 0,
                infant: 0,
            }
        );
        setInfantPassengerCount(passengerCount.infant);
        setChildPassengerCount(passengerCount.child);
        setAdultPassengerCount(passengerCount.adult);
    }, [bookingData]);

    return (
        <Row>
            <Col span={4} flex="none">
                <Flex onClick={handlePrevClick}>
                    <ReactSVG src={dropdown} width={20} className="m-auto rotate-90" />
                </Flex>
            </Col>
            <Col span={20} className="flex justify-center">
                <Typography.Text className="text-lg font-semibold">
                    {adultpassengerCount + childPassengerCount + infantPassengerCount > 1
                        ? `Passengers Details`
                        : `Passenger Details`}
                </Typography.Text>
            </Col>
            <Divider className="border-t-2" />
            <Col span={24} className="flex justify-between">
                <Typography.Text className="text-gray-500">
                    {adultpassengerCount + childPassengerCount + infantPassengerCount}/
                    {airlineForm.passengerData.adultCount +
                        airlineForm.passengerData.childCount +
                        airlineForm.passengerData.infantCount}{' '}
                    Selected
                </Typography.Text>
            </Col>
            <Divider className="border-t-2" />
            {bookingData.passengers.map((item: any) => (
                <Col span={24} className="flex justify-between my-2">
                    <Text className="text-base text-gray-500 line-clamp-1">
                        {/* Title (e.g. Mr/Mrs) hidden for now — auto-derived from gender, not collected, so name only. Re-enable when title collection is added. */}
                        {/* {item.Title}. {item.FirstName} {item.LastName} */}
                        {item.FirstName} {item.LastName}
                    </Text>
                    <EditOutlined className="text-2xl" onClick={() => editPassengerHandler(item)} />
                </Col>
            ))}
            <Col span={24} className="">
                <Flex vertical align="baseline">
                    {adultpassengerCount !== airlineForm.passengerData.adultCount && (
                        <Button
                            className="p-0"
                            type="link"
                            onClick={() => addPassengerHandler('adult')}
                            danger
                            icon={<PlusOutlined />}
                        >
                            Add New Adult Passenger
                        </Button>
                    )}
                    {childPassengerCount !== airlineForm.passengerData.childCount && (
                        <Button
                            className="p-0"
                            type="link"
                            onClick={() => addPassengerHandler('child')}
                            danger
                            icon={<PlusOutlined />}
                        >
                            Add New Child Passenger
                        </Button>
                    )}
                    {infantPassengerCount !== airlineForm.passengerData.infantCount && (
                        <Button
                            className="p-0"
                            type="link"
                            onClick={() => addPassengerHandler('infant')}
                            danger
                            icon={<PlusOutlined />}
                        >
                            Add New Infant Passenger
                        </Button>
                    )}
                </Flex>
            </Col>

            {/* {adultpassengerCount + childPassengerCount + infantPassengerCount !==
                airlineForm.passengerData.adultCount +
                    airlineForm.passengerData.childCount +
                    airlineForm.passengerData.infantCount && (
                <Col span={24} className="mt-5">
                    <Button
                        className="p-0"
                        type="link"
                        onClick={() => addPassengerHandler()}
                        danger
                        icon={<PlusOutlined />}
                    >
                        Add New Passengers
                    </Button>
                </Col>
            )} */}

            <Divider className="border-t-2" />
            <GSTForm fareQuotes={fareQuotes} formRef2={gstFormRef} />
            <Col className="mt-5" xs={24} md={14} lg={24}>
                <ContactInfoForm
                    // isLoading={isLoading || ancSearchLoading}
                    fareQuotes={fareQuotes}
                    phoneCodes={phoneCodes}
                    handleBooking={handleBooking}
                    sharedContactInfo={sharedContactInfo}
                />
            </Col>

            {openPassengerModal && (
                <PassengerModal
                    open={openPassengerModal}
                    handleSubmit={handleFormSubmit}
                    cardTitle={cardTitle}
                    passengerType={passengerType}
                    handleCancel={() => setOpenPassengerModal(false)}
                    fareQuotes={fareQuotes}
                    countryData={countryData}
                    phoneCodes={phoneCodes}
                    isNewPassenger={isNewPassenger}
                    setReceiverDetails={updateSharedContactInfo}
                    // data={employees}
                    // generateEmployeesDropdown={generateEmployeesDropdown}
                />
            )}
        </Row>
    );
};

export default PassengerSelectionPage;
