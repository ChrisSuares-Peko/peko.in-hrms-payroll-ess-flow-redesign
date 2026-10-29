import { CheckCircleOutlined } from '@ant-design/icons';
import { Flex, Typography } from 'antd';

interface SignatoryCardProps {
    initials: string;
    name: string;
    email: string;
    date: string;
    status: 'Signed' | 'Pending';
}

const SignatoryCard = ({ initials, name, email, date, status }: SignatoryCardProps) => (
    <Flex
        justify="space-between"
        align="center"
        className="p-4 rounded-2xl outline outline-[1.24px] outline-gray-200"
    >
        <Flex align="center" gap={12} className="min-w-0 flex-1">
            <Flex
                align="center"
                justify="center"
                className="w-12 h-12 bg-orange-50 rounded-full shrink-0"
            >
                <Typography.Text className="!text-red-300 !text-lg !font-semibold">
                    {initials}
                </Typography.Text>
            </Flex>
            <Flex vertical className="min-w-0">
                <Typography.Text className="!text-gray-900 !text-lg !font-medium !leading-6 block truncate">
                    {name}
                </Typography.Text>
                <Typography.Text className="!text-slate-500 !text-xs !leading-6 block truncate">
                    {email}
                </Typography.Text>
                <Typography.Text className="!text-slate-400 !text-xs !leading-6">
                    {date}
                </Typography.Text>
            </Flex>
        </Flex>

        <Flex
            align="center"
            gap={4}
            className={`px-2 py-1 rounded-full outline outline-[0.5px] whitespace-nowrap flex-shrink-0 ${
                status === 'Signed'
                    ? 'bg-emerald-50 outline-emerald-500'
                    : 'bg-yellow-50 outline-yellow-400'
            }`}
        >
            <Typography.Text
                className={`!text-sm !font-normal ${
                    status === 'Signed' ? '!text-emerald-700' : '!text-yellow-600'
                }`}
            >
                {status}
            </Typography.Text>
            {status === 'Signed' && (
                <CheckCircleOutlined className="text-emerald-700 text-sm" />
            )}
        </Flex>
    </Flex>
);

export default SignatoryCard;
