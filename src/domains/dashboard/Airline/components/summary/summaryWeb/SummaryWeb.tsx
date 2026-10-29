/* eslint-disable react/prop-types */
import { Button, Flex, Typography } from 'antd';

import DetailsBody from './DetailsBody';
import ExpirationTimer from '../ExpirationTimer';
import PassengerDetails from '../passengerDetails';

interface SummaryWebProps {
    selectedAirline: any;
    selectedInbountAirline: any;
    paymentData: any;
    isLoading: boolean;
    handleBookNow: () => void;
    timer?: {
        timeRemaining: number;
        isExpired: boolean;
        isPaymentExpired: boolean;
        bookingCompletedAt: string | null;
        formatTime: (seconds: number) => string;
    };
    isLcc?: boolean;
}

const SummaryWeb: React.FC<SummaryWebProps> = ({
    selectedAirline,
    selectedInbountAirline,
    paymentData,
    isLoading,
    handleBookNow,
    timer,
    isLcc = false,
}) => {
    const passengers = paymentData?.passengerDetails || [];

    return (
        <Flex vertical gap={40}>
            <Flex justify="space-between" align="center" gap={16}>
                <Typography.Text className="text-xl font-medium">
                    Your Booking Summary
                </Typography.Text>
                {timer && (
                    <ExpirationTimer
                        timeRemaining={timer.timeRemaining}
                        isExpired={timer.isExpired}
                        isPaymentExpired={timer.isPaymentExpired}
                        isLcc={isLcc}
                        bookingCompletedAt={timer.bookingCompletedAt}
                        formatTime={timer.formatTime}
                    />
                )}
            </Flex>
            <DetailsBody
                selectedAirline={selectedAirline}
                selectedInbountAirline={selectedInbountAirline}
            />
            <PassengerDetails passengers={passengers} />
            <Flex justify="end">
                <Button
                    danger
                    type="primary"
                    className="h-10 px-12 font-medium"
                    onClick={handleBookNow}
                    loading={isLoading}
                    disabled={timer && (timer.isExpired || timer.isPaymentExpired)}
                >
                    Continue
                </Button>
            </Flex>
        </Flex>
    );
};

export default SummaryWeb;
