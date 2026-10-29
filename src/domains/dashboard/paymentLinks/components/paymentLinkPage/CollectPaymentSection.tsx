import { Card, Col, Flex, Row, Typography } from 'antd';

import { CollectPaymentAction } from '../../types/paymentLinkTypes';
import { collectPaymentOptions } from '../../utils/data';

interface CollectPaymentSectionProps {
    onOptionClick: (modalType: CollectPaymentAction) => void;
}

const CollectPaymentSection = ({ onOptionClick }: CollectPaymentSectionProps) => (
    <Flex vertical gap={16}>
        <Typography.Title level={4} className="!mb-0 !font-bold">
            Collect Payment
        </Typography.Title>
        <Row gutter={[16, 16]}>
            {collectPaymentOptions.map(option => (
                <Col xs={24} sm={12} lg={8} key={option.title}>
                    <Card
                        className="rounded-xl cursor-pointer hover:!shadow-md transition-shadow h-full !shadow-[0px_1.2px_12.4px_1.1px_rgba(0,0,0,0.06)]"
                        bordered={false}
                        onClick={() => onOptionClick(option.openModal)}
                    >
                        <Flex vertical gap={12}>
                            <Flex
                                align="center"
                                justify="center"
                                className="w-[50px] h-[50px] rounded-xl p-1"
                                style={{ background: "#F8FAFC" }}
                            >
                                {option.icon}
                            </Flex>
                            <Typography.Text className="font-semibold text-sm">
                                {option.title}
                            </Typography.Text>
                            <Typography.Text className="text-gray-500 text-xs leading-5">
                                {option.description}
                            </Typography.Text>
                        </Flex>
                    </Card>
                </Col>
            ))}
        </Row>
    </Flex>
);

export default CollectPaymentSection;
