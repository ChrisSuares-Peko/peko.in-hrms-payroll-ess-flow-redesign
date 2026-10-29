import { ClockCircleOutlined } from '@ant-design/icons';
import { Flex, Typography, Button } from 'antd';
import { useNavigate } from 'react-router-dom';

import { paths } from '@src/routes/paths';

import useUserAgrement from '../../hooks/useUserAgrement';

const KYBVerification = () => {
    const navigate = useNavigate();
    useUserAgrement();
    return (
        <Flex vertical className="w-full items-center text-center" gap={15}>
            <ClockCircleOutlined className="text-orange-500 text-6xl mt-12 " />
            <Typography.Text className="text-[24px] leading-[40.31px] font-medium">
                We have submitted your KYB for verification
            </Typography.Text>

            <Typography.Text className="text-base text-gray-500">
                We have submitted your KYB for verification
            </Typography.Text>

            {/* Go Back Button */}
            <Button
                type="default"
                danger
                className="border border-red-500 text-red-500 px-10 mt-2"
                onClick={() => navigate(`/${paths.invoice.index}`)}
            >
                Go back to Invoicing
            </Button>
        </Flex>
    );
};

export default KYBVerification;
