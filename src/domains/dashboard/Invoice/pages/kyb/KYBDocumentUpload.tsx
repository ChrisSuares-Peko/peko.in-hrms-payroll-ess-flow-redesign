import { ClockCircleOutlined } from '@ant-design/icons';
import { Flex, Typography, Button } from 'antd';
import { Link, useNavigate } from 'react-router-dom';

import { paths } from '@src/routes/paths';

import KYBSteps from '../../components/kyb/KYBSteps';
import useUserAgrement from '../../hooks/useUserAgrement';

const KYBDocumentUpload = () => {
    const navigate = useNavigate();
    const { agreementData } = useUserAgrement();
    return (
        <Flex vertical className="w-full items-center text-center" gap={15}>
            <Typography.Text className="text-2xl font-semibold">
                Let’s help activate your payment link
            </Typography.Text>
            <Typography.Text className="text-base text-gray-500">
                Complete your KYB verification to activate payment links in just 48 hours
            </Typography.Text>
            <KYBSteps current={1} />

            {/* Pending Section */}
            <ClockCircleOutlined className="text-orange-500 text-6xl mt-3 " />
            <Typography.Text className="text-base mt-3">
                Documents upload is still pending,{' '}
                <Typography.Text className="text-[#FF4F4F] underline">
                    <Link
                        to="#"
                        onClick={() => window.open(agreementData?.url, '_blank')}
                        style={{ color: 'red', textDecoration: 'underline' }}
                        className="text-base"
                    >
                        click here to update
                    </Link>
                </Typography.Text>
            </Typography.Text>

            {/* Go Back Button */}
            <Button
                type="default"
                danger
                className="border border-red-500 text-red-500 px-10 mt-7"
                onClick={() => navigate(`/${paths.invoice.index}`)}
            >
                Go back
            </Button>
        </Flex>
    );
};

export default KYBDocumentUpload;
