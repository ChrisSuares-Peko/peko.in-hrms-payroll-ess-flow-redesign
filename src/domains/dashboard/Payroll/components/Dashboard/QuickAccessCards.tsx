import { Col, Flex, Row, Typography } from 'antd';
import { useDispatch } from 'react-redux';
import { useNavigate } from 'react-router-dom';

import { quickAccessItems } from '@src/domains/dashboard/Payroll/utils/dashboard/salaryDashboardData';
import { paths } from '@src/routes/paths';
import { showToast } from '@src/slices/apiSlice';

const { Text } = Typography;

const QuickAccessCards = () => {
    const dispatch = useDispatch();
    const navigate = useNavigate();

    return (
        <Flex vertical gap={20}>
            <Text style={{ fontSize: 16, fontWeight: 600, color: '#000000' }}>
                Quick Access
            </Text>
            <Row gutter={[16, 16]}>
                {quickAccessItems.map((item, i) => (
                    <Col key={i} xs={8} sm={8} md={4}>
                        <Flex vertical align="center" gap={12}>
                            <Flex
                                align="center"
                                justify="center"
                                style={{
                                    width: '100%',
                                    maxWidth: 84,
                                    aspectRatio: '1',
                                    background: '#F9F6F5',
                                    borderRadius: 20,
                                    margin: '0 auto',
                                    cursor: 'pointer',
                                }}
                                onClick={() => {
                                    if (item.comingSoon) {
                                        dispatch(showToast({ description: 'Coming Soon', variant: 'info' }));
                                    } else if (item.path) {
                                        navigate(`/${paths.payroll.index}/${paths.payroll[item.path as keyof typeof paths.payroll]}`);
                                    }
                                }}
                            >
                                {item.icon}
                            </Flex>
                            <Text
                                style={{
                                    fontSize: 12,
                                    lineHeight: '16px',
                                    color: '#1F2633',
                                    textAlign: 'center',
                                    width: '100%',
                                    whiteSpace: 'pre-line',
                                }}
                            >
                                {item.label}
                            </Text>
                        </Flex>
                    </Col>
                ))}
            </Row>
        </Flex>
    );
};

export default QuickAccessCards;
