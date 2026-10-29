import { createRef, useRef, useState, useEffect } from 'react';

import { Col, Flex, Grid, Row, Spin, Typography, Skeleton, theme } from 'antd';
import Lottie from 'react-lottie';

import { useAppSelector, useAppDispatch } from '@src/hooks/store';

import AdaptiveAirlineDetail from './AdaptiveAirlineDetail';
import AirlineDetailBody from '../components/AirlineDetailBody';
import FairRulesModal from '../components/FareRulesModal';
import PriceCard from '../components/PriceCard';
import { useGetFareRules } from '../hooks/useGetFareRules';
import { resetSelectedAncillaries } from '../slices/airlineSlice';
import { AirlineSearchAnimation } from '../utils/lottie';

const { useBreakpoint } = Grid;

const AirlineDetail = () => {
    const dispatch = useAppDispatch();
    const screens = useBreakpoint();
    const {
        token: { colorPrimary },
    } = theme.useToken();
    const airlineForm = useAppSelector(state => state.reducer.airline.formData);
    const { adultCount, childCount, infantCount } = airlineForm.passengerData;
    const { fareRules, fareQuotes, isLoading } = useGetFareRules();
    const [isLcc, setIsLcc] = useState<boolean>(false);
    const [showSpinner, setShowSpinner] = useState<boolean>(false);
    const passengerCount = adultCount + childCount + infantCount;
    const formRef = useRef(Array.from({ length: passengerCount }, () => createRef()));
    const formDomRef = useRef(Array.from({ length: passengerCount }, () => createRef())); // used to scroll if error in passenger form
    const formRef1 = useRef(null);
    const formRef2 = useRef(null);
    const contanctFormRef = useRef(null);

    const [open, setOpen] = useState<boolean>(false);

    useEffect(() => {
        dispatch(resetSelectedAncillaries());
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const [passengerIsValid, setPassengerIsValid] = useState<boolean[]>(
        Array(passengerCount).fill(false)
    );

    const renderComponent = () => {
        if (screens.md || screens.lg || screens.xl) {
            return (
                <Spin
                    className="mt-40 pointer-events-none"
                    // indicator={<Lottie options={defaultOptions} height={80} width={600} />}
                    indicator={<Lottie options={AirlineSearchAnimation} height={300} width={600} />}
                    spinning={showSpinner}
                >
                    <Flex vertical>
                        <Flex justify="space-between">
                            <Typography.Paragraph className="text-xl font-medium leading-7">
                                Review your itinerary
                            </Typography.Paragraph>
                            {!isLoading && (
                                <Typography.Paragraph
                                    className="text-md xl:ml-5 ml-0 font-medium mt-3 cursor-pointer"
                                    style={{ color: colorPrimary }}
                                    onClick={() => setOpen(true)}
                                >
                                    Fare Rules and Baggage
                                </Typography.Paragraph>
                            )}
                        </Flex>
                        {isLoading || !fareQuotes ? (
                            <Flex justify="center">
                                <Spin
                                    className="mt-20 pointer-events-none"
                                    indicator={
                                        <Lottie
                                            options={AirlineSearchAnimation}
                                            height={300}
                                            width={600}
                                        />
                                    }
                                    spinning
                                />
                            </Flex>
                        ) : (
                            <Row className="gap-5 justify-between relative mt-6">
                                <AirlineDetailBody
                                    setPassengerIsValid={setPassengerIsValid}
                                    isLcc={isLcc}
                                    formRef={formRef}
                                    formDomRef={formDomRef}
                                    formRef1={formRef1}
                                    formRef2={formRef2}
                                    contanctFormRef={contanctFormRef}
                                    fareQuotes={fareQuotes}
                                    setShowSpinner={setShowSpinner}
                                    showSpinner={showSpinner}
                                />
                                <PriceCard
                                    setIsLcc={setIsLcc}
                                    isLcc={isLcc}
                                    formRef={formRef}
                                    formDomRef={formDomRef}
                                    formRef1={formRef1}
                                    formRef2={formRef2}
                                    contanctFormRef={contanctFormRef}
                                    fareQuotes={fareQuotes}
                                    passengerIsValid={passengerIsValid}
                                    setShowSpinner={setShowSpinner}
                                />
                            </Row>
                        )}
                    </Flex>
                </Spin>
            );
        }
        if (screens.xs || screens.sm) {
            return (
                <AdaptiveAirlineDetail
                    openFareRules={() => setOpen(true)}
                    fareQuotes={fareQuotes}
                />
            );
        }
        return <Skeleton />;
    };

    return (
        <Row>
            <Col span={24}>{renderComponent()}</Col>
            {!isLoading && open && fareRules && (
                <FairRulesModal
                    handleCancel={() => setOpen(false)}
                    open={open}
                    fareRulesData={fareRules}
                    fareQuotes={fareQuotes}
                />
            )}
        </Row>
    );
};

export default AirlineDetail;
