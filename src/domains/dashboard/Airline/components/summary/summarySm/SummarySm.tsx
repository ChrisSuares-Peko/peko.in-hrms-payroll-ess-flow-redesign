/* eslint-disable react/prop-types */
import { Button, Flex, Typography } from 'antd';

import DetailsBodySm from './DetailsBodySm';
import { SelectedAirline } from '../../../types/slices';
import ExpirationTimer from '../ExpirationTimer';
import PassengerDetailsSm from '../passengerDetails/PassengerDetailsSm';

interface SummarySmProps {
    selectedAirline: SelectedAirline;
    selectedInbountAirline: SelectedAirline;
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

const { Text } = Typography;

const SummarySm: React.FC<SummarySmProps> = ({
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
        <Flex vertical gap={20}>
            <Text className="text-base font-semibold">Your Booking Summary</Text>
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
            <DetailsBodySm
                selectedAirline={selectedAirline}
                selectedInbountAirline={selectedInbountAirline}
            />
            <Text className="text-[16px] font-semibold">Passenger Details</Text>

            <PassengerDetailsSm passengers={passengers} />
            <Flex justify="start" className="mt-3">
                <Button
                    danger
                    type="primary"
                    className="h-10 px-12 font-medium w-full"
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

export default SummarySm;
