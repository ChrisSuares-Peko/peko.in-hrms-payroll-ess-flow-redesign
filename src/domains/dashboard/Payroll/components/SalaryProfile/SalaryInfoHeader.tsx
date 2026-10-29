import { Button, Col, Flex, Row, Tag, Typography } from 'antd';

const SalaryInfoHeader = () => (
    <Row justify="space-between" align="middle" className="w-full mb-4 mt-6">
        <Col>
            <Flex gap={10} align="center">
                <Typography.Text className="text-lg font-semibold text-gray-800">
                    May 2024 Salary Info
                </Typography.Text>

                <Tag
                    color="#FFF7E6"
                    style={{
                        color: '#FAAD14',
                        borderRadius: 50,
                        height: '22px',
                        fontSize: '12px',
                        display: 'flex',
                        alignItems: 'center',
                        paddingInline: 10,
                    }}
                >
                    ● Pending
                </Tag>
            </Flex>
        </Col>

            <Col>
                <Button type="primary" danger >
                    Process Salary
                </Button>
            </Col>
        </Row>
    );

export default SalaryInfoHeader;
