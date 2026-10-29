import { Col, Collapse, Divider, Row, Skeleton, Typography, theme } from 'antd';

import { useAppSelector } from '@src/hooks/store';
import { formatNumberWithLocalString } from '@utils/priceFormat';

import { AllFareQuote } from '../../types/fareRules';

type AccFare = {
    meal: number;
    baggage: number;
    seat: number;
    openFareRules?: () => void;
};

const PriceCardMobile = ({
    fareQuotes,
    accFare,
    openFareRules,
}: {
    fareQuotes: AllFareQuote;
    accFare?: AccFare;
    openFareRules?: () => void;
}) => {
    const {
        token: { colorPrimary },
    } = theme.useToken();
    const airlineData = useAppSelector(state => state.reducer.airline.selectedAirline);
    const airlineFormData = useAppSelector(state => state.reducer.airline.formData);

    const totalGuests =
        airlineFormData.passengerData.adultCount +
        airlineFormData.passengerData.childCount +
        airlineFormData.passengerData.infantCount;

    if (!fareQuotes) {
        return <Skeleton active paragraph={{ rows: 6 }} className="!w-full" />;
    }

    const priceWithoutTax = Number(fareQuotes.combined.Fare.BaseFare);
    let totalFare = fareQuotes.combined.Fare.PublishedFare;
    if (accFare) {
        totalFare += (accFare.meal || 0) + (accFare.baggage || 0) + (accFare.seat || 0);
    }

    return (
        <Row>
            <Col span={24}>
                <Typography.Paragraph className="font-semibold text-base leading-9">
                    Fare Details
                </Typography.Paragraph>
            </Col>
            <Col span={24} className="flex justify-between mt-2">
                <Typography.Text className="font-normal text-sm leading-8">
                    {`Base fare (${totalGuests} traveller)`}
                </Typography.Text>
                <Typography.Text className="font-normal text-sm leading-8">
                    ₹ {formatNumberWithLocalString(priceWithoutTax)}
                </Typography.Text>
            </Col>
            {accFare?.seat ? (
                <Col span={24} className="flex justify-between">
                    <Typography.Text className="font-normal text-sm leading-8">
                        Seat
                    </Typography.Text>
                    <Typography.Text className="font-normal text-sm leading-8">
                        ₹ {formatNumberWithLocalString(accFare?.seat)}
                    </Typography.Text>
                </Col>
            ) : (
                ''
            )}
            {accFare?.meal ? (
                <Col span={24} className="flex justify-between">
                    <Typography.Text className="font-normal text-sm leading-8">
                        Meal
                    </Typography.Text>
                    <Typography.Text className="font-normal text-sm leading-8">
                        ₹ {formatNumberWithLocalString(accFare?.meal)}
                    </Typography.Text>
                </Col>
            ) : (
                ''
            )}
            {accFare?.baggage ? (
                <Col span={24} className="flex justify-between mt-2">
                    <Typography.Text className="font-normal text-sm leading-8">
                        Baggage
                    </Typography.Text>
                    <Typography.Text className="font-normal text-sm leading-8">
                        ₹ {formatNumberWithLocalString(accFare?.baggage)}
                    </Typography.Text>
                </Col>
            ) : (
                ''
            )}

            <Col span={24} className="flex justify-between">
                <Typography.Text className="font-normal text-sm leading-8">
                    {`Taxes and fees`}{' '}
                </Typography.Text>
                <Typography.Text className="font-normal text-sm leading-8">
                    ₹ {formatNumberWithLocalString(fareQuotes.combined.Fare.Tax)}
                </Typography.Text>
            </Col>

            <Col span={24} className="flex justify-between">
                <Typography.Text className="font-normal text-sm leading-8">
                    {`Other charges`}{' '}
                </Typography.Text>
                <Typography.Text className="font-normal text-sm leading-8">
                    ₹ {formatNumberWithLocalString(fareQuotes.combined.Fare.OtherCharges)}
                </Typography.Text>
            </Col>

            <Divider className="border-t-2 my-2 mx-0" />
            <Col span={12}>
                <Typography.Paragraph className="font-medium text-sm leading-9">
                    Total Price
                </Typography.Paragraph>
            </Col>
            <Col span={12} className="flex justify-end items-center">
                <Typography.Text className="font-semibold text-lg leading-9">
                    ₹ {formatNumberWithLocalString(totalFare)}
                </Typography.Text>
            </Col>
            <Divider className="border-t-2 my-2 mx-0" />
            <Col span={24}>
                <Typography.Paragraph
                    onClick={openFareRules}
                    className="font-semibold leading-9 cursor-pointer"
                    style={{ color: colorPrimary }}
                >
                    Fare Rules and Baggage
                </Typography.Paragraph>
            </Col>
            <Divider className="border-t-2 my-2 mx-0" />
            <Col span={24} className="flex justify-between">
                <Typography.Text className="font-normal text-base leading-9">
                    {`${airlineData.offPoint} - ${airlineData.onPoint}`}
                </Typography.Text>
                {fareQuotes.combined.IsRefundable && (
                    <Typography.Text className="font-normal text-sm leading-9">
                        <Typography.Text className="text-primaryOrange">
                            Partially Refundable
                        </Typography.Text>
                    </Typography.Text>
                )}
            </Col>
            <Divider className="border-t-2 my-2 mx-0" />
            <Col span={24}>
                <Collapse
                    size="small"
                    expandIconPosition="end"
                    className="w-full border-none bg-transparent"
                    style={{ padding: 0 }}
                >
                    {/* <Collapse.Panel
                        key="1"
                        style={{ borderBottom: 0 }}
                        header={<p className="text-sm m-0">Cancellation And Date Change Policy</p>}
                    >
                        cancellation policy here....
                    </Collapse.Panel> */}
                </Collapse>
            </Col>
            {/* <Divider className="border-t-2 my-2 mx-0" /> */}
        </Row>
    );
};

export default PriceCardMobile;
