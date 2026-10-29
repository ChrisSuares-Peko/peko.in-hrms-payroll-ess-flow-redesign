import { Button, Flex, Typography } from 'antd';
import { useNavigate } from 'react-router-dom';

import { paths } from '@src/routes/paths';

import iconTickCircle from '../../assets/icons/icon-tick-circle-success.svg';

const { Text } = Typography;

export default function ComplianceSuccess() {
    const navigate = useNavigate();

    const handleTrack = () => {
        navigate(`${paths.dashboard.compliance}/${paths.compliance.health}`);
    };

    return (
        <Flex
            vertical
            align="center"
            justify="center"
            gap={20}
            className="w-full py-10 text-center"
        >
            <div className="bg-[#e5ffe8] rounded-full p-[17px]">
                <img src={iconTickCircle} alt="Success" width={88} height={88} />
            </div>

            <Text className="!text-[28px] !font-semibold !leading-[38px] !text-[#334155]">
                Compliance Submitted Successfully
            </Text>

            <Text className="!text-[18px] !font-normal !leading-[28px] !text-[#475569] max-w-[540px] block">
                Your compliance details have been submitted and sent for eSign.
                <br />
                Please review and complete the signing process to proceed further.
            </Text>

            <Button
                type="primary"
                onClick={handleTrack}
                className="!h-12 !px-6 !rounded-lg !bg-[#ff4f4f] !border-[#ff4f4f] !font-medium !text-[16px] !flex !items-center !gap-2"
            >
                Track Compliance
                <svg width={20} height={20} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                    <path d="M5 12h14M12 5l7 7-7 7" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
            </Button>
        </Flex>
    );
}
