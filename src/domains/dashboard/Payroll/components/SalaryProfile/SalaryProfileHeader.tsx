import { DownloadOutlined } from '@ant-design/icons';
import { Flex, Typography, Avatar, Row, Col, Button } from 'antd';

import { getInitials } from '../../utils/employeeDetails/data';

interface LeaveSummaryHeaderProps {}

const SalaryProfileHeader: React.FC<LeaveSummaryHeaderProps> = () => (
    <Row gutter={[20, 20]}>
        <Col>
            <Avatar size={64} style={{ backgroundColor: '#fde3cf', color: '#f56a00' }}>
                {getInitials('John Doe')}
            </Avatar>
        </Col>
        <Col>
            <Flex vertical justify="center">
                <Typography.Text className="text-xl font-semibold text-gray-800">
                    John Doe
                </Typography.Text>
                <Flex align="center" gap={10}>
                    <Typography.Text className="text-sm text-gray-600">
                        Software Developer
                    </Typography.Text>
                </Flex>
            </Flex>
        </Col>
        <Col>
            <Button
                type="text"
                icon={<DownloadOutlined />}
                className="text-green-600 font-medium text-sm"
                style={{
                    background: 'transparent',
                    display: 'flex',
                    alignItems: 'center',
                }}
            >
                Download Salary Certificate
            </Button>
        </Col>
    </Row>
);

export default SalaryProfileHeader;
