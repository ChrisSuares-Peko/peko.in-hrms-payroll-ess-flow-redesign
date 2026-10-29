import { Badge, Col, Flex, Row, Typography } from 'antd';

import { capitalizeFirstLetter } from './vehicleDetailsHelpers';

const ComplianceFlagsCard = ({ complianceLegalFlags }: any) => (
    <Col xs={24} md={12}>
        <div className="h-full p-6 border rounded-xl !shadow-[0px_1.2px_12.4px_1.1px_rgba(0,0,0,0.06)]">
            <Typography.Text className="text-sm font-semibold">
                Compliance & Legal Flags
            </Typography.Text>
            <Row gutter={[20, 20]} className="mt-4">
                {complianceLegalFlags.map((item: any, index: number) => (
                    <Col xs={12} xl={6} key={index}>
                        <Flex vertical gap={5}>
                            <Typography.Text type="secondary" className="text-xs">
                                {item.label}
                            </Typography.Text>
                            {item.label === 'RC Status' ||
                            item.label === 'Blacklist Status' ? (
                                <Badge
                                    status={
                                        item.value !== 'ACTIVE' ||
                                        item.value === 'Blacklisted'
                                            ? 'error'
                                            : 'success'
                                    }
                                    text={capitalizeFirstLetter(item.value) || 'N/A'}
                                    style={{
                                        color:
                                            item.value === 'ACTIVE' || item.value === 'Yes'
                                                ? '#027A48'
                                                : '#D92D20',
                                        backgroundColor:
                                            item.value === 'ACTIVE' || item.value === 'Yes'
                                                ? '#ECFDF3'
                                                : '#FEF3F2',
                                        padding: '1px 9px',
                                        border: '1px solid transparent',
                                        borderRadius: '15px',
                                    }}
                                />
                            ) : (
                                <Typography.Text className="text-base font-medium">
                                    {item.value || 'N/A'}
                                </Typography.Text>
                            )}
                        </Flex>
                    </Col>
                ))}
            </Row>
        </div>
    </Col>
);

export default ComplianceFlagsCard;
