import { CheckCircleOutlined, ClockCircleOutlined } from '@ant-design/icons';
import { Flex, Typography } from 'antd';

import TypographyText from '@components/atomic/typography/typographyText';


const mapESignStatus = (status?: string): 'Signed' | 'Pending' | 'Rejected' | 'Expired' => {
    if (!status) return 'Pending';
    if (status === 'COMPLETED') return 'Signed';
    if (status === 'REJECTED') return 'Rejected';
    if (status === 'EXPIRED') return 'Expired';
    return 'Pending';
};

const SignatureRow = ({
    name,
    subtitle,
    status,
}: {
    name: string;
    subtitle: string;
    status: 'Signed' | 'Pending' | 'Rejected' | 'Expired';
}) => {
    const isSigned = status === 'Signed';
    const isRejectedOrExpired = status === 'Rejected' || status === 'Expired';
    
    const getBgColor = () => {
        if (isSigned) return '#ECFDF5';
        if (isRejectedOrExpired) return '#FEE2E2';
        return '#F4F4F5';
    };

    const getIconColor = () => {
        if (isSigned) return '#43B75D';
        if (isRejectedOrExpired) return '#EF4444';
        return '#A1A1AA';
    };

    const getNameColor = () => {
        if (isSigned) return '#15803D';
        if (isRejectedOrExpired) return '#991B1B';
        return '#1E293B';
    };

    const getSubtitleColor = () => {
        if (isSigned) return '#43B75D';
        if (isRejectedOrExpired) return '#EF4444';
        return '#71717A';
    };

    const getStatusColor = () => {
        if (isSigned) return '#43B75D';
        if (isRejectedOrExpired) return '#EF4444';
        return '#71717A';
    };
    
    return (
        <Flex
            justify="space-between"
            align="center"
            className="px-3 py-2 rounded-xl"
            style={{ backgroundColor: getBgColor() }}
        >
            <Flex align="center" gap={10}>
                <CheckCircleOutlined
                    style={{ color: getIconColor(), fontSize: 16 }}
                />
                <Flex vertical gap={1}>
                    <Typography.Text
                        className="text-sm font-semibold"
                        style={{ color: getNameColor() }}
                    >
                        {name}
                    </Typography.Text>
                    <Typography.Text
                        className="text-xs font-normal"
                        style={{ color: getSubtitleColor() }}
                    >
                        {subtitle}
                    </Typography.Text>
                </Flex>
            </Flex>
            <Typography.Text
                className="text-xs font-medium"
                style={{ color: getStatusColor() }}
            >
                {status}
            </Typography.Text>
        </Flex>
    );
};

const SignatureStatusCard = ({
    customerName,
    eSignId,
    eSignStatus,
}: {
    customerName: string;
    eSignId?: number | string;
    eSignStatus?: string;
}) => (
    <Flex vertical className="rounded-2xl border border-[#E5E7EB] p-6 gap-5">
        <TypographyText className="text-sm font-semibold">Signature Status</TypographyText>
        {eSignId ? (
            <Flex vertical gap={8}>
                <SignatureRow
                    name={customerName}
                    subtitle="Client"
                    status={mapESignStatus(eSignStatus)}
                />
            </Flex>
        ) : (
            <Flex align="center" gap={10} className="px-3 py-3 rounded-xl bg-[#F4F4F5]">
                <ClockCircleOutlined style={{ color: '#A1A1AA', fontSize: 16 }} />
                <Typography.Text className="text-sm text-[#71717A]">
                    E-sign invitation not sent yet
                </Typography.Text>
            </Flex>
        )}
    </Flex>
);

export default SignatureStatusCard;
