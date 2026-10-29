import { CheckCircleOutlined, CreditCardOutlined, FieldTimeOutlined } from '@ant-design/icons';
import { Button, Card, Flex, Typography } from 'antd';

import { useCases } from '../utils/data';



interface ENachInfoViewProps {
    onBack: () => void;
    onNext: () => void;
}

const ENachInfoView = ({ onBack, onNext }: ENachInfoViewProps) => (
    <Flex vertical gap={24} className="pt-2">
        <Flex vertical gap={4}>
            <Typography.Title level={4} className="!mb-0 !font-bold">
                eNACH Mandate
            </Typography.Title>
            <Typography.Text className="text-gray-500 text-xs">
                eNACH allows you to automatically debit your customer&apos;s bank account on a recurring basis.
            </Typography.Text>
        </Flex>

        {/* Supported Use Cases */}
        <Card
            bordered={false}
            className="rounded-2xl !shadow-[0px_1.2px_12.4px_1.1px_rgba(0,0,0,0.06)]"
            styles={{ body: { padding: 20 } }}
        >
            <Flex vertical gap={16}>
                <Typography.Text className="font-bold text-base">Supported Use Cases</Typography.Text>
                <Flex vertical gap={10}>
                    {useCases.map(item => (
                        <Card
                            bordered={false}
                            key={item.title}
                            className="rounded-xl bg-gray-50 !shadow-[0px_1.2px_12.4px_1.1px_rgba(0,0,0,0.06)]"
                            styles={{ body: { padding: '12px 16px' } }}
                        >
                            <Flex align="center" gap={12}>
                                <CheckCircleOutlined style={{ fontSize: 18, color: '#16A34A', flexShrink: 0 }} />
                                <Flex vertical gap={2}>
                                    <Typography.Text className="font-semibold text-sm">{item.title}</Typography.Text>
                                    <Typography.Text className="text-gray-500 text-xs">{item.description}</Typography.Text>
                                </Flex>
                            </Flex>
                        </Card>
                    ))}
                </Flex>
            </Flex>
        </Card>

        {/* Requirements */}
        <Card
            bordered={false}
            className="rounded-2xl !shadow-[0px_1.2px_12.4px_1.1px_rgba(0,0,0,0.06)]"
            styles={{ body: { padding: 20 } }}
        >
            <Flex vertical gap={16}>
                <Typography.Text className="font-bold text-base">Requirements</Typography.Text>
                <Flex vertical gap={10}>
                    <Card
                        bordered={false}
                        className="rounded-xl bg-gray-50 !shadow-[0px_1.2px_12.4px_1.1px_rgba(0,0,0,0.06)]"
                        styles={{ body: { padding: '12px 16px' } }}
                    >
                        <Flex align="center" gap={12}>
                            <Flex
                                align="center"
                                justify="center"
                                className="h-9 w-9 rounded-lg"
                                style={{ background: '#F1F5F9', flexShrink: 0 }}
                            >
                                <CreditCardOutlined style={{ color: '#475569', fontSize: 18 }} />
                            </Flex>
                            <Flex vertical gap={2}>
                                <Typography.Text className="font-semibold text-sm">Customer Authorization</Typography.Text>
                                <Typography.Text className="text-gray-500 text-xs">
                                    Your customer needs Net Banking or Debit Card to approve the mandate
                                </Typography.Text>
                            </Flex>
                        </Flex>
                    </Card>

                    <Card
                        className="rounded-xl shadow-none overflow-hidden"
                        styles={{ body: { padding: '12px 16px', background: '#FFFBEB' } }}
                        style={{ border: '1px solid #FDE68A' }}
                    >
                        <Flex align="center" gap={12}>
                            <Flex
                                align="center"
                                justify="center"
                                className="h-9 w-9 rounded-lg"
                                style={{ background: '#FEF3C7', flexShrink: 0 }}
                            >
                                <FieldTimeOutlined style={{ color: '#D97706', fontSize: 18 }} />
                            </Flex>
                            <Flex vertical gap={2}>
                                <Typography.Text className="font-semibold text-sm">Approval Timeline</Typography.Text>
                                <Typography.Text className="text-xs" style={{ color: '#92400E' }}>
                                    Mandate approval may take 1 to 2 working days after customer authorization
                                </Typography.Text>
                            </Flex>
                        </Flex>
                    </Card>
                </Flex>
            </Flex>
        </Card>

        <Flex gap={12} wrap="wrap">
            <Button size="large" className="flex-1" onClick={onBack}>
                Cancel
            </Button>
            <Button type="primary" danger size="large" className="flex-1" onClick={onNext}>
                Create Mandate
            </Button>
        </Flex>
    </Flex>
);

export default ENachInfoView;
