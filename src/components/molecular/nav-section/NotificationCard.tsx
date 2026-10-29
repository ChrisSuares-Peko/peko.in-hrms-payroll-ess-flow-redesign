import { Flex, Typography, theme } from 'antd';
import dayjs from 'dayjs';
import calendar from 'dayjs/plugin/calendar';

dayjs.extend(calendar);

interface NotificationCardProps {
    notificationTitle: string;
    notification: string;
    date: string;
    onClick?: () => void;
}

const { Text } = Typography;

const NotificationCard = ({ notificationTitle, notification, date, onClick }: NotificationCardProps) => {
    const {
        token: { colorTextTertiary },
    } = theme.useToken();
    const formattedDate = dayjs(date);

    const parseNotification = (text: string) => {
        const txnIdRegex = /(transaction ID[:\s]*)(\d+)/gi;
        // Regex to match "₹<amount>" (e.g., ₹100, ₹100.5, ₹100.50)
        const amountRegex = /₹\s?\d[\d,]*(?:\.\d+)?/g;
        const appIdRegex = /\bINC\/\d{4}\/\d+\b/g;
        text = text.replace(txnIdRegex, (_, label, number) => `${label}<strong>${number}</strong>`);
        text = text.replace(appIdRegex, match => `<strong>${match}</strong>`);

        const parts = text.split(amountRegex);
        const matches = text.match(amountRegex) || [];

        const formatAmount = (raw: string) => {
            const num = parseFloat(raw.replace(/[₹,\s]/g, ''));
            // eslint-disable-next-line no-restricted-globals
            if (isNaN(num)) return raw;
            return `₹${num.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
        };

        return parts.reduce(
            (acc, part, index) => {
                // eslint-disable-next-line react/no-danger
                acc.push(<span key={`part-${index}`} dangerouslySetInnerHTML={{ __html: part }} />);
                if (matches[index]) {
                    acc.push(<strong key={index}>{formatAmount(matches[index])}</strong>);
                }
                return acc;
            },
            [] as (string | JSX.Element)[]
        );
    };

    return (
        <Flex
            className={`px-4 py-4 border-b${onClick ? ' cursor-pointer hover:bg-gray-50' : ''}`}
            onClick={onClick}
        >
            <Flex vertical gap={10}>
                <Text className="max-w-[24rem] text-base font-medium text-black">
                    {notificationTitle}
                </Text>
                <Text className="max-w-[24rem] text-sm text-gray-700">
                    {parseNotification(notification)}
                </Text>
                <Text style={{ color: colorTextTertiary }} className="text-xs">
                    {formattedDate.calendar(null, {
                        sameDay: '[Today at] h:mm A', // Today at 10:30 AM
                        nextDay: '[Tomorrow at] h:mm A', // Tomorrow at 10:30 AM
                        nextWeek: 'dddd [at] h:mm A', // Next Tuesday at 10:30 AM
                        lastDay: '[Yesterday at] h:mm A', // Yesterday at 10:30 AM
                        lastWeek: '[Last] dddd [at] h:mm A', // Last Monday at 10:30 AM
                        sameElse: 'DD MMM [at] h:mm A', // Everything else ( 07/10/2011 )
                    })}
                </Text>
            </Flex>
        </Flex>
    );
};

export default NotificationCard;
