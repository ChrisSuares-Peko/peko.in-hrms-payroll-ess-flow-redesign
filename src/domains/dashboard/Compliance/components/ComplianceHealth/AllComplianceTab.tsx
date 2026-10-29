import { Col, Flex, Row, Typography } from 'antd';

import { ComplianceCard } from './ComplianceCard';
import { type ComplianceHealthItem } from '../../utils/data';

const { Text } = Typography;

interface AllComplianceTabProps {
    items: ComplianceHealthItem[];
}

export function AllComplianceTab({ items }: AllComplianceTabProps) {
    if (items.length === 0) {
        return (
            <Flex justify="center" align="center" className="py-20">
                <Text className="!text-[16px] !text-[#6a7282]">
                    No compliance items found for the selected filters.
                </Text>
            </Flex>
        );
    }

    return (
        <Row gutter={[24, 24]}>
            {items.map((item) => (
                <Col xs={24} lg={12} key={item.id} className="!flex">
                    <div className="w-full h-full">
                        <ComplianceCard item={item} />
                    </div>
                </Col>
            ))}
        </Row>
    );
}
