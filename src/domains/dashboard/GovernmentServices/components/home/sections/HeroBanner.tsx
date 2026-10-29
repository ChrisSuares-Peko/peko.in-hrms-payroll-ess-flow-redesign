import { Button, Flex, Typography } from 'antd';
import { useNavigate } from 'react-router-dom';

import { paths } from '@src/routes/paths';

const { Title, Text } = Typography;

const HeroBanner = () => {
    const navigate = useNavigate();

    return (
        <Flex vertical gap={12} className="rounded-2xl p-6" style={{ backgroundColor: '#FEF2F2', }}>
            <Title level={5} className="!mb-0 !font-semibold">
                Register Your Business with Government Benefits
            </Title>
            <Text className="text-gray-500 text-sm">
                Access tax benefits, subsidies, and legal protection through government registrations
            </Text>
            <Button
                type="primary"
                danger
                style={{ width: 'fit-content' }}
                onClick={() => navigate(`${paths.dashboard.governmentServices}/explore`)}
            >
                Explore services &nbsp;→
            </Button>
        </Flex>
    );
};

export default HeroBanner;
