/* eslint-disable react/prop-types */
import { ClockCircleOutlined } from '@ant-design/icons';
import { Flex, Typography } from 'antd';

const { Text } = Typography;

interface ExpirationTimerProps {
    timeRemaining: number;
    isExpired: boolean;
    isPaymentExpired: boolean;
    isLcc: boolean;
    bookingCompletedAt: string | null;
    formatTime: (seconds: number) => string;
}

const ExpirationTimer: React.FC<ExpirationTimerProps> = ({
    timeRemaining,
    isExpired,
    isPaymentExpired,
    formatTime,
    isLcc,
    bookingCompletedAt,
}) => {
    // Don't show if expired
    if (isExpired || isPaymentExpired) {
        return null;
    }

    const getTimerText = () => {
        if (isLcc) {
            return 'Complete payment in';
        }
        if (!bookingCompletedAt) {
            return 'Complete booking in';
        }
        return 'Complete payment in';
    };

    return (
        <Flex
            align="center"
            gap={8}
            className="p-3 sm:p-2 bg-gray-100 rounded-lg"
            style={{ flexShrink: 0 }}
        >
            <ClockCircleOutlined className="text-gray-600 text-md" />
            <Text className="text-xs text-gray-600">{getTimerText()}</Text>
            <Text className="text-lg sm:text-md font-medium text-black">
                {formatTime(timeRemaining)}
            </Text>
        </Flex>
    );
};

export default ExpirationTimer;
